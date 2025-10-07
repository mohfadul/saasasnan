@echo off
echo ========================================
echo Healthcare SaaS Platform - Development
echo ========================================
echo.

echo Starting Backend Server (NestJS)...
echo Port: 3001
start "Backend Server" cmd /k "cd backend && npm run start:dev"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server (React)...
echo Port: 3000
start "Frontend Server" cmd /k "cd admin-panel && npm start"

echo.
echo ========================================
echo Development servers are starting...
echo.
echo Backend API: http://localhost:3001
echo Frontend Admin Panel: http://localhost:3000
echo API Documentation: http://localhost:3001/api/docs
echo.
echo ========================================
echo.
echo Default Login Credentials:
echo Email: admin@healthcare-platform.com
echo Password: Admin123!
echo.
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
