# 🚀 Quick Database Setup - Choose Your Path

## ✅ **Fastest Option: XAMPP (5 minutes)**

### 1️⃣ Install XAMPP
- Download: https://www.apachefriends.org/download.html
- Run installer → Select MySQL + phpMyAdmin → Install

### 2️⃣ Start MySQL
- Open XAMPP Control Panel
- Click **Start** next to MySQL
- Click **Start** next to Apache

### 3️⃣ Create Database
- Open browser: http://localhost/phpmyadmin
- Click **"New"** → Name: `healthcare_saas` → Click **Create**

### 4️⃣ Import Schema
- Select `healthcare_saas` database
- Click **Import** tab
- Choose File: `database/mysql-schema.sql`
- Click **Import** (wait for success)

### 5️⃣ Create .env File

**Copy this file to: `backend/.env`**

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=healthcare_saas

JWT_SECRET=my-super-secret-jwt-key-at-least-32-characters-long-secure
ENCRYPTION_KEY=32-character-encryption-key!!

NODE_ENV=development
PORT=3001
```

### 6️⃣ Start Your App
```powershell
# Backend
cd backend
npm run start:dev

# Frontend (new terminal)
cd admin-panel
npm start
```

**Done! 🎉** Backend: http://localhost:3001 | Frontend: http://localhost:3000

---

## 🔧 **Troubleshooting**

**Backend won't start?**
- Check if MySQL is running in XAMPP Control Panel
- Verify `.env` file exists in `backend/` folder
- Make sure `healthcare_saas` database exists

**"Cannot find module mysql2"?**
```powershell
cd backend
npm install
```

**Database connection error?**
- XAMPP: password should be **empty** (no password)
- Check database name matches: `healthcare_saas`

**Frontend errors?**
```powershell
cd admin-panel
npm install
npm start
```

---

## 📚 **Full Guide**

For detailed instructions with all options (Docker, Hostinger, etc.), see:
👉 `DATABASE_SETUP_GUIDE.md`

---

## ✨ **What's Next?**

After your servers are running:

1. **Backend API**: http://localhost:3001/health (should show "ok")
2. **Admin Panel**: http://localhost:3000 (login page)
3. **phpMyAdmin**: http://localhost/phpmyadmin (manage database)

### Create First Admin User

Run this in phpMyAdmin SQL tab:

```sql
-- Use your healthcare_saas database
USE healthcare_saas;

-- Create a tenant first
INSERT INTO tenants (id, name, subdomain, subscription_tier, status) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Main Clinic', 'main', 'enterprise', 'active');

-- Create admin user (password: admin123)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, tenant_id, status) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'admin@clinic.com',
  '$2b$10$rBV2ifCh0Wg3N.kLm4r5eO1kD5p3ZGBxKwZxf5o8Y5kQlZJ7qj8y2',
  'Admin',
  'User',
  'admin',
  '550e8400-e29b-41d4-a716-446655440000',
  'active'
);
```

**Login with:**
- Email: `admin@clinic.com`
- Password: `admin123`

---

## 🎯 **Status Checklist**

- [ ] XAMPP installed
- [ ] MySQL running (green in XAMPP)
- [ ] Database `healthcare_saas` created
- [ ] Schema imported (51 tables created)
- [ ] `backend/.env` file created
- [ ] Backend starts without errors
- [ ] Frontend compiles successfully
- [ ] Can access http://localhost:3000

Need help? Check `DATABASE_SETUP_GUIDE.md` or ask me!

