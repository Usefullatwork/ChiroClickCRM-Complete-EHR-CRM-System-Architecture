@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   ChiroClick AI - Model Restore
echo   Gjenoppretter modeller fra backup
echo ============================================================
echo.

set "BACKUP_DIR=%~dp0..\ai-training\models-cache"
set "AI_DIR=%~dp0..\ai-training"

REM Check Ollama is available
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo FEIL: Ollama er ikke installert.
    echo Last ned fra https://ollama.com/download
    exit /b 1
)

REM Ensure Ollama is running
ollama list >nul 2>nul
if %errorlevel% neq 0 (
    echo Starting Ollama server...
    start "" ollama serve
    timeout /t 5 /nobreak >nul
)

echo Sjekker hvilke modeller som mangler...
echo.

set "RESTORED=0"
set "ALREADY_EXISTS=0"

for %%M in (chiro-no chiro-fast chiro-norwegian chiro-medical) do (
    ollama list 2>nul | findstr /i "%%M" >nul 2>nul
    if !errorlevel! equ 0 (
        echo   %%M finnes allerede - hopper over.
        set /a ALREADY_EXISTS+=1
    ) else (
        echo   %%M mangler - prøver å gjenopprette...

        REM Try to restore from backup Modelfile first
        if exist "%BACKUP_DIR%\%%M\Modelfile" (
            echo     Gjenoppretter fra backup Modelfile...
            ollama create %%M -f "%BACKUP_DIR%\%%M\Modelfile"
            if !errorlevel! equ 0 (
                echo     OK - %%M gjenopprettet fra backup.
                set /a RESTORED+=1
            ) else (
                echo     Backup feilet, bygger fra kilde...
                goto :BUILD_FROM_SOURCE_%%M
            )
        ) else (
            :BUILD_FROM_SOURCE_%%M
            REM Build from source Modelfile
            if exist "%AI_DIR%\Modelfile.%%M" (
                echo     Bygger fra kilde Modelfile...
                ollama create %%M -f "%AI_DIR%\Modelfile.%%M"
                if !errorlevel! equ 0 (
                    echo     OK - %%M bygget fra kilde.
                    set /a RESTORED+=1
                ) else (
                    echo     FEIL: Kunne ikke bygge %%M
                )
            ) else (
                echo     FEIL: Ingen Modelfile funnet for %%M
            )
        )
    )
)

echo.
echo ============================================================
echo   OPPSUMMERING
echo   Allerede installert: %ALREADY_EXISTS%
echo   Gjenopprettet:       %RESTORED%
echo ============================================================
echo.

endlocal
