@echo off
REM ============================================================
REM ChiroClickCRM Database Setup Script for Windows
REM ============================================================
REM Prerequisites:
REM   - PostgreSQL 14+ installed and in PATH
REM   - psql and createdb commands available
REM   - PostgreSQL service running
REM ============================================================

setlocal enabledelayedexpansion

REM Configuration
set DB_NAME=chiroclickcrm
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

REM Allow environment variable overrides
if defined POSTGRES_DB set DB_NAME=%POSTGRES_DB%
if defined POSTGRES_USER set DB_USER=%POSTGRES_USER%
if defined POSTGRES_HOST set DB_HOST=%POSTGRES_HOST%
if defined POSTGRES_PORT set DB_PORT=%POSTGRES_PORT%

REM Get script directory (for relative paths)
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

echo.
echo ============================================================
echo ChiroClickCRM Database Setup
echo ============================================================
echo Database: %DB_NAME%
echo User: %DB_USER%
echo Host: %DB_HOST%:%DB_PORT%
echo ============================================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL and ensure psql is in your PATH
    exit /b 1
)

REM Check if PostgreSQL service is running
pg_isready -h %DB_HOST% -p %DB_PORT% >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo WARNING: PostgreSQL may not be running on %DB_HOST%:%DB_PORT%
    echo Attempting to continue anyway...
)

echo [1/5] Checking if database exists...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -lqt 2>nul | findstr /C:"%DB_NAME%" >nul
if %ERRORLEVEL% equ 0 (
    echo Database '%DB_NAME%' already exists.
    set /p CONFIRM="Do you want to drop and recreate it? (y/N): "
    if /i "!CONFIRM!" neq "y" (
        echo Skipping database creation, running migrations only...
        goto :run_migrations
    )
    echo Dropping existing database...
    dropdb -U %DB_USER% -h %DB_HOST% -p %DB_PORT% %DB_NAME%
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to drop database
        exit /b 1
    )
)

echo [2/5] Creating database '%DB_NAME%'...
createdb -U %DB_USER% -h %DB_HOST% -p %DB_PORT% %DB_NAME%
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to create database
    exit /b 1
)
echo Database created successfully.

:run_schema
echo [3/5] Running schema...
if exist "%PROJECT_ROOT%\database\schema.sql" (
    psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%PROJECT_ROOT%\database\schema.sql"
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to run schema
        exit /b 1
    )
    echo Schema applied successfully.
) else (
    echo WARNING: schema.sql not found at %PROJECT_ROOT%\database\schema.sql
)

:run_migrations
echo [4/5] Running migrations...
set MIGRATION_COUNT=0

REM Run database/migrations first (if exists)
if exist "%PROJECT_ROOT%\database\migrations\*.sql" (
    for %%f in ("%PROJECT_ROOT%\database\migrations\*.sql") do (
        echo   Running %%~nxf...
        psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%%f"
        if %ERRORLEVEL% neq 0 (
            echo ERROR: Failed to run migration %%~nxf
            exit /b 1
        )
        set /a MIGRATION_COUNT+=1
    )
)

REM Run backend/migrations (if exists)
if exist "%PROJECT_ROOT%\backend\migrations\*.sql" (
    for %%f in ("%PROJECT_ROOT%\backend\migrations\*.sql") do (
        echo   Running %%~nxf...
        psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%%f"
        if %ERRORLEVEL% neq 0 (
            echo ERROR: Failed to run migration %%~nxf
            exit /b 1
        )
        set /a MIGRATION_COUNT+=1
    )
)

if %MIGRATION_COUNT% equ 0 (
    echo   No migrations found.
) else (
    echo   %MIGRATION_COUNT% migrations applied successfully.
)

echo [5/5] Running seeds...
set SEED_COUNT=0
if exist "%PROJECT_ROOT%\database\seeds\*.sql" (
    for %%f in ("%PROJECT_ROOT%\database\seeds\*.sql") do (
        echo   Running %%~nxf...
        psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%%f"
        if %ERRORLEVEL% neq 0 (
            echo WARNING: Seed file %%~nxf had errors (continuing anyway)
        )
        set /a SEED_COUNT+=1
    )
)

if %SEED_COUNT% equ 0 (
    echo   No seed files found.
) else (
    echo   %SEED_COUNT% seed files applied.
)

echo.
echo ============================================================
echo Database setup complete!
echo ============================================================
echo.
echo To verify the setup, run:
echo   psql -U %DB_USER% -d %DB_NAME% -c "\dt"
echo.
echo To connect to the database:
echo   psql -U %DB_USER% -d %DB_NAME%
echo.

endlocal
exit /b 0
