param(
    [int]$MaxAttempts = 8,
    [int]$DelaySeconds = 12,
    [int]$TimeoutSec = 1200
)

$ErrorActionPreference = 'Continue'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logFile = Join-Path $projectRoot 'tmp\deploy-auto.log'
New-Item -ItemType Directory -Force (Split-Path $logFile) | Out-Null
$nextBuildDir = Join-Path $projectRoot ".next"

$projectConfigPath = Join-Path $projectRoot '.vercel\project.json'
if (-not (Test-Path $projectConfigPath)) {
    Write-Host "Missing .vercel/project.json. Unable to enforce deploy target. Aborting." -ForegroundColor Red
    Add-Content -Path $logFile -Value "Missing .vercel/project.json. Unable to enforce deploy target. Aborting."
    exit 1
}

$projectConfig = Get-Content $projectConfigPath -Raw | ConvertFrom-Json
$expectedProjectFromConfig = [string]$projectConfig.projectName
$expectedOrgFromConfig = [string]$projectConfig.orgId

$envTargetProject = [string]$env:VERCEL_TARGET_PROJECT_NAME
if (-not [string]::IsNullOrWhiteSpace($envTargetProject) -and $envTargetProject -ne $expectedProjectFromConfig) {
    Write-Host "VERCEL_TARGET_PROJECT_NAME override mismatch. Expected '$expectedProjectFromConfig' but got '$envTargetProject'. Aborting." -ForegroundColor Red
    Add-Content -Path $logFile -Value "VERCEL_TARGET_PROJECT_NAME override mismatch. Expected '$expectedProjectFromConfig' but got '$envTargetProject'. Aborting."
    exit 1
}

$expectedProject = $expectedProjectFromConfig
$targetDomain = if ([string]::IsNullOrWhiteSpace($env:VERCEL_TARGET_DOMAIN)) { $null } else { $env:VERCEL_TARGET_DOMAIN }
if ([string]::IsNullOrWhiteSpace($expectedProject)) {
    Write-Host "Could not resolve expected project name from .vercel/project.json. Aborting." -ForegroundColor Red
    Add-Content -Path $logFile -Value "Could not resolve expected project name from .vercel/project.json. Aborting."
    exit 1
}
if ([string]::IsNullOrWhiteSpace($expectedOrgFromConfig)) {
    Write-Host "Could not resolve expected org id from .vercel/project.json. Aborting." -ForegroundColor Red
    Add-Content -Path $logFile -Value "Could not resolve expected org id from .vercel/project.json. Aborting."
    exit 1
}
if (-not (Test-Path $nextBuildDir)) {
    Write-Host "Prebuilt artifacts not found. Falling back to remote build." -ForegroundColor Yellow
    Add-Content -Path $logFile -Value "Prebuilt artifacts not found. Falling back to remote build."
}

$usePrebuilt = Test-Path $nextBuildDir
$deployArgsBase = @('--scope', $expectedOrgFromConfig, '--prod', '--yes')

