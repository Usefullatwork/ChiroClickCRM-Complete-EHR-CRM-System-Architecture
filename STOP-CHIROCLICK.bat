@echo off
title ChiroClickEHR - Stopping...
color 0C

echo.
echo  ========================================
echo   ChiroClickEHR - Stopping Application
echo  ========================================
echo.

echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo  ========================================
echo   ChiroClickEHR has been stopped
echo  ========================================
echo.
pause
