Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " OS Performance Analytics & Bottleneck Platform Launcher" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Start Backend in separate window
Write-Host "`n[1/3] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

# 2. Start Frontend in separate window
Write-Host "[2/3] Starting React + Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Start-Sleep -Seconds 2

# 3. Open Browser
Write-Host "[3/3] Opening browser at http://localhost:5173..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " Platform running successfully!" -ForegroundColor Green
Write-Host " - Frontend UI:  http://localhost:5173" -ForegroundColor White
Write-Host " - Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host " - Swagger Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
