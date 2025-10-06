# Healthcare SaaS Platform - Quick Start Guide

## 🚀 Getting Started

Your Healthcare SaaS platform is now ready! Here's how to run it:

### Option 1: Use the Startup Scripts (Recommended)

**Windows:**
```bash
# Double-click or run:
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd admin-panel
npm start
```

## 🌐 Access Your Platform

- **Frontend Admin Panel:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api/docs

## 🔐 Default Login Credentials

- **Email:** admin@healthcare-platform.com
- **Password:** Admin123!

## 📊 Platform Features

### ✅ Completed Features

1. **Core Foundation**
   - Multi-tenant architecture
   - User authentication & authorization
   - Patient management with PHI encryption
   - Appointment scheduling

2. **Business Features**
   - Marketplace for suppliers and products
   - Inventory management
   - Billing and payment processing
   - Insurance provider management

3. **Advanced Features**
   - Recurring appointments
   - Appointment waitlists
   - Clinical notes and treatment plans
   - Advanced analytics dashboards

4. **AI Integration**
   - Predictive analytics
   - Automated insights
   - No-show prediction
   - Revenue forecasting

5. **Mobile App**
   - React Native patient app
   - Appointment booking
   - Health records access

6. **DevOps & Monitoring**
   - CI/CD pipeline
   - Feature flags
   - A/B testing
   - Monitoring and alerting

## 🗄️ Database Setup

**Important:** You need to set up a PostgreSQL database:

1. **Install PostgreSQL** (if not already installed)
2. **Create database:**
   ```sql
   CREATE DATABASE healthcare_platform;
   ```
3. **Run schema:**
   ```bash
   psql healthcare_platform < database/schema.sql
   psql healthcare_platform < database/phase2-schema.sql
   psql healthcare_platform < database/phase3-billing-schema.sql
   psql healthcare_platform < database/phase4-advanced-schema.sql
   psql healthcare_platform < database/analytics-schema.sql
   psql healthcare_platform < database/ai-schema.sql
   psql healthcare_platform < database/features-schema.sql
   ```

4. **Update environment variables** in `backend/.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=healthcare_platform
   ```

## 🔧 Troubleshooting

### Backend Issues
- Check if PostgreSQL is running
- Verify database connection in `backend/.env`
- Check port 3001 is not in use

### Frontend Issues
- Check if port 3000 is not in use
- Verify all dependencies are installed
- Check browser console for errors

### Check Server Status
```bash
# Windows:
check-status.bat

# Or manually check ports:
netstat -ano | findstr ":3000\|:3001"
```

## 📁 Project Structure

```
├── backend/              # NestJS API server
├── admin-panel/          # React admin dashboard
├── mobile-app/           # React Native mobile app
├── database/             # SQL schema files
├── k8s/                  # Kubernetes configurations
├── start-dev.bat         # Windows startup script
├── start-dev.sh          # Linux/Mac startup script
└── check-status.bat      # Status checking script
```

## 🚀 Next Steps

1. **Set up PostgreSQL database**
2. **Run the startup scripts**
3. **Access the admin panel**
4. **Create your first tenant**
5. **Add patients and appointments**
6. **Explore the marketplace**
7. **Set up billing**

## 📚 Documentation

- **README.md** - Complete project overview
- **SETUP.md** - Detailed setup instructions
- **API Documentation** - Available at http://localhost:3001/api/docs

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Check the console logs for errors
4. Ensure PostgreSQL is running and accessible

---

**🎉 Congratulations!** Your comprehensive Healthcare SaaS platform is ready to revolutionize dental practice management!
