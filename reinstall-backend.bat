@echo off
echo Deleting backend node_modules...
rd /s /q "D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\backend\node_modules" 2>nul
echo Installing backend dependencies...
cd /d "D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\backend"
npm install
echo Done!
pause
