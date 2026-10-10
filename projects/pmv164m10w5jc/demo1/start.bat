@echo off
chcp 65001 >nul
echo ================================================================
echo   本地生活综合服务系统 - 一键启动
echo ================================================================
echo.
echo 正在启动，请稍候...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"

pause