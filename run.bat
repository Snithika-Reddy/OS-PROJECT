@echo off
title OS Performance Analytics Platform
echo ========================================================
echo   OS Performance Analytics & Bottleneck Detection Platform
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "OS Analytics Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React + Vite Frontend on http://127.0.0.1:5173...
start "OS Analytics Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo [3/3] Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo ========================================================
echo   Platform is running!
echo   - Web UI:      http://localhost:5173
echo   - Backend API: http://localhost:8000
echo   - API Docs:    http://localhost:8000/docs
echo ========================================================
