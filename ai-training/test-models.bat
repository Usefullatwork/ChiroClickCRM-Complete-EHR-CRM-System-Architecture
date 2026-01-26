@echo off
REM ============================================================================
REM ChiroClick AI Models - Test Script
REM ============================================================================
REM Tests all ChiroClick models with sample prompts.
REM Run this after build-all-models.bat to verify everything works.
REM ============================================================================

echo.
echo ============================================================
echo    ChiroClick AI Models - Test Suite
echo ============================================================
echo.

REM Check which models are available
echo Checking installed chiro models...
ollama list | findstr chiro
echo.

echo ============================================================
echo TEST 1: chiro-fast (Quick Autocomplete)
echo ============================================================
echo Prompt: "Generer hovedklage for nakkesmerter"
echo.
echo Response:
ollama run chiro-fast "Generer hovedklage for nakkesmerter" 2>nul
echo.
echo ---
echo.

echo ============================================================
echo TEST 2: chiro-fast (English)
echo ============================================================
echo Prompt: "Generate chief complaint for low back pain"
echo.
echo Response:
ollama run chiro-fast "Generate chief complaint for low back pain" 2>nul
echo.
echo ---
echo.

echo ============================================================
echo TEST 3: chiro-norwegian (Subjective Summary)
echo ============================================================
echo Prompt: "Generer subjektiv oppsummering for pasient med hodepine"
echo.
echo Response:
ollama run chiro-norwegian "Generer subjektiv oppsummering for pasient med hodepine" 2>nul
echo.
echo ---
echo.

echo ============================================================
echo TEST 4: chiro-medical (Palpation Findings)
echo ============================================================
echo Prompt: "Generer palpasjon for korsryggsmerte"
echo.
echo Response:
ollama run chiro-medical "Generer palpasjon for korsryggsmerte" 2>nul
echo.
echo ---
echo.

echo ============================================================
echo TEST 5: chiro-medical (Clinical Reasoning)
echo ============================================================
echo Prompt: "Generer klinisk resonnering for cervikogen hodepine"
echo.
echo Response:
ollama run chiro-medical "Generer klinisk resonnering for cervikogen hodepine" 2>nul
echo.
echo ---
echo.

echo ============================================================
echo TEST 6: chiro-norwegian (Full SOAP Note)
echo ============================================================
echo Prompt: "Skriv komplett SOAP-notat for akutt nakkesmerte"
echo.
echo Response:
ollama run chiro-norwegian "Skriv komplett SOAP-notat for akutt nakkesmerte" 2>nul
echo.
echo ---
echo.

echo ============================================================
echo TEST 7: chiro-medical (Safety Assessment)
echo ============================================================
echo Prompt: "Generer sikkerhetsvurdering for lumbalcolumna"
echo.
echo Response:
ollama run chiro-medical "Generer sikkerhetsvurdering for lumbalcolumna" 2>nul
echo.
echo ---
echo.

echo ============================================================
echo TEST 8: chiro-no (General - Default Model)
echo ============================================================
echo Prompt: "Hva er de vanligste ICPC-2 kodene for kiropraktorer?"
echo.
echo Response:
ollama run chiro-no "Hva er de vanligste ICPC-2 kodene for kiropraktorer?" 2>nul
echo.
echo ---
echo.

echo ============================================================
echo    ALL TESTS COMPLETE
echo ============================================================
echo.
echo If any test failed or returned empty, run build-all-models.bat again.
echo.
pause
