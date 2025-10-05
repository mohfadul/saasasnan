# Healthcare SaaS Platform - Setup Guide

## 🚀 Quick Start (5 Minutes)

### 1. Database Setup
```bash
# Install PostgreSQL (if not installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql postgresql-contrib

# Create database
createdb healthcare_platform

# Run schema setup
psql healthcare_platform < database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your database credentials
npm run start:dev
```

### 3. Frontend Setup
```bash
cd admin-panel
npm install
npm start
```

### 4. Access the Platform
- **Admin Panel**: http://localhost:3000
- **API Documentation**: http://localhost:3001/api/docs
- **Default Login**: admin@healthcare-platform.com / Admin123!

## 🔧 Detailed Setup

### Environment Configuration

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=healthcare_platform

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Encryption
ENCRYPTION_KEY=your-encryption-key-change-in-production
```

### Database Schema
The platform includes these core tables:
- `tenants` - Multi-tenant organizations
- `users` - User accounts with roles
- `patients` - Patient records (PHI encrypted)
- `appointments` - Scheduling system
- `audit_logs` - Compliance logging

### Security Features
- ✅ **PHI Encryption**: Patient data encrypted with AES-256-GCM
- ✅ **Tenant Isolation**: All data filtered by tenant_id
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Audit Logging**: Complete access trail
- ✅ **Role-based Access**: RBAC with 6 user roles

## 🧪 Testing the Setup

### 1. Test Database Connection
```bash
cd backend
npm run start:dev
# Should see: "🚀 Healthcare Platform API running on port 3001"
```

### 2. Test API Endpoints
```bash
# Test login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@healthcare-platform.com","password":"Admin123!"}'

# Test patient list (with JWT token)
curl -X GET http://localhost:3001/patients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Frontend
- Open http://localhost:3000
- Login with admin credentials
- Navigate to Patients section
- Try creating a new patient

## 📊 What's Built

### ✅ Completed Features
1. **Multi-tenant Architecture**
   - Tenant isolation at database level
   - Tenant-specific configuration
   - Super admin can manage all tenants

2. **Authentication & Authorization**
   - JWT-based authentication
   - 6 user roles (super_admin, clinic_admin, dentist, staff, supplier, patient)
   - Account lockout after failed attempts
   - MFA support (infrastructure ready)

3. **Patient Management**
   - Encrypted PHI storage
   - Patient demographics with encryption
   - Search and filtering
   - Audit logging for all access

4. **Appointment System**
   - Conflict detection
   - Status tracking (scheduled, confirmed, completed, etc.)
   - Provider scheduling
   - Recurring appointments support

5. **React Admin Panel**
   - Modern UI with Tailwind CSS
   - Patient management interface
   - Dashboard with statistics
   - Responsive design

### 🔄 Next Steps
1. **Marketplace Service** - Supplier management and product catalog
2. **Mobile App** - Patient engagement app
3. **AI Features** - Treatment recommendations
4. **Advanced Analytics** - Business intelligence
5. **Payment Processing** - Billing integration

## 🛠️ Development Commands

### Backend
```bash
npm run start:dev    # Development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
```

### Frontend
```bash
npm start           # Development server
npm run build       # Build for production
npm test            # Run tests
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify credentials in .env
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes

3. **JWT Token Issues**
   - Check JWT_SECRET in .env
   - Ensure token is not expired

4. **CORS Errors**
   - Verify FRONTEND_URL in backend .env
   - Check proxy setting in frontend package.json

### Getting Help
- Check API docs at http://localhost:3001/api/docs
- Review error logs in terminal
- Verify all environment variables are set

## 📈 Production Deployment

### Docker Setup (Recommended)
```bash
# Build and run with docker-compose
docker-compose up -d
```

### Manual Deployment
1. Set production environment variables
2. Build backend: `npm run build`
3. Build frontend: `npm run build`
4. Deploy to your hosting platform

### Security Checklist
- [ ] Change default JWT secret
- [ ] Change default encryption key
- [ ] Use HTTPS in production
- [ ] Set up proper database backups
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up monitoring

---

**🎉 You're ready to start building your healthcare platform!**