for ($i = 1; $i -le $MaxAttempts; $i++) {
    $time = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Write-Host "[$time] deploy attempt $i / $MaxAttempts"
    Add-Content -Path $logFile -Value "[$time] deploy attempt $i / $MaxAttempts"
    Add-Content -Path $logFile -Value "Target project: $expectedProject"
    if ($targetDomain) {
        Add-Content -Path $logFile -Value "Target domain: $targetDomain"
    }
    Add-Content -Path $logFile -Value "Target scope: $expectedOrgFromConfig"
    Add-Content -Path $logFile -Value "Project root: $projectRoot"
    Add-Content -Path $logFile -Value "Deployment mode: $(if ($usePrebuilt) { 'prebuilt' } else { 'remote' })"

    $outPath = Join-Path $env:TEMP "vercel_out_$i.txt"
    $errPath = Join-Path $env:TEMP "vercel_err_$i.txt"

    $deployArgs = if ($usePrebuilt) {
        @('deploy') + $deployArgsBase
    } else {
        $deployArgsBase
    }
    $deployCommand = 'vercel ' + ($deployArgs -join ' ')
    Add-Content -Path $logFile -Value "Deploy command: $deployCommand"
    $process = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', $deployCommand) -WorkingDirectory $projectRoot -NoNewWindow -PassThru -RedirectStandardOutput $outPath -RedirectStandardError $errPath
    if (-not $process) {
        Write-Host "Unable to start vercel process." -ForegroundColor Red
        Add-Content -Path $logFile -Value "Unable to start vercel process."
        exit 1
    }

    if (-not $process.WaitForExit($TimeoutSec * 1000)) {
        Write-Host "Deployment timed out after $TimeoutSec seconds." -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "Deployment timed out after $TimeoutSec seconds."
        $process.Kill()
        if ($i -ge $MaxAttempts) { exit 1 }
    }

    $stdout = Get-Content $outPath -Raw
    $stderr = Get-Content $errPath -Raw
    if (-not [string]::IsNullOrWhiteSpace($stdout)) { Add-Content -Path $logFile -Value $stdout }
    if (-not [string]::IsNullOrWhiteSpace($stderr)) { Add-Content -Path $logFile -Value $stderr }

    $prebuiltFailure = $usePrebuilt -and (($stdout -match "Prebuilt deployment cannot be created because") -or ($stderr -match "Prebuilt deployment cannot be created because"))
    if ($prebuiltFailure) {
        Write-Host "Prebuilt deploy failed. Falling back to remote build mode for next attempt." -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "Prebuilt deploy failed. Fallback to remote build mode."
        $usePrebuilt = $false
        if ($i -ge $MaxAttempts) { $i -= 1 }
        Start-Sleep -Seconds 1
        continue
    }

    $isInternalError = ($stdout -match "We encountered an internal error|Error: We encountered an internal error") -or ($stderr -match "We encountered an internal error|Error: We encountered an internal error")
    $isDBError = ($stdout -match "Can.t reach database server|prisma:error|database server") -or ($stderr -match "Can.t reach database server|prisma:error|database server")
    $isRateLimit = ($stdout -match "api-deployments-free-per-day") -or ($stderr -match "api-deployments-free-per-day")
    $isDeploySuccess = ($stdout -match "Production:\s+https://")

    $isLinkedForTarget = $false
    if ($stdout -match ("Linked to .*?/" + [regex]::Escape($expectedProject))) { $isLinkedForTarget = $true }
    if ($stderr -match ("Linked to .*?/" + [regex]::Escape($expectedProject))) { $isLinkedForTarget = $true }

    $isDeployingForTarget = $false
    if ($stdout -match ("Deploying .*?/" + [regex]::Escape($expectedProject))) { $isDeployingForTarget = $true }
    if ($stderr -match ("Deploying .*?/" + [regex]::Escape($expectedProject))) { $isDeployingForTarget = $true }

    $isProductionForTarget = $false
    if ($stdout -match "Production:\s+https://([A-Za-z0-9-]+)") {
        $isProductionForTarget = $Matches[1] -like "$expectedProject-*"
    }

    $isCorrectProject = $isLinkedForTarget -or $isDeployingForTarget -or $isProductionForTarget

    if ($targetDomain) {
        $targetDomainEscaped = [regex]::Escape($targetDomain)
        $hasTargetDomain = ($stdout -match $targetDomainEscaped) -or ($stderr -match $targetDomainEscaped)
        if (-not $hasTargetDomain) {
            $isCorrectProject = $false
        }
    }

    if (-not $isCorrectProject) {
        Write-Host "Deployment target mismatch. Expected project '$expectedProject'." -ForegroundColor Red
        Add-Content -Path $logFile -Value "Deployment target mismatch. Expected project '$expectedProject' but vercel output did not confirm."
        Add-Content -Path $logFile -Value "stdout:`n$stdout"
        Add-Content -Path $logFile -Value "stderr:`n$stderr"
        exit 1
    }

    if ($isDeploySuccess -and -not $isInternalError -and -not $isDBError -and -not $isRateLimit) {
        Write-Host "Deployment succeeded." -ForegroundColor Green
        Add-Content -Path $logFile -Value "Deployment succeeded."
        exit 0
    }

    if ($isRateLimit) {
        Write-Host "Vercel deployment rate limit reached. Retry stopped automatically." -ForegroundColor Red
        Add-Content -Path $logFile -Value "Rate limit reached. Retry stopped automatically."
        exit 2
    }

    if ($i -ge $MaxAttempts) {
        Write-Host "All attempts failed. Last exit code: $($process.ExitCode)" -ForegroundColor Red
        Add-Content -Path $logFile -Value "All attempts failed. Last exit code: $($process.ExitCode)"
        exit 1
    }

    if ($isDBError) {
        Write-Host "DB error detected. Retrying after $DelaySeconds seconds..." -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "DB error detected. retrying after $DelaySeconds seconds."
    } else {
        Write-Host "Vercel infra error detected. Retrying after $DelaySeconds seconds..." -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "infra/deploy error detected. retrying after $DelaySeconds seconds."
    }
    Start-Sleep -Seconds $DelaySeconds
}
