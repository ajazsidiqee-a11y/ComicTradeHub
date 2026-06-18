@echo off
echo Starting ComicTradeHub Server...
cd /d "%~dp0\backend"
start "" http://localhost:3000
node server.js
pause
