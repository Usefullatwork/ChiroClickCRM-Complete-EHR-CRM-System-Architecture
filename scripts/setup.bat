@echo off
REM ============================================================================
REM ChiroClickCRM Development Environment Setup (Windows)
REM ============================================================================

setlocal enabledelayedexpansion

echo ==============================================
echo   ChiroClickCRM Development Setup
echo ==============================================
echo.

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    exit /b 1
)
echo [OK] Node.js found

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found
    exit /b 1
)
echo [OK] npm found

where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker not found. Please install Docker Desktop
    exit /b 1
)
echo [OK] Docker found

REM Check Node.js version
for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_VER=%%a
set NODE_VER=%NODE_VER:v=%
if %NODE_VER% LSS 18 (
    echo [ERROR] Node.js version 18+ required
    exit /b 1
)
echo [OK] Node.js version check passed

echo.
echo Starting Docker services...
cd /d "%PROJECT_DIR%"
docker-compose up -d postgres redis

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

REM Wait for PostgreSQL
set /a RETRIES=30
:wait_postgres
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] PostgreSQL is ready
    goto postgres_ready
)
set /a RETRIES-=1
if %RETRIES% LEQ 0 (
    echo [ERROR] PostgreSQL failed to start
    exit /b 1
)
timeout /t 1 /nobreak >nul
goto wait_postgres

:postgres_ready

REM Setup backend
echo.
echo Setting up backend...
cd /d "%PROJECT_DIR%\backend"

if not exist .env (
    copy .env.example .env
    echo [INFO] Created backend\.env from .env.example
    echo [INFO] Please edit backend\.env with your configuration
)

call npm install

REM Run migrations
echo Running database migrations...
call npm run db:migrate 2>nul || echo No migrations script found, skipping...

REM Seed demo data
echo Seeding demo data...
docker-compose exec -T postgres psql -U postgres -d chiroclickcrm < "%PROJECT_DIR%\database\seeds\demo-users.sql" 2>nul
docker-compose exec -T postgres psql -U postgres -d chiroclickcrm < "%PROJECT_DIR%\database\seeds\spine-templates.sql" 2>nul

REM Setup frontend
echo.
echo Setting up frontend...
cd /d "%PROJECT_DIR%\frontend"

if not exist .env (
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo VITE_API_URL=http://localhost:3000/api/v1 > .env
    )
    echo [INFO] Created frontend\.env
)

call npm install

echo.
echo ==============================================
echo   Setup complete!
echo ==============================================
echo.
echo To start the application:
echo.
echo   Backend:  cd backend ^&^& npm run dev
echo   Frontend: cd frontend ^&^& npm run dev
echo.
echo Or use Docker:
echo   docker-compose up
echo.
echo Access:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000/api/v1
echo.
echo Demo credentials:
echo   Admin:        admin@chiroclickcrm.no / admin123
echo   Practitioner: kiropraktor@chiroclickcrm.no / admin123
echo   Receptionist: resepsjon@chiroclickcrm.no / admin123
echo.

endlocal
