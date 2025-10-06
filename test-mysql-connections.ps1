Write-Host "🏥 Healthcare SaaS Platform - MySQL Connection Tests" -ForegroundColor Green
Write-Host ""

# Test MySQL connection
Write-Host "🔄 Testing MySQL connection..." -ForegroundColor Yellow
try {
    # Try to connect using mysql command if available
    $env:MYSQL_PWD = "healthcare_password"
    $result = mysql -h localhost -P 3306 -u healthcare_user -D healthcare_platform -e "SELECT VERSION();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL connection successful!" -ForegroundColor Green
        Write-Host "📊 MySQL is running" -ForegroundColor Cyan
        
        # Test if tables exist
        $tables = mysql -h localhost -P 3306 -u healthcare_user -D healthcare_platform -e "SHOW TABLES;" 2>$null
        if ($tables) {
            Write-Host "📋 Database tables found" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  No tables found. Import mysql-schema.sql" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ MySQL connection failed" -ForegroundColor Red
        Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Make sure MySQL is running" -ForegroundColor White
        Write-Host "2. Check if database 'healthcare_platform' exists" -ForegroundColor White
        Write-Host "3. Try: docker-compose -f docker-compose.mysql.yml up -d" -ForegroundColor White
        Write-Host "4. For Hostinger: Check database settings in control panel" -ForegroundColor White
    }
} catch {
    Write-Host "❌ mysql command not found" -ForegroundColor Red
    Write-Host "🔧 Install MySQL client or use Docker" -ForegroundColor Yellow
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
Write-Host "1. If MySQL test failed: Set up MySQL database" -ForegroundColor White
Write-Host "2. If API test failed: Start backend server" -ForegroundColor White
Write-Host "3. If frontend test failed: Start frontend server" -ForegroundColor White
Write-Host "4. For Hostinger: Follow HOSTINGER_SETUP_GUIDE.md" -ForegroundColor White

Write-Host "`n🔐 Default Credentials:" -ForegroundColor Cyan
Write-Host "Email: admin@healthcare-platform.com" -ForegroundColor White
Write-Host "Password: Admin123!" -ForegroundColor White

Write-Host "`n📚 MySQL Setup Options:" -ForegroundColor Cyan
Write-Host "1. Docker: docker-compose -f docker-compose.mysql.yml up -d" -ForegroundColor White
Write-Host "2. Local: Install MySQL and create database" -ForegroundColor White
Write-Host "3. Hostinger: Create database in control panel" -ForegroundColor White

Read-Host "`nPress Enter to continue"
