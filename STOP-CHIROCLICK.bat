@echo off
title ChiroClick CRM - Stopping...
color 0C

echo.
echo  ========================================
echo   ChiroClick CRM - Stopping Application
echo  ========================================
echo.

echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo  ========================================
echo   ChiroClick CRM has been stopped
echo  ========================================
echo.
pause
