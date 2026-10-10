@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动本地服务与 Cloudflare 隧道 ...
start "视频原画提取服务" /min python server\app.py --password 12345678
ping -n 3 127.0.0.1 >nul
echo 隧道启动中，等待下面的 https 网址出现即可分享给朋友 ...
cloudflared\cloudflared.exe tunnel --url http://127.0.0.1:8787
echo.
echo 隧道已停止。
pause
