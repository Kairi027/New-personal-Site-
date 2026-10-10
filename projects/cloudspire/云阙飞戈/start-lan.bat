@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "PORT=5173"
set "QR_OUT=tools\browser-preview\cloudspire-lan-qr.png"

echo ================================================
echo   云阙飞戈 - 局域网联机测试
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未找到 Node.js，请先安装: https://nodejs.org/
  pause
  exit /b 1
)

echo [1/3] 构建浏览器预览包...
call node tools\browser-preview\build.js
if errorlevel 1 (
  echo [错误] 构建失败，请检查代码后重试。
  pause
  exit /b 1
)

echo [2/3] 启动本地服务（端口 %PORT%）...
curl -s -o nul http://127.0.0.1:%PORT%/
if errorlevel 1 (
  start "云阙飞戈-服务器" cmd /k "chcp 65001>nul && node tools\browser-preview\server.js %PORT%"
  echo 等待服务就绪...
  set "TRY=0"
  :wait_lan_ready
  set /a TRY+=1
  if !TRY! gtr 30 (
    echo [错误] 服务启动超时。若端口被占用，请关闭占用程序后重试。
    pause
    exit /b 1
  )
  timeout /t 1 /nobreak >nul
  curl -s -o nul http://127.0.0.1:%PORT%/
  if errorlevel 1 goto wait_lan_ready
) else (
  echo 端口 %PORT% 已有服务在运行，直接复用。
)
echo 服务已就绪。
echo.

echo [3/3] 获取局域网地址并生成二维码...
set "FIRST_URL="
for /f "usebackq delims=" %%u in (`node tools\browser-preview\lan-urls.js %PORT%`) do (
  echo   局域网地址: %%u
  if not defined FIRST_URL set "FIRST_URL=%%u"
)
if not defined FIRST_URL (
  echo [提示] 未找到局域网 IP，仅本机可访问。
  set "FIRST_URL=http://127.0.0.1:%PORT%/"
)

node tools\browser-preview\qr.js "%FIRST_URL%" "%QR_OUT%" 8 >nul 2>nul
if not errorlevel 1 (
  echo.
  echo 二维码已生成，正在弹出窗口...
  start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "tools\browser-preview\qr-popup.ps1" -ImagePath "%QR_OUT%" -LinkText "%FIRST_URL%"
) else (
  echo [提示] 二维码生成失败，可直接复制上面的地址。
)

echo.
echo 手机与本机连同一个 WiFi/局域网后：
echo   1. 用微信/相机扫描二维码，或手动输入上面的局域网地址
echo   2. 若首次运行，Windows 防火墙弹窗请选择「允许访问」
echo.
echo 本机预览: http://127.0.0.1:%PORT%/

echo.
echo 注意：服务器在「云阙飞戈-服务器」窗口运行，关闭该窗口即停止。
echo 本窗口可直接关闭。
echo.
pause
