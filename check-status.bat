@echo off
echo ========================================
echo Healthcare SaaS Platform - Status Check
echo ========================================
echo.

echo Checking Backend Server (Port 3001)...
netstat -ano | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ✅ Backend Server is RUNNING
) else (
    echo ❌ Backend Server is NOT RUNNING
)

echo.
echo Checking Frontend Server (Port 3000)...
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend Server is RUNNING
) else (
    echo ❌ Frontend Server is NOT RUNNING
)

echo.
echo ========================================
echo.
echo URLs:
echo Backend API: http://localhost:3001
echo Frontend Admin Panel: http://localhost:3000
echo API Documentation: http://localhost:3001/api/docs
echo.
echo ========================================
echo.
echo Press any key to exit...
pause >nul
