@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: PAIR 1: Small Models (chiro-fast 3B + chiro-medical 4B)
:: Estimated: ~3 hours total on RTX 2060
::
:: These are the smaller models that fit more comfortably in
:: 6GB VRAM and are most likely to succeed.
:: ============================================================

echo ============================================================
echo PAIR 1: Small Models (fast 3B + medical 4B)
echo Started: %date% %time%
echo ============================================================

:: Train fast first (smallest, ~1h)
call "%~dp0train-fast.bat"

:: Small delay for GPU to fully release memory
timeout /t 10 /nobreak >nul

:: Then medical (4B, ~2h)
call "%~dp0train-medical.bat"

echo.
echo ============================================================
echo PAIR 1 COMPLETE: %date% %time%
echo   chiro-fast-lora + chiro-medical-lora ready
echo ============================================================
pause
exit /b 0
