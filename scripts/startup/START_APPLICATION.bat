@echo off
echo ========================================
echo  Healthcare SaaS - Starting Application
echo ========================================
echo.

REM Start Backend
echo [1/2] Starting Backend Server...
start "Healthcare Backend" cmd /k "cd backend && npm run start:dev"
timeout /t 5 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Frontend Admin Panel...
start "Healthcare Frontend" cmd /k "cd admin-panel && npm start"

echo.
echo ========================================
echo  Services Starting...
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000 (will open automatically)
echo API Docs: http://localhost:3001/api/docs
echo.
echo Press any key to exit this window...
pause >nul

