@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: PAIR 2: Large Models (chiro-norwegian 7B + chiro-no 7B)
:: Estimated: ~6-8 hours total on RTX 2060
::
:: These are the 7B models that push the 6GB VRAM limit.
:: Run this after PAIR 1 succeeds, or as a standalone overnight run.
:: ============================================================

echo ============================================================
echo PAIR 2: Large Models (norwegian 7B + default 7B)
echo Started: %date% %time%
echo ============================================================

:: Train norwegian first (7B, ~3-4h)
call "%~dp0train-norwegian.bat"

:: Small delay for GPU to fully release memory
timeout /t 10 /nobreak >nul

:: Then default/chiro-no (7B, ~3-4h)
call "%~dp0train-default.bat"

echo.
echo ============================================================
echo PAIR 2 COMPLETE: %date% %time%
echo   chiro-norwegian-lora + chiro-no-lora ready
echo ============================================================
pause
exit /b 0
