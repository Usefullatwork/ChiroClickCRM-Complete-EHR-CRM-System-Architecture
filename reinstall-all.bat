@echo off
echo ============================================================
echo   ChiroClick - Reinstalling Dependencies
echo ============================================================
echo.

echo [1/4] Deleting backend node_modules...
rd /s /q "D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\backend\node_modules" 2>nul
echo Done.

echo [2/4] Deleting frontend node_modules...
rd /s /q "D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\frontend\node_modules" 2>nul
echo Done.

echo [3/4] Installing backend dependencies...
cd /d "D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\backend"
call npm install
if %errorlevel% neq 0 (
    echo FAILED: Backend npm install failed!
) else (
    echo OK: Backend installed.
)

echo [4/4] Installing frontend dependencies...
cd /d "D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\frontend"
call npm install
if %errorlevel% neq 0 (
    echo FAILED: Frontend npm install failed!
) else (
    echo OK: Frontend installed.
)

echo.
echo ============================================================
echo   Verifying...
echo ============================================================

echo Testing backend jest...
cd /d "D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\backend"
npx jest --version

echo Testing frontend vite...
cd /d "D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\frontend"
npx vite --version

echo.
echo ============================================================
echo   DONE! Now run:
echo   cd backend ^&^& npm test
echo   cd frontend ^&^& npm run dev
echo ============================================================
pause
