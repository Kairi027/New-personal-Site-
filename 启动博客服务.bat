@echo off
chcp 936 >nul
setlocal

set "BLOG_DIR=%~dp0"
set "SERVER=%BLOG_DIR%tools\blog-server.py"

echo.
echo   Kairi 的小站 - 本地服务
echo   ----------------------------------------
echo.

if not exist "%SERVER%" (
  echo   [x] 找不到 tools\blog-server.py
  echo       请确认这个批处理和 tools 文件夹在一起。
  echo.
  pause
  exit /b 1
)

netstat -ano | findstr /r /c:":8765 " | findstr /r /c:"LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo   [i] 8765 端口已经有服务在跑了，直接用就行。
  echo       如果确实要重启，请先关掉之前那个窗口。
  echo.
  pause
  exit /b 0
)

echo   启动中…这个窗口要保持开着，关掉它等于停止服务。
echo.
python -u "%SERVER%"

echo.
echo   服务已停止。
pause
