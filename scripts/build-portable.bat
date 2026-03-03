@echo off
echo Building ChiroClickEHR Portable...
echo.

cd desktop
call npm install
call npx electron-builder --win portable
echo.
echo Build complete! Check desktop/dist/ for the portable executable.
pause
