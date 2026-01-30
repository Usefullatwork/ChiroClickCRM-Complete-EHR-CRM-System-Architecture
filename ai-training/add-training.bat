@echo off
REM ============================================================================
REM Quick Training Data Adder
REM ============================================================================
REM Add new training examples interactively
REM ============================================================================

echo.
echo ============================================================
echo    Add Training Data to ChiroClick Models
echo ============================================================
echo.

set /p MODEL="Which model? (fast/norwegian/medical/no): "
set /p PROMPT="User prompt (what you'd ask): "
set /p RESPONSE="Expected response (what AI should say): "

echo.
echo Adding to Modelfile-%MODEL%...

if "%MODEL%"=="no" (
    echo MESSAGE user "%PROMPT%" >> Modelfile
    echo MESSAGE assistant "%RESPONSE%" >> Modelfile
) else (
    echo MESSAGE user "%PROMPT%" >> Modelfile-%MODEL%
    echo MESSAGE assistant "%RESPONSE%" >> Modelfile-%MODEL%
)

echo.
echo Added! Rebuild model with:
echo   ollama create chiro-%MODEL% -f Modelfile-%MODEL%
echo.
pause
