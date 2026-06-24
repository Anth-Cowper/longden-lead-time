@echo off
cd /d "%~dp0"
powershell -WindowStyle Hidden -Command "Start-Process node -ArgumentList 'server.js' -WorkingDirectory '%CD%' -WindowStyle Hidden"
