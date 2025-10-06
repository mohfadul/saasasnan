Write-Host "🏥 Healthcare SaaS Platform - Connection Tests" -ForegroundColor Green
Write-Host ""

# Test database connection
Write-Host "🔄 Testing database connection..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "password"
    $result = psql -h localhost -p 5432 -U postgres -d healthcare_platform -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
        Write-Host "📊 PostgreSQL is running" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
        Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Make sure PostgreSQL is running" -ForegroundColor White
        Write-Host "2. Check if database 'healthcare_platform' exists" -ForegroundColor White
        Write-Host "3. Try: docker-compose up -d (if using Docker)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ psql command not found" -ForegroundColor Red
    Write-Host "🔧 Install PostgreSQL or use Docker" -ForegroundColor Yellow
}

# Test backend API
Write-Host "`n🔄 Testing backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/docs" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API is running!" -ForegroundColor Green
        Write-Host "📚 API Documentation: http://localhost:3001/api/docs" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Backend API not running" -ForegroundColor Red
    Write-Host "🔧 Start backend with: cd backend && npm run start:dev" -ForegroundColor Yellow
}

# Test frontend
Write-Host "`n🔄 Testing frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running!" -ForegroundColor Green
        Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Frontend not running" -ForegroundColor Red
    Write-Host "🔧 Start frontend with: cd admin-panel && npm start" -ForegroundColor Yellow
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Green
Write-Host "1. If database test failed: Set up PostgreSQL" -ForegroundColor White
Write-Host "2. If API test failed: Start backend server" -ForegroundColor White
Write-Host "3. If frontend test failed: Start frontend server" -ForegroundColor White
Write-Host "4. If all passed: Test login with default credentials" -ForegroundColor White

Write-Host "`n🔐 Default Credentials:" -ForegroundColor Cyan
Write-Host "Email: admin@healthcare-platform.com" -ForegroundColor White
Write-Host "Password: Admin123!" -ForegroundColor White

Read-Host "`nPress Enter to continue"
