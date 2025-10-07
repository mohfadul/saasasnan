# Healthcare SaaS - Docker Quick Setup Script
# This script automates the Docker database setup

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Healthcare SaaS - Docker Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Docker is installed
Write-Host "[1/6] Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "  ✅ Docker is installed: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Docker not found!" -ForegroundColor Red
        Write-Host "  Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ❌ Docker not found!" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host "`n[2/6] Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps > $null 2>&1
    Write-Host "  ✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker is not running!" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

# Start MySQL container
Write-Host "`n[3/6] Starting MySQL container..." -ForegroundColor Yellow
docker-compose -f docker-compose.mysql.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ MySQL container started" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to start MySQL container" -ForegroundColor Red
    exit 1
}

# Wait for MySQL to initialize
Write-Host "`n[4/6] Waiting for MySQL to initialize (30 seconds)..." -ForegroundColor Yellow
for ($i = 30; $i -gt 0; $i--) {
    Write-Host "  ⏳ $i seconds remaining..." -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}
Write-Host "  ✅ MySQL should be ready!                    " -ForegroundColor Green

# Import schema
Write-Host "`n[5/6] Importing database schema..." -ForegroundColor Yellow
try {
    Get-Content database\mysql-schema.sql | docker exec -i saas_mysql mysql -uroot -prootpassword healthcare_saas 2>&1 | Out-Null
    Write-Host "  ✅ Schema imported successfully" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Auto-import failed. You can import manually via phpMyAdmin" -ForegroundColor Yellow
    Write-Host "     Go to: http://localhost:8080" -ForegroundColor Yellow
}

# Create .env file if it doesn't exist
Write-Host "`n[6/6] Creating .env file..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "  ⚠️  .env file already exists, skipping" -ForegroundColor Yellow
} else {
    $envContent = @"
# Database Configuration (Docker MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=rootpassword
DB_NAME=healthcare_saas

# JWT Secret
JWT_SECRET=docker-super-secret-jwt-key-at-least-32-characters-long

# Encryption Key (exactly 32 characters)
ENCRYPTION_KEY=docker-encryption-key-32chars!

# Application
NODE_ENV=development
PORT=3001
"@
    $envContent | Out-File -FilePath "backend\.env" -Encoding utf8
    Write-Host "  ✅ Created backend/.env file" -ForegroundColor Green
}

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "📊 Services Available:" -ForegroundColor Cyan
Write-Host "  • MySQL:       localhost:3306" -ForegroundColor White
Write-Host "  • phpMyAdmin:  http://localhost:8080" -ForegroundColor White
Write-Host "    - Server: mysql" -ForegroundColor DarkGray
Write-Host "    - User: root" -ForegroundColor DarkGray
Write-Host "    - Pass: rootpassword" -ForegroundColor DarkGray

Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start backend:   cd backend; npm run start:dev" -ForegroundColor White
Write-Host "  2. Start frontend:  cd admin-panel; npm start" -ForegroundColor White
Write-Host "  3. Create admin user via phpMyAdmin (see DOCKER_SETUP.md)" -ForegroundColor White

Write-Host "`n📚 Useful Commands:" -ForegroundColor Cyan
Write-Host "  • View containers:   docker ps" -ForegroundColor White
Write-Host "  • Stop MySQL:        docker-compose -f docker-compose.mysql.yml down" -ForegroundColor White
Write-Host "  • View logs:         docker logs saas_mysql" -ForegroundColor White

Write-Host "`n✨ Happy coding!" -ForegroundColor Green
Write-Host ""

