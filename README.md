# Healthcare SaaS Platform

A comprehensive healthcare SaaS platform for dental practice management with marketplace capabilities, built with modern technologies and security-first architecture.

## 🏗️ Architecture Overview

### Core Components
- **Backend**: NestJS + TypeScript + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **Mobile**: Android (Kotlin + Jetpack Compose) - *Coming Soon*
- **AI/ML**: Python + FastAPI + PyTorch - *Coming Soon*

### Key Features
- ✅ Multi-tenant architecture with data isolation
- ✅ PHI encryption and HIPAA compliance
- ✅ Role-based access control (RBAC)
- ✅ Patient management with encrypted demographics
- ✅ Appointment scheduling with conflict detection
- ✅ Real-time notifications and audit logging
- 🔄 Marketplace for dental supplies - *In Progress*
- 🔄 AI-powered treatment recommendations - *Planned*
- 🔄 Mobile app for patients - *Planned*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+ (optional, for caching)

### Backend Setup

1. **Clone and Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Configuration**
```bash
cp env.example .env
# Edit .env with your database credentials
```

3. **Database Setup**
```bash
# Create database
createdb healthcare_platform

# Run the schema setup
psql healthcare_platform < ../database/schema.sql
```

4. **Start Development Server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`
API Documentation: `http://localhost:3001/api/docs`

### Frontend Setup

1. **Install Dependencies**
```bash
cd admin-panel
npm install
```

2. **Start Development Server**
```bash
npm start
```

The admin panel will be available at `http://localhost:3000`

### Default Credentials
- **Email**: admin@healthcare-platform.com
- **Password**: Admin123!

## 📊 Database Schema

### Core Tables
- `tenants` - Multi-tenant organization data
- `users` - User accounts with RBAC
- `patients` - Patient records with encrypted PHI
- `appointments` - Appointment scheduling
- `audit_logs` - Compliance and security logging

### Security Features
- **PHI Encryption**: Patient demographics encrypted with AES-256-GCM
- **Tenant Isolation**: All queries filtered by tenant_id
- **Audit Logging**: Complete access trail for compliance
- **JWT Authentication**: Secure token-based auth with refresh

## 🔐 Security Implementation

### PHI Protection
```typescript
// Patient demographics are encrypted at rest
const encryptedDemographics = await phiEncryptionService.encryptPatientDemographics(
  patientData,
  tenantId
);
```

### Tenant Isolation
```typescript
// All queries automatically filtered by tenant
const patients = await patientsRepository.find({
  where: { tenant_id: user.tenantId }
});
```

### Audit Logging
```typescript
// All PHI access is logged
await auditService.logPHIAccess(
  userId, tenantId, 'patient', patientId, 'view'
);
```

## 🛠️ API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile

### Patients
- `GET /patients` - List patients (tenant-filtered)
- `POST /patients` - Create new patient
- `GET /patients/:id` - Get patient details
- `PATCH /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient
- `GET /patients/search` - Search patients
- `GET /patients/stats` - Patient statistics

### Appointments
- `GET /appointments` - List appointments
- `POST /appointments` - Create appointment
- `PATCH /appointments/:id` - Update appointment
- `PATCH /appointments/:id/cancel` - Cancel appointment
- `GET /appointments/schedule/:providerId` - Provider schedule
- `GET /appointments/stats` - Appointment statistics

### Tenants
- `GET /tenants` - List tenants (admin only)
- `POST /tenants` - Create tenant
- `GET /tenants/:id/stats` - Tenant statistics

## 🎯 Development Roadmap

### Phase 1: Foundation ✅
- [x] Database schema with multi-tenancy
- [x] NestJS backend with TypeORM
- [x] JWT authentication and RBAC
- [x] Patient management with PHI encryption
- [x] Appointment scheduling system
- [x] React admin panel

### Phase 2: Core Features 🔄
- [ ] Marketplace service for suppliers
- [ ] Inventory management
- [ ] Billing and payment processing
- [ ] Advanced appointment features
- [ ] Clinical notes and treatment plans

### Phase 3: Advanced Features 📋
- [ ] AI treatment recommendations
- [ ] Predictive analytics
- [ ] Mobile app for patients
- [ ] WhatsApp integration
- [ ] Insurance claim processing

### Phase 4: Scale & Optimize 📋
- [ ] Microservices architecture
- [ ] Event-driven architecture
- [ ] Advanced monitoring
- [ ] Performance optimization
- [ ] Multi-region deployment

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend Tests
```bash
cd admin-panel
npm test
```

## 📦 Deployment

### Docker (Recommended)
```bash
# Build and run with docker-compose
docker-compose up -d
```

### Manual Deployment
1. Set production environment variables
2. Build backend: `npm run build`
3. Build frontend: `npm run build`
4. Deploy to your hosting platform

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=healthcare_platform
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-encryption-key
NODE_ENV=production
```

#### Frontend
```env
REACT_APP_API_URL=http://localhost:3001
```

## 📚 API Documentation

Once the backend is running, visit `http://localhost:3001/api/docs` for interactive API documentation powered by Swagger.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the code examples in the `/examples` directory

---

**Built with ❤️ for the healthcare industry**
