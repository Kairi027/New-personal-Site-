# 快速预览客户端界面（仅前端，无需后端/Docker）
# 用法: powershell -ExecutionPolicy Bypass -File preview.ps1

$ROOT = $PSScriptRoot
$jobs = @()

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  客户端界面快速预览" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# ---------- 客户端 Web ----------
Write-Host "`n[1/2] 启动客户端 Web (:5173)..." -ForegroundColor Magenta
$webDir = "$ROOT\client-web"
if (-not (Test-Path "$webDir\node_modules")) {
    Write-Host "  安装依赖中..." -ForegroundColor Yellow
    Push-Location $webDir
    npm.cmd install
    Pop-Location
}
$jobs += Start-Job -ScriptBlock {
    param($d)
    Set-Location $d
    npx.cmd vite --port 5173
} -ArgumentList $webDir
Start-Sleep -Seconds 3
Write-Host "[OK] http://127.0.0.1:5173" -ForegroundColor Green

# ---------- 管理后台 ----------
Write-Host "`n[2/2] 启动管理后台 (:5174)..." -ForegroundColor Magenta
$adminDir = "$ROOT\admin"
if (-not (Test-Path "$adminDir\node_modules")) {
    Write-Host "  安装依赖中..." -ForegroundColor Yellow
    Push-Location $adminDir
    npm.cmd install
    Pop-Location
}
$jobs += Start-Job -ScriptBlock {
    param($d)
    Set-Location $d
    npx.cmd vite --port 5174
} -ArgumentList $adminDir
Start-Sleep -Seconds 3
Write-Host "[OK] http://127.0.0.1:5174" -ForegroundColor Green

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  预览地址:" -ForegroundColor Cyan
Write-Host "    客户端 Web:  http://127.0.0.1:5173" -ForegroundColor White
Write-Host "    管理后台:    http://127.0.0.1:5174" -ForegroundColor White
Write-Host "  按 Ctrl+C 停止" -ForegroundColor DarkGray
Write-Host "================================================`n" -ForegroundColor Cyan

Start-Process "http://127.0.0.1:5173"
Start-Process "http://127.0.0.1:5174"

try {
    while ($true) { Start-Sleep -Seconds 10 }
} finally {
    $jobs | Stop-Job -ErrorAction SilentlyContinue
    $jobs | Remove-Job -ErrorAction SilentlyContinue
}