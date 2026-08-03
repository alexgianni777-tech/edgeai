@echo off
REM EdgeAI - dubbelklicka for att bygga dagens data och oppna verktyget.
cd /d "%~dp0"
if not exist node_modules ( call npm install )
call node build-data.js
start "" http://localhost:3000
node server.js
