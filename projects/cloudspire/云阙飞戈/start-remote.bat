@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "PORT=5173"
set "TOOL_DIR=tools\browser-preview"
set "QR_OUT=%TOOL_DIR%\cloudspire-remote-qr.png"
set "TUNNEL_LOG=%TOOL_DIR%\cloudflared.log"
set "URL_FILE=%TOOL_DIR%\remote-url.txt"

echo ================================================
echo   云阙飞戈 - 远程联机（生成链接和二维码给朋友）
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未找到 Node.js，请先安装: https://nodejs.org/
  pause
  exit /b 1
)

echo [1/4] 构建并启动本地服务（端口 %PORT%）...
call node tools\browser-preview\build.js
if errorlevel 1 (
  echo [错误] 构建失败，请检查代码后重试。
  pause
  exit /b 1
)

curl -s -o nul http://127.0.0.1:%PORT%/
if errorlevel 1 (
  start "云阙飞戈-服务器" cmd /k "chcp 65001>nul && node tools\browser-preview\server.js %PORT%"
  echo 等待本地服务就绪...
  set "TRY=0"
  :wait_remote_local
  set /a TRY+=1
  if !TRY! gtr 30 (
    echo [错误] 本地服务启动超时。若端口被占用，请关闭占用程序后重试。
    pause
    exit /b 1
  )
  timeout /t 1 /nobreak >nul
  curl -s -o nul http://127.0.0.1:%PORT%/
  if errorlevel 1 goto wait_remote_local
) else (
  echo 端口 %PORT% 已有服务在运行，直接复用。
)
echo 本地服务已就绪。
echo.

echo [2/4] 准备公网隧道（cloudflared）...
set "TUNNEL_BIN="
where cloudflared >nul 2>nul
if not errorlevel 1 set "TUNNEL_BIN=cloudflared"
if not defined TUNNEL_BIN if exist "cloudflared\cloudflared.exe" set "TUNNEL_BIN=cloudflared\cloudflared.exe"
if not defined TUNNEL_BIN if exist "%TOOL_DIR%\cloudflared.exe" set "TUNNEL_BIN=%TOOL_DIR%\cloudflared.exe"
if defined TUNNEL_BIN echo 已找到 cloudflared: %TUNNEL_BIN%

if not defined TUNNEL_BIN (
  echo 未检测到 cloudflared。它将建立一个免费的 Cloudflare 临时公网地址。
  choice /c YN /n /m "是否现在自动下载 cloudflared.exe（约 60MB）? [Y/N] "
  if errorlevel 2 goto no_tunnel_tool
  echo 正在下载 cloudflared，请稍候...
  curl.exe -sL --max-time 180 -o "%TOOL_DIR%\cloudflared.exe" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
  if errorlevel 1 (
    echo [提示] 下载失败（可能无法访问 GitHub），请手动下载后重试。
    goto no_tunnel_tool
  )
  set "TUNNEL_BIN=%TOOL_DIR%\cloudflared.exe"
)

echo [3/4] 启动隧道并获取公网地址（首次连接约 10~30 秒）...
if exist "%TUNNEL_LOG%" del "%TUNNEL_LOG%"
start "云阙飞戈-隧道" cmd /k "chcp 65001>nul && %TUNNEL_BIN% tunnel --url http://127.0.0.1:%PORT% --logfile %TUNNEL_LOG%"

set "PUBLIC_URL="
set "TRY=0"
:wait_tunnel
set /a TRY+=1
if !TRY! gtr 90 (
  echo [错误] 90 秒内未获取到公网地址，请检查网络后重试。
  goto no_tunnel_url
)
timeout /t 1 /nobreak >nul
for /f "usebackq delims=" %%u in (`node tools\browser-preview\tunnel-url.js "%TUNNEL_LOG%" "https://[a-z0-9-]+\.trycloudflare\.com"`) do set "PUBLIC_URL=%%u"
if not defined PUBLIC_URL goto wait_tunnel

echo.
echo [4/4] 生成分享链接与二维码...
echo.
echo  公网链接: %PUBLIC_URL%
echo %PUBLIC_URL%> "%URL_FILE%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Clipboard -Value '%PUBLIC_URL%'"

node tools\browser-preview\qr.js "%PUBLIC_URL%" "%QR_OUT%" 8 >nul 2>nul
if not errorlevel 1 (
  echo  二维码已生成，正在弹出窗口...
  start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "tools\browser-preview\qr-popup.ps1" -ImagePath "%QR_OUT%" -LinkText "%PUBLIC_URL%"
) else (
  echo  [提示] 二维码生成失败，可直接复制链接发给朋友。
)

echo.
echo 链接已复制到剪贴板，同时保存在 %URL_FILE%
echo.
echo 注意事项：
echo   1. 「云阙飞戈-隧道」窗口必须保持开启，关闭即断线
echo   2. 朋友首次打开页面可能需等待几秒，若出现 Cloudflare 提示页可点 Continue
echo   3. 本窗口可直接关闭，不影响服务与隧道
echo.
pause
exit /b 0

:no_tunnel_tool
echo.
echo [备用方案] 未找到可用隧道工具。可以：
echo   1. 手动下载 cloudflared.exe 放到 cloudflared\ 或 %TOOL_DIR%\ 后重新运行本脚本
echo     下载地址: https://github.com/cloudflare/cloudflared/releases
echo   2. 使用 ngrok / 花生壳 / 路由器端口映射 把 %PORT% 端口映射到公网
echo   3. 若朋友与你在同一局域网，直接用 start-lan.bat 更方便
echo.
pause
exit /b 1

:no_tunnel_url
echo.
echo [提示] 请检查「云阙飞戈-隧道」窗口里的报错信息。
echo   常见原因: 网络无法访问 Cloudflare、杀毒软件拦截。
echo   也可以手动运行试试:
echo   %TUNNEL_BIN% tunnel --url http://127.0.0.1:%PORT%
echo.
pause
exit /b 1
