# 🐳 Docker Database Setup - Quick & Easy

## Step 1: Install Docker Desktop

### Download & Install:
1. Go to: https://www.docker.com/products/docker-desktop/
2. Download **Docker Desktop for Windows**
3. Run the installer
4. **Important**: When asked, enable WSL 2 (it will guide you)
5. Restart your computer when prompted
6. Start **Docker Desktop** from Start Menu
7. Wait for Docker to start (you'll see the whale icon in system tray)

---

## Step 2: Start MySQL with Docker

Open PowerShell in your project folder and run:

```powershell
# Make sure you're in the project root
cd C:\Users\pc\OneDrive\Desktop\SAAS

# Start MySQL container
docker-compose -f docker-compose.mysql.yml up -d
```

You should see:
```
✅ Creating saas_mysql ... done
✅ Creating saas_phpmyadmin ... done
```

---

## Step 3: Wait for MySQL to Initialize (30 seconds)

```powershell
Write-Host "Waiting for MySQL to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "✅ MySQL should be ready!" -ForegroundColor Green
```

---

## Step 4: Import the Database Schema

```powershell
# Import schema into MySQL container
Get-Content database\mysql-schema.sql | docker exec -i saas_mysql mysql -uroot -prootpassword healthcare_saas
```

If that doesn't work, try this alternative:

```powershell
docker exec -i saas_mysql mysql -uroot -prootpassword healthcare_saas < database\mysql-schema.sql
```

You should see a bunch of output as tables are created. ✅

---

## Step 5: Create .env File

Create file: `backend/.env` with this content:

```env
# Database Configuration (Docker MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=rootpassword
DB_NAME=healthcare_saas

# JWT Secret (REQUIRED)
JWT_SECRET=docker-super-secret-jwt-key-at-least-32-characters-long

# Encryption Key (Must be exactly 32 characters)
ENCRYPTION_KEY=docker-encryption-key-32chars!

# Application
NODE_ENV=development
PORT=3001

# Redis (Optional - leave empty)
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

## Step 6: Verify Everything Works

### Check containers are running:
```powershell
docker ps
```

You should see:
- `saas_mysql` (MySQL database)
- `saas_phpmyadmin` (Web interface)

### Test database connection:
```powershell
docker exec saas_mysql mysql -uroot -prootpassword -e "SHOW DATABASES;"
```

You should see `healthcare_saas` in the list! ✅

---

## Step 7: Start Your Application

```powershell
# Start backend (in PowerShell window 1)
cd backend
npm run start:dev

# Start frontend (in PowerShell window 2 - open new terminal)
cd admin-panel
npm start
```

---

## 🎯 **What You Get with Docker:**

- ✅ **MySQL**: Running on `localhost:3306`
- ✅ **phpMyAdmin**: http://localhost:8080 (view/manage database)
  - Server: `mysql`
  - Username: `root`
  - Password: `rootpassword`
- ✅ **Backend API**: http://localhost:3001
- ✅ **Frontend**: http://localhost:3000

---

## 🔧 Useful Docker Commands

### Stop MySQL:
```powershell
docker-compose -f docker-compose.mysql.yml down
```

### Start MySQL again:
```powershell
docker-compose -f docker-compose.mysql.yml up -d
```

### View MySQL logs:
```powershell
docker logs saas_mysql
```

### Access MySQL shell:
```powershell
docker exec -it saas_mysql mysql -uroot -prootpassword healthcare_saas
```

### Remove everything (careful - deletes data!):
```powershell
docker-compose -f docker-compose.mysql.yml down -v
```

---

## 📊 Access phpMyAdmin

Open browser: http://localhost:8080

Login with:
- **Server**: `mysql`
- **Username**: `root`
- **Password**: `rootpassword`

You can now:
- View all tables
- Run SQL queries
- Import/export data
- Manage the database visually

---

## 🐛 Troubleshooting

### "docker command not found"
- Make sure Docker Desktop is installed and running
- Restart PowerShell after installing Docker

### "port is already allocated"
- Another MySQL is using port 3306
- Stop it or change port in `docker-compose.mysql.yml`

### Backend can't connect to database
- Check containers are running: `docker ps`
- Restart containers: `docker-compose -f docker-compose.mysql.yml restart`
- Check `.env` file has correct password: `rootpassword`

### Schema import fails
Try using phpMyAdmin instead:
1. Go to http://localhost:8080
2. Login (server: `mysql`, user: `root`, pass: `rootpassword`)
3. Select `healthcare_saas` database
4. Click **Import** tab
5. Upload `database/mysql-schema.sql`
6. Click **Go**

---

## 🎉 Create First Admin User

Once backend is running, create a user via phpMyAdmin SQL tab:

```sql
USE healthcare_saas;

-- Create tenant
INSERT INTO tenants (id, name, subdomain, subscription_tier, status) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Clinic', 'demo', 'enterprise', 'active');

-- Create admin user (email: admin@demo.com, password: admin123)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, tenant_id, status) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'admin@demo.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Admin',
  'User',
  'admin',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
);
```

**Login credentials:**
- Email: `admin@demo.com`
- Password: `admin123`

---

## ✅ Quick Checklist

- [ ] Docker Desktop installed and running
- [ ] Ran `docker-compose -f docker-compose.mysql.yml up -d`
- [ ] Waited 30 seconds for MySQL to initialize
- [ ] Imported schema: `database/mysql-schema.sql`
- [ ] Created `backend/.env` file
- [ ] Started backend: `npm run start:dev`
- [ ] Started frontend: `npm start`
- [ ] Created admin user via phpMyAdmin
- [ ] Can login at http://localhost:3000

---

## 🚀 You're All Set!

Your development environment is now running with:
- Docker MySQL (persistent data)
- phpMyAdmin (easy database management)
- Backend API (auto-restart on code changes)
- Frontend (hot reload)

**Everything is containerized and easy to manage!**

