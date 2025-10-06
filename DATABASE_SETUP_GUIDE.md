# 📊 Database Setup Guide - Step by Step

Since you don't have MySQL or Docker installed yet, I'll give you multiple options:

---

## 🎯 **OPTION 1: Use XAMPP (Recommended for Windows - Easiest)**

### Step 1: Download & Install XAMPP
1. Go to: https://www.apachefriends.org/download.html
2. Download **XAMPP for Windows** (includes MySQL)
3. Run the installer
4. **Select components**: Make sure **MySQL** and **phpMyAdmin** are checked
5. Install to default location (C:\xampp)

### Step 2: Start MySQL
1. Open **XAMPP Control Panel** (Start Menu → XAMPP)
2. Click **Start** next to **MySQL**
3. Click **Start** next to **Apache** (for phpMyAdmin)
4. MySQL should now be running on port 3306

### Step 3: Create Database
1. Open browser and go to: http://localhost/phpmyadmin
2. Click **"New"** in the left sidebar
3. Enter database name: `healthcare_saas`
4. Click **"Create"**

### Step 4: Import Schema
1. In phpMyAdmin, select `healthcare_saas` database (left sidebar)
2. Click **"Import"** tab at the top
3. Click **"Choose File"** button
4. Navigate to: `C:\Users\pc\OneDrive\Desktop\SAAS\database\mysql-schema.sql`
5. Click **"Import"** button at bottom
6. Wait for success message

### Step 5: Create .env File
1. Copy the file below and save as `backend/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=healthcare_saas

# JWT Secret (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-change-this

# Application
NODE_ENV=development
PORT=3001

# Optional: Redis (can leave empty, app will work without it)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Step 6: Test Connection
```powershell
cd backend
npm run start:dev
```

---

## 🐳 **OPTION 2: Install Docker Desktop (Alternative)**

### Step 1: Install Docker
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Install and restart your computer
3. Start Docker Desktop

### Step 2: Run MySQL with Docker
```powershell
cd C:\Users\pc\OneDrive\Desktop\SAAS

# Start MySQL container
docker-compose -f docker-compose.mysql.yml up -d

# Wait 30 seconds for MySQL to start
Start-Sleep -Seconds 30
```

### Step 3: Import Schema
```powershell
# Import the schema
docker exec -i saas_mysql mysql -uroot -prootpassword healthcare_saas < database\mysql-schema.sql
```

### Step 4: Create .env File
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=rootpassword
DB_NAME=healthcare_saas
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
NODE_ENV=development
PORT=3001
```

---

## 🌐 **OPTION 3: Use Hostinger MySQL (Your Production Setup)**

If you already have Hostinger hosting:

### Step 1: Login to Hostinger
1. Go to https://hostinger.com
2. Login to your account
3. Go to **Hosting → Manage**

### Step 2: Create MySQL Database
1. Find **Databases** section
2. Click **"MySQL Databases"**
3. Create new database: `healthcare_saas`
4. Create new user or use existing
5. Grant **ALL PRIVILEGES** to user
6. **Note down**:
   - Database Host (usually: `localhost` or `mysql.hostinger.com`)
   - Database Name
   - Database Username
   - Database Password

### Step 3: Import Schema via phpMyAdmin
1. In Hostinger panel, click **phpMyAdmin**
2. Select your database
3. Click **Import**
4. Upload `database/mysql-schema.sql`
5. Click **Go**

### Step 4: Create .env File
```env
DB_HOST=your-hostinger-mysql-host
DB_PORT=3306
DB_USERNAME=your_hostinger_db_user
DB_PASSWORD=your_hostinger_db_password
DB_NAME=healthcare_saas
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
NODE_ENV=production
PORT=3001
```

---

## 📝 **After Database Setup - Test Your Application**

### 1. Verify Database Connection
```powershell
cd backend
node -e "const mysql = require('mysql2'); const conn = mysql.createConnection({host:'localhost',user:'root',password:'',database:'healthcare_saas'}); conn.connect((err)=>{if(err){console.error('❌ Error:',err.message)}else{console.log('✅ Connected successfully!')}conn.end()});"
```

### 2. Start Backend Server
```powershell
cd backend
npm run start:dev
```

You should see:
```
✅ Connected to database successfully
✅ Application is running on: http://localhost:3001
```

### 3. Start Frontend
```powershell
# In a NEW terminal window
cd admin-panel
npm start
```

Frontend opens at: http://localhost:3000

---

## 🔍 **Troubleshooting**

### Error: "Can't connect to MySQL server"
- **XAMPP**: Make sure MySQL is running in XAMPP Control Panel
- **Docker**: Run `docker ps` to verify container is running
- **Hostinger**: Check if your IP is whitelisted in Hostinger panel

### Error: "Access denied for user"
- Check username/password in `.env` file
- XAMPP default: user=`root`, password=`` (empty)
- Docker default: user=`root`, password=`rootpassword`

### Error: "Unknown database"
- Make sure you created the database
- Check database name matches in `.env`

### Backend starts but shows database errors
- Import the schema using phpMyAdmin or mysql command
- Verify all tables were created

### Port 3306 already in use
- Another MySQL is running
- Stop other MySQL services or change port in `.env`

---

## ✅ **Quick Start Checklist**

- [ ] Install XAMPP/Docker
- [ ] Start MySQL service
- [ ] Create `healthcare_saas` database
- [ ] Import `database/mysql-schema.sql`
- [ ] Create `backend/.env` file with correct credentials
- [ ] Run `cd backend && npm run start:dev`
- [ ] Verify backend starts without errors
- [ ] Run `cd admin-panel && npm start`
- [ ] Open http://localhost:3000

---

## 🎉 **Next Steps After Setup**

Once your database is running:

1. **Create First User** (via API or database)
2. **Login to Admin Panel** at http://localhost:3000
3. **Test Features**:
   - Patient management
   - Appointments
   - Billing
   - Analytics

---

## 💡 **My Recommendation**

For local development on Windows:
👉 **Use XAMPP** - It's the simplest and most reliable for Windows

For production:
👉 **Use Hostinger MySQL** - Your hosting already includes it

Would you like me to help you with any specific option? Let me know which one you want to use!

