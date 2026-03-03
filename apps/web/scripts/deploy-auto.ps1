param(
    [int]$MaxAttempts = 8,
    [int]$DelaySeconds = 12,
    [int]$TimeoutSec = 1200
)

$ErrorActionPreference = 'Continue'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logFile = Join-Path $projectRoot 'tmp\deploy-auto.log'
New-Item -ItemType Directory -Force (Split-Path $logFile) | Out-Null
$vercelOutputDir = Join-Path $projectRoot ".vercel\output"
$vercelOutputConfig = Join-Path $vercelOutputDir "config.json"

$projectConfigPath = Join-Path $projectRoot '.vercel\project.json'
if (-not (Test-Path $projectConfigPath)) {
    Write-Host "Missing .vercel/project.json. Unable to enforce deploy target. Aborting." -ForegroundColor Red
    Add-Content -Path $logFile -Value "Missing .vercel/project.json. Unable to enforce deploy target. Aborting."
    exit 1
}

$projectConfig = Get-Content $projectConfigPath -Raw | ConvertFrom-Json
$expectedProjectFromConfig = [string]$projectConfig.projectName
$expectedOrgFromConfig = [string]$projectConfig.orgId
$expectedCanonicalAliasFromConfig = if ($projectConfig.PSObject.Properties.Name -contains 'canonicalAlias') { [string]$projectConfig.canonicalAlias } else { $null }

$envTargetProject = [string]$env:VERCEL_TARGET_PROJECT_NAME
if (-not [string]::IsNullOrWhiteSpace($envTargetProject) -and $envTargetProject -ne $expectedProjectFromConfig) {
    Write-Host "VERCEL_TARGET_PROJECT_NAME override mismatch. Expected '$expectedProjectFromConfig' but got '$envTargetProject'. Aborting." -ForegroundColor Red
    Add-Content -Path $logFile -Value "VERCEL_TARGET_PROJECT_NAME override mismatch. Expected '$expectedProjectFromConfig' but got '$envTargetProject'. Aborting."
    exit 1
}

$expectedProject = $expectedProjectFromConfig
$targetDomain = if ([string]::IsNullOrWhiteSpace($env:VERCEL_TARGET_DOMAIN)) { $null } else { $env:VERCEL_TARGET_DOMAIN }
$envCanonicalAlias = if ([string]::IsNullOrWhiteSpace($env:VERCEL_CANONICAL_ALIAS)) { $null } else { [string]$env:VERCEL_CANONICAL_ALIAS }
$canonicalAlias = if (-not [string]::IsNullOrWhiteSpace($envCanonicalAlias)) {
    $envCanonicalAlias
} elseif (-not [string]::IsNullOrWhiteSpace($expectedCanonicalAliasFromConfig)) {
    $expectedCanonicalAliasFromConfig
} else {
    $targetDomain
}

if ([string]::IsNullOrWhiteSpace($canonicalAlias) -and -not [string]::IsNullOrWhiteSpace($targetDomain)) {
    $canonicalAlias = $targetDomain
}

$normalizedAlias = if (-not [string]::IsNullOrWhiteSpace($canonicalAlias)) { $canonicalAlias.Trim().TrimEnd('/') } else { $null }
if (-not [string]::IsNullOrWhiteSpace($normalizedAlias) -and $normalizedAlias -match '^https?://') {
    $normalizedAlias = $normalizedAlias -replace '^https?://', ''
}

$projectEscaped = [regex]::Escape($expectedProject)
$isLikelyDeploymentUrl = if (-not [string]::IsNullOrWhiteSpace($normalizedAlias)) {
    ($normalizedAlias -match ("^$projectEscaped-[a-z0-9]{8}\.vercel\.app$")) -or
    ($normalizedAlias -match ("^$projectEscaped-git-[a-z0-9]{6,}\.vercel\.app$"))
} else {
    $false
}

if ($isLikelyDeploymentUrl) {
    Write-Host "VERCEL_TARGET_DOMAIN / canonicalAlias looks like a deployment URL ('$normalizedAlias').`nSet VERCEL_CANONICAL_ALIAS to a fixed alias instead (example: revieweverything-web-piwpiw99.vercel.app)." -ForegroundColor Red
    Add-Content -Path $logFile -Value "canonical alias '$normalizedAlias' looks like a deployment URL."
    exit 1
}
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
if ([string]::IsNullOrWhiteSpace($normalizedAlias)) {
    Write-Host "Canonical alias is missing. Set 'canonicalAlias' in .vercel/project.json or VERCEL_CANONICAL_ALIAS." -ForegroundColor Red
    Add-Content -Path $logFile -Value "Canonical alias is missing. Aborting."
    exit 1
}
$prebuiltRequested = [string]$env:VERCEL_USE_PREBUILT
$allowPrebuilt = (-not [string]::IsNullOrWhiteSpace($prebuiltRequested)) -and ($prebuiltRequested -match '^(1|true|yes)$')
if ($allowPrebuilt -and -not (Test-Path $vercelOutputConfig)) {
    Write-Host "VERCEL_USE_PREBUILT is enabled but .vercel/output/config.json is missing. Falling back to remote build." -ForegroundColor Yellow
    Add-Content -Path $logFile -Value "VERCEL_USE_PREBUILT enabled but prebuilt artifacts are missing. Falling back to remote build."
}
if (-not $allowPrebuilt) {
    Add-Content -Path $logFile -Value "VERCEL_USE_PREBUILT is not enabled. Using remote build by default."
}

$usePrebuilt = $allowPrebuilt -and (Test-Path $vercelOutputConfig)
$deployArgsBase = @('--scope', $expectedOrgFromConfig, '--prod', '--yes')

