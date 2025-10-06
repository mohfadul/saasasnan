@echo off
echo Starting Healthcare SaaS Platform Development Environment...

echo.
echo 1. Starting PostgreSQL and Redis with Docker...
docker-compose up -d

echo.
echo 2. Waiting for database to be ready...
timeout /t 10 /nobreak

echo.
echo 3. Setting up database schema...
docker exec healthcare-postgres psql -U postgres -d healthcare_platform -f /docker-entrypoint-initdb.d/schema.sql

echo.
echo 4. Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run start:dev"

echo.
echo 5. Starting frontend server...
cd ../admin-panel
start "Frontend Server" cmd /k "npm start"

echo.
echo 6. Starting mobile app...
cd ../mobile-app
start "Mobile App" cmd /k "npm start"

echo.
echo Development environment started!
echo.
echo Access points:
echo - Backend API: http://localhost:3001
echo - API Docs: http://localhost:3001/api/docs
echo - Frontend: http://localhost:3000
echo - Mobile App: Check Metro bundler output
echo.
echo Default credentials:
echo - Email: admin@healthcare-platform.com
echo - Password: Admin123!
echo.
pause
