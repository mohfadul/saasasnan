Write-Host "Starting Healthcare SaaS Platform Development Environment..." -ForegroundColor Green

Write-Host "`n1. Starting PostgreSQL and Redis with Docker..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "`n2. Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n3. Setting up database schema..." -ForegroundColor Yellow
docker exec healthcare-postgres psql -U postgres -d healthcare_platform -f /docker-entrypoint-initdb.d/schema.sql

Write-Host "`n4. Starting backend server..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev"

Write-Host "`n5. Starting frontend server..." -ForegroundColor Yellow
Set-Location ../admin-panel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host "`n6. Starting mobile app..." -ForegroundColor Yellow
Set-Location ../mobile-app
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host "`nDevelopment environment started!" -ForegroundColor Green
Write-Host "`nAccess points:" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "- API Docs: http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Mobile App: Check Metro bundler output" -ForegroundColor White
Write-Host "`nDefault credentials:" -ForegroundColor Cyan
Write-Host "- Email: admin@healthcare-platform.com" -ForegroundColor White
Write-Host "- Password: Admin123!" -ForegroundColor White

Read-Host "`nPress Enter to continue"
