@echo off
cd /d G:\华为项目\Locallink本地生活综合服务系统\demo1\server
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000