param(
    [int]$MaxAttempts = 8,
    [int]$DelaySeconds = 12,
    [int]$TimeoutSec = 1200
)

$ErrorActionPreference = 'Continue'
$logFile = Join-Path (Join-Path $PSScriptRoot '..\\tmp') 'deploy-auto.log'
New-Item -ItemType Directory -Force (Split-Path $logFile) | Out-Null

for ($i = 1; $i -le $MaxAttempts; $i++) {
    $time = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Write-Host "[$time] deploy attempt $i / $MaxAttempts"
    Add-Content -Path $logFile -Value "[$time] deploy attempt $i / $MaxAttempts"

    $outPath = Join-Path $env:TEMP "vercel_out_$i.txt"
    $errPath = Join-Path $env:TEMP "vercel_err_$i.txt"

    $appRoot = Split-Path $PSScriptRoot -Parent
    $process = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', 'vercel --prod --yes') -WorkingDirectory $appRoot -NoNewWindow -PassThru -RedirectStandardOutput $outPath -RedirectStandardError $errPath
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

    $isInternalError = ($stdout -match "We encountered an internal error|Error: We encountered an internal error") -or ($stderr -match "We encountered an internal error|Error: We encountered an internal error")
    $isDBError = ($stdout -match "Can.t reach database server|prisma:error|database server") -or ($stderr -match "Can.t reach database server|prisma:error|database server")
    $isDeploySuccess = ($stdout -match "Production:\s+https://")

    if ($isDeploySuccess -and -not $isInternalError -and -not $isDBError) {
        Write-Host "Deployment succeeded." -ForegroundColor Green
        Add-Content -Path $logFile -Value "Deployment succeeded."
        exit 0
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