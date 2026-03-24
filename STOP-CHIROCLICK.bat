@echo off
title ChiroClickEHR - Stopping...
color 0C

echo.
echo  ========================================
echo   ChiroClickEHR - Stopping Application
echo  ========================================
echo.

echo   Stopping ChiroClickEHR processes...

:: Kill backend on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo   Stopping backend (PID: %%a^)
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill frontend on port 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    echo   Stopping frontend (PID: %%a^)
    taskkill /PID %%a /F >nul 2>&1
)

echo   ChiroClickEHR stopped.

echo.
echo  ========================================
echo   ChiroClickEHR has been stopped
echo  ========================================
echo.
pause
