# Healthcare SaaS Platform

A comprehensive healthcare SaaS platform for dental practice management with marketplace capabilities, built with modern technologies and security-first architecture.

## 🏗️ Architecture Overview

### Core Components
- **Backend**: NestJS + TypeScript + MySQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **Mobile**: React Native + TypeScript - *In Development*
- **AI/ML**: Integrated Analytics & Predictions - ✅ *Complete*

### Key Features
- ✅ Multi-tenant architecture with data isolation
- ✅ PHI encryption and HIPAA compliance
- ✅ Role-based access control (RBAC)
- ✅ Patient management with encrypted demographics
- ✅ Appointment scheduling with conflict detection
- ✅ Real-time notifications and audit logging
- ✅ Marketplace for dental supplies
- ✅ AI-powered analytics and predictions
- ✅ Billing & payment processing with Sudan payment system
- ✅ Clinical notes & treatment plans
- ✅ Inventory management
- 🔄 Mobile app for patients - *In Development*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+ (via XAMPP or standalone)
- Redis 6+ (optional, for caching)

### Quick Start

**See [START_HERE.md](START_HERE.md) for detailed setup instructions.**

1. **Install XAMPP** (includes MySQL)
2. **Create Database**: `healthcare_saas`
3. **Import Schema**: `database/schemas/mysql-schema.sql`
4. **Configure Backend**: Create `backend/.env` (see START_HERE.md)
5. **Start Services**:
   ```bash
   # Backend
   cd backend
   npm install
   npm run start:dev
   
   # Frontend (new terminal)
   cd admin-panel
   npm install
   npm start
   ```

The admin panel will be available at `http://localhost:3000`
API Documentation: `http://localhost:3001/api`

### Default Credentials
- **Email**: admin@demo.com
- **Password**: Admin123!@#

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
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=healthcare_saas
JWT_SECRET=my-super-secret-jwt-key-at-least-32-characters-long
ENCRYPTION_KEY=this-must-be-exactly-32-chars!
NODE_ENV=development
PORT=3001
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
