@echo off
setlocal EnableExtensions EnableDelayedExpansion
title WeatherGPT - Full Stack Launcher

cd /d "%~dp0"

echo.
echo ============================================================
echo                 WeatherGPT Full Stack
echo ============================================================
echo.

REM ---- Check Python ----
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python was not found.
    echo Install Python 3.11+ and make sure "Add Python to PATH" is enabled.
    pause
    exit /b 1
)

REM ---- Check Node/npm ----
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js/npm was not found.
    echo Install Node.js LTS and restart this script.
    pause
    exit /b 1
)

REM ---- Backend virtual environment ----
if not exist "backend\.venv\Scripts\python.exe" (
    echo [1/5] Creating Python virtual environment...
    python -m venv backend\.venv
    if errorlevel 1 (
        echo [ERROR] Could not create the Python virtual environment.
        pause
        exit /b 1
    )
) else (
    echo [1/5] Python virtual environment already exists.
)

echo [2/5] Installing/updating backend dependencies...
call "backend\.venv\Scripts\python.exe" -m pip install --upgrade pip
call "backend\.venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
if errorlevel 1 (
    echo [ERROR] Backend dependency installation failed.
    pause
    exit /b 1
)

REM ---- Backend environment ----
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy /Y "backend\.env.example" "backend\.env" >nul
        echo [3/5] Created backend\.env from .env.example
    )
) else (
    echo [3/5] backend\.env already exists.
)

REM ---- Frontend environment ----
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy /Y "frontend\.env.example" "frontend\.env" >nul
        echo VITE_API_BASE_URL=http://localhost:8000>>"frontend\.env"
        echo [4/5] Created frontend\.env
    ) else (
        echo VITE_API_BASE_URL=http://localhost:8000>"frontend\.env"
        echo [4/5] Created frontend\.env
    )
) else (
    echo [4/5] frontend\.env already exists.
)

REM ---- Frontend dependencies ----
if not exist "frontend\node_modules" (
    echo [5/5] Installing frontend dependencies...
    pushd frontend
    call npm install
    if errorlevel 1 (
        popd
        echo [ERROR] Frontend dependency installation failed.
        pause
        exit /b 1
    )
    popd
) else (
    echo [5/5] Frontend dependencies already installed.
)

echo.
echo Starting FastAPI backend on http://localhost:8000 ...
start "WeatherGPT Backend" cmd /k "cd /d ""%~dp0backend"" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Waiting for backend...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; 1..30 | %% { try { $r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health -TimeoutSec 1; if($r.StatusCode -eq 200){$ok=$true; break} } catch {}; Start-Sleep -Milliseconds 500 }; if(-not $ok){exit 1}"
if errorlevel 1 (
    echo [WARNING] Backend did not respond within the expected time.
    echo Check the "WeatherGPT Backend" window for the error.
) else (
    echo Backend is online.
)

echo.
echo Starting React/Vite frontend on http://localhost:5173 ...
start "WeatherGPT Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev -- --host 127.0.0.1"

echo Waiting for frontend...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3"

echo.
echo Opening WeatherGPT in your browser...
start "" "http://localhost:5173"

echo.
echo ============================================================
echo WeatherGPT is starting.
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
echo Keep both terminal windows open while using the website.
echo Close those windows to stop the application.
echo ============================================================
echo.
pause
