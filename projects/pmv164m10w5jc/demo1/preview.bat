@echo off
chcp 65001 >nul
echo ================================================================
echo   客户端界面快速预览（仅前端，无需后端）
echo ================================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0preview.ps1"
pause