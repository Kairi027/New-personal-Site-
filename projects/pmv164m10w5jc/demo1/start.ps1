# ============================================================
# 本地生活综合服务系统 - 一键启动脚本 (PowerShell)
# 用法: powershell -ExecutionPolicy Bypass -File start.ps1
#
# 零依赖启动：无需 Docker，后端使用 SQLite + 内存降级，
# 前端使用 Vite 开发服务器。
# ============================================================

$ROOT = $PSScriptRoot
$jobs = @()

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  本地生活综合服务系统 - 一键启动 (零依赖)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# ---------- 0. 环境检查 ----------
Write-Host "`n[0/3] 检查运行环境..." -ForegroundColor Magenta
$pythonCmd = Get-Command "python" -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "[ERROR] 未检测到 Python，请先安装 Python 3.10+" -ForegroundColor Red
    exit 1
}
$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "[ERROR] 未检测到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Python: $(python --version 2>&1)" -ForegroundColor Green
Write-Host "[OK] Node.js: $(node --version 2>&1)" -ForegroundColor Green

# ---------- 1. 启动后端 ----------
Write-Host "`n[1/3] 启动服务器端 (FastAPI :8000, SQLite 零安装)..." -ForegroundColor Magenta
$serverDir = "$ROOT\server"
if (-not (Test-Path "$serverDir\.venv")) {
    Write-Host "  首次运行，创建虚拟环境并安装依赖..." -ForegroundColor Yellow
    python -m venv "$serverDir\.venv"
    & "$serverDir\.venv\Scripts\pip.exe" install -e "$serverDir" -i https://pypi.tuna.tsinghua.edu.cn/simple
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 依赖安装失败，请检查网络或手动运行 pip install" -ForegroundColor Red
        exit 1
    }
}
$jobs += Start-Job -ScriptBlock {
    param($d)
    Set-Location $d
    & ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} -ArgumentList $serverDir
Start-Sleep -Seconds 4
Write-Host "[OK] 服务器端: http://127.0.0.1:8000  (API文档: /docs)" -ForegroundColor Green

# ---------- 2. 启动客户端 Web ----------
Write-Host "`n[2/3] 启动客户端 Web (Vite :5173)..." -ForegroundColor Magenta
$webDir = "$ROOT\client-web"
if (-not (Test-Path "$webDir\node_modules")) {
    Write-Host "  首次运行，安装前端依赖..." -ForegroundColor Yellow
    Push-Location $webDir
    npm.cmd install
    Pop-Location
}
$jobs += Start-Job -ScriptBlock {
    param($d)
    Set-Location $d
    & ".\node_modules\.bin\vite.cmd" --port 5173
} -ArgumentList $webDir
Start-Sleep -Seconds 3
Write-Host "[OK] 客户端 Web: http://127.0.0.1:5173" -ForegroundColor Green

# ---------- 3. 启动管理后台 ----------
Write-Host "`n[3/3] 启动管理后台 (Vite :5174)..." -ForegroundColor Magenta
$adminDir = "$ROOT\admin"
if (-not (Test-Path "$adminDir\node_modules")) {
    Write-Host "  首次运行，安装管理端依赖..." -ForegroundColor Yellow
    Push-Location $adminDir
    npm.cmd install
    Pop-Location
}
$jobs += Start-Job -ScriptBlock {
    param($d)
    Set-Location $d
    & ".\node_modules\.bin\vite.cmd" --port 5174
} -ArgumentList $adminDir
Start-Sleep -Seconds 3
Write-Host "[OK] 管理后台: http://127.0.0.1:5174" -ForegroundColor Green

# ---------- 完成 ----------
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  启动完成! 请在浏览器中打开:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  客户端 Web:  http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  管理后台:    http://127.0.0.1:5174" -ForegroundColor White
Write-Host "  API 文档:     http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "`n  数据存储:    SQLite (server/local_life.db)" -ForegroundColor DarkGray
Write-Host "  缓存:        内存降级 (无需 Redis)" -ForegroundColor DarkGray
Write-Host "`n  按 Ctrl+C 停止所有服务" -ForegroundColor DarkGray
Write-Host "================================================`n" -ForegroundColor Cyan

# 自动打开浏览器
Start-Process "http://127.0.0.1:5173"
Start-Process "http://127.0.0.1:5174"

# 保持运行
try {
    while ($true) { Start-Sleep -Seconds 10 }
} finally {
    Write-Host "`n正在停止所有服务..." -ForegroundColor Yellow
    $jobs | Stop-Job -ErrorAction SilentlyContinue
    $jobs | Remove-Job -ErrorAction SilentlyContinue
    Write-Host "已停止" -ForegroundColor Green
}
