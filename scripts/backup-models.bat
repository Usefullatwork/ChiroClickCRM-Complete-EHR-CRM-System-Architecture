@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   ChiroClick AI - Model Backup
echo   Kopierer Ollama-modeller til prosjektmappen
echo ============================================================
echo.

set "BACKUP_DIR=%~dp0..\ai-training\models-cache"
set "OLLAMA_DIR=%USERPROFILE%\.ollama\models"

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Check Ollama models exist
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo FEIL: Ollama er ikke installert.
    exit /b 1
)

echo Sjekker hvilke chiro-modeller som finnes...
echo.

set "BACKED_UP=0"

for %%M in (chiro-no chiro-fast chiro-norwegian chiro-medical) do (
    ollama list 2>nul | findstr /i "%%M" >nul 2>nul
    if !errorlevel! equ 0 (
        echo   Eksporterer %%M ...
        if not exist "%BACKUP_DIR%\%%M" mkdir "%BACKUP_DIR%\%%M"

        REM Export model using ollama show to get the manifest info
        REM Copy the model manifest and blobs
        ollama show %%M --modelfile > "%BACKUP_DIR%\%%M\Modelfile" 2>nul
        if !errorlevel! equ 0 (
            echo   OK - %%M Modelfile eksportert.
            set /a BACKED_UP+=1
        ) else (
            echo   FEIL: Kunne ikke eksportere %%M
        )
    ) else (
        echo   HOPPET OVER: %%M finnes ikke i Ollama.
    )
)

echo.

REM Also copy our source Modelfiles
echo Kopierer kilde-Modelfiles...
for %%F in (Modelfile.chiro-no Modelfile.chiro-fast Modelfile.chiro-norwegian Modelfile.chiro-medical) do (
    if exist "%~dp0..\ai-training\%%F" (
        copy /Y "%~dp0..\ai-training\%%F" "%BACKUP_DIR%\%%F" >nul 2>nul
        echo   Kopiert %%F
    )
)

echo.
echo ============================================================
echo   OPPSUMMERING: %BACKED_UP% modeller eksportert
echo   Backup-mappe: %BACKUP_DIR%
echo ============================================================
echo.
echo Merk: models-cache/ er lagt til i .gitignore
echo For full backup inkl. blob-data, kopier:
echo   %OLLAMA_DIR%
echo til en ekstern disk eller sky-lagring.
echo.

endlocal