for ($i = 1; $i -le $MaxAttempts; $i++) {
    $time = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Write-Host "[$time] deploy attempt $i / $MaxAttempts"
    Add-Content -Path $logFile -Value "[$time] deploy attempt $i / $MaxAttempts"
    Add-Content -Path $logFile -Value "Target project: $expectedProject"
    if ($targetDomain) {
        Add-Content -Path $logFile -Value "Target domain: $targetDomain"
    }
    Add-Content -Path $logFile -Value "Canonical alias: $normalizedAlias"
    Add-Content -Path $logFile -Value "Target scope: $expectedOrgFromConfig"
    Add-Content -Path $logFile -Value "Project root: $projectRoot"
    Add-Content -Path $logFile -Value "Deployment mode: $(if ($usePrebuilt) { 'prebuilt' } else { 'remote' })"

    $outPath = Join-Path $env:TEMP "vercel_out_$i.txt"
    $errPath = Join-Path $env:TEMP "vercel_err_$i.txt"

    $deployArgs = if ($usePrebuilt) {
        @('deploy', '--prebuilt') + $deployArgsBase
    } else {
        @('deploy') + $deployArgsBase
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
        Start-Sleep -Seconds $DelaySeconds
        continue
    }

    $stdout = Get-Content $outPath -Raw
    $stderr = Get-Content $errPath -Raw
    $combined = "$stdout`r`n$stderr"
    if (-not [string]::IsNullOrWhiteSpace($stdout)) { Add-Content -Path $logFile -Value $stdout }
    if (-not [string]::IsNullOrWhiteSpace($stderr)) { Add-Content -Path $logFile -Value $stderr }

    $prebuiltFailure = $usePrebuilt -and ($combined -match "Prebuilt deployment cannot be created because|No prebuilt output found|Could not find prebuilt")
    if ($prebuiltFailure) {
        Write-Host "Prebuilt deploy failed. Falling back to remote build mode for next attempt." -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "Prebuilt deploy failed. Fallback to remote build mode."
        $usePrebuilt = $false
        if ($i -ge $MaxAttempts) { $i -= 1 }
        Start-Sleep -Seconds 1
        continue
    }

    $isInternalError = ($combined -match "We encountered an internal error|Error: We encountered an internal error")
    $isDBError = ($combined -match "Can.t reach database server|prisma:error|database server")
    $isRateLimit = ($combined -match "api-deployments-free-per-day")
    $isDeploySuccess = ($combined -match "Production:\s+https://")

    $isLinkedForTarget = $false
    if ($combined -match ("Linked to .*?/" + [regex]::Escape($expectedProject))) { $isLinkedForTarget = $true }
    if ($combined -match ("Deploying .*?/" + [regex]::Escape($expectedProject))) { $isLinkedForTarget = $true }

    $isDeployingForTarget = $false
    if ($combined -match ("Deploying .*?/" + [regex]::Escape($expectedProject))) { $isDeployingForTarget = $true }

    $isProductionForTarget = $false
    if ($combined -match "Production:\s+https://([A-Za-z0-9-]+)") {
        $isProductionForTarget = $Matches[1] -like "$expectedProject-*"
    }

    $isCorrectProject = $isLinkedForTarget -or $isDeployingForTarget -or $isProductionForTarget

    if (-not $isCorrectProject) {
        Write-Host "Deployment target mismatch. Expected project '$expectedProject'." -ForegroundColor Red
        Add-Content -Path $logFile -Value "Deployment target mismatch. Expected project '$expectedProject' but vercel output did not confirm."
        Add-Content -Path $logFile -Value "stdout:`n$stdout"
        Add-Content -Path $logFile -Value "stderr:`n$stderr"
        exit 1
    }

    if ($isDeploySuccess -and -not $isInternalError -and -not $isDBError -and -not $isRateLimit) {
        $deploymentUrl = $null
        $deployUrlMatch = [regex]::Match($combined, 'Production:\s+(https://[^\s\r\n]+)')
        if ($deployUrlMatch.Success) {
            $deploymentUrl = $deployUrlMatch.Groups[1].Value
        }

        if (-not [string]::IsNullOrWhiteSpace($normalizedAlias) -and -not [string]::IsNullOrWhiteSpace($deploymentUrl)) {
            Add-Content -Path $logFile -Value "Deploy output production URL: $deploymentUrl"
            Add-Content -Path $logFile -Value "Canonical alias target: $normalizedAlias"

            $aliasArgs = @('alias', 'set', $deploymentUrl, $normalizedAlias, '--scope', $expectedOrgFromConfig)
            $aliasOutPath = Join-Path $env:TEMP "vercel_alias_out_$i.txt"
            $aliasErrPath = Join-Path $env:TEMP "vercel_alias_err_$i.txt"
            $aliasProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', ('vercel ' + ($aliasArgs -join ' '))) -WorkingDirectory $projectRoot -NoNewWindow -PassThru -RedirectStandardOutput $aliasOutPath -RedirectStandardError $aliasErrPath

            if (-not $aliasProcess) {
                Write-Host "Unable to start vercel alias command." -ForegroundColor Red
                Add-Content -Path $logFile -Value "Unable to start vercel alias command."
                exit 1
            }
            if (-not $aliasProcess.WaitForExit(120000)) {
                Write-Host "Alias assignment timed out after 120 seconds." -ForegroundColor Red
                Add-Content -Path $logFile -Value "Alias assignment timed out after 120 seconds."
                $aliasProcess.Kill()
                exit 1
            }

            $aliasOut = Get-Content $aliasOutPath -Raw
            $aliasErr = Get-Content $aliasErrPath -Raw
            $aliasCombined = "$aliasOut`r`n$aliasErr"
            if (-not [string]::IsNullOrWhiteSpace($aliasOut)) { Add-Content -Path $logFile -Value $aliasOut }
            if (-not [string]::IsNullOrWhiteSpace($aliasErr)) { Add-Content -Path $logFile -Value $aliasErr }

            $aliasSucceeded = ($aliasProcess.ExitCode -eq 0) -or ($aliasCombined -match 'Success!') -or ($aliasCombined -match 'already points to') -or ($aliasCombined -match 'already assigned')
            if (-not $aliasSucceeded) {
                Write-Host "Alias assignment failed: fixed URL must be available for 'alias set'." -ForegroundColor Red
                Add-Content -Path $logFile -Value "Alias assignment failed for '$normalizedAlias'."
                Add-Content -Path $logFile -Value $aliasCombined
                exit 1
            }
        } elseif (-not [string]::IsNullOrWhiteSpace($normalizedAlias)) {
            Write-Host "Deployment succeeded but production URL was not parsed; cannot enforce canonical alias '$normalizedAlias'." -ForegroundColor Red
            Add-Content -Path $logFile -Value "Deployment URL parse failed while enforcing canonical alias '$normalizedAlias'."
            exit 1
        }

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
