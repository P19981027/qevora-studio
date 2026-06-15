@echo off
cd /d "%~dp0"
start "Qevora Admin" cmd /c "node server.js"
timeout /t 3 /nobreak >nul
start http://localhost:3000/admin.html
exit
