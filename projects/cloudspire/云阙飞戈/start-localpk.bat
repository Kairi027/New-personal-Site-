@echo off
cd /d "%~dp0"
echo Starting Cloudspire multiplayer relay...
node tools\multiplayer-server.js %*
pause
