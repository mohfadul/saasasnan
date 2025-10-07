@echo off
echo Starting Healthcare SaaS Platform Development Servers...
echo.

echo Starting Backend Server (NestJS)...
start "Backend Server" cmd /k "cd backend && npm run start:dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server (React)...
start "Frontend Server" cmd /k "cd admin-panel && npm start"

echo.
echo Development servers are starting...
echo Backend API: http://localhost:3001
echo Frontend Admin Panel: http://localhost:3000
echo.
echo Press any key to exit this window...
pause >nul
