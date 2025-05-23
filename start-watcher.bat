@echo off
echo Starting automatic Git pusher...
echo This window will stay open and watch for file changes.
echo Press Ctrl+C to stop watching.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0watch.ps1" 