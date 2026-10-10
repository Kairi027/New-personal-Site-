@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动 视频原画提取 ...
python server\app.py --password 12345678
echo.
echo 服务已停止。
pause
