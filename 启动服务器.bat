@echo off
cd /d "%~dp0server"
start "Qevora Server" cmd /c "node server.js"
timeout /t 3 /nobreak >nul
start http://localhost:3000
exit
