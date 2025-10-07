# Project Structure

## Overview

This document describes the organized structure of the Healthcare SaaS Platform codebase.

## Directory Layout

```
healthcare-saas/
├── admin-panel/                 # React Frontend Application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── __tests__/          # Test files
│   │   ├── components/         # React components (organized by feature)
│   │   │   ├── ai/            # AI-related components
│   │   │   ├── analytics/     # Analytics components
│   │   │   ├── appointments/  # Appointment components
│   │   │   ├── billing/       # Billing components
│   │   │   ├── clinical/      # Clinical notes & treatment plans
│   │   │   ├── layout/        # Layout components (Header, Sidebar, etc.)
│   │   │   ├── marketplace/   # Marketplace components
│   │   │   ├── patients/      # Patient management components
│   │   │   └── ui/            # Reusable UI components (button, card, badge)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Library utilities (cn, status colors)
│   │   ├── pages/             # Page components (routing)
│   │   ├── services/          # API client services
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions (currency, date, validation)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # NestJS Backend Application
│   ├── src/
│   │   ├── ai/                # AI predictions & insights module
│   │   ├── analytics/         # Analytics & reporting module
│   │   ├── appointments/      # Appointment management module
│   │   ├── auth/              # Authentication & authorization module
│   │   ├── billing/           # Billing & payments module
│   │   │   ├── controllers/   # Sudan payments controller
│   │   │   ├── entities/      # Billing entities
│   │   │   └── services/      # Payment services
│   │   ├── clinical/          # Clinical notes & treatment plans
│   │   ├── common/            # Shared code
│   │   │   ├── decorators/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── exceptions/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   ├── database/          # Database configuration
│   │   ├── features/          # Feature flags & A/B testing
│   │   ├── health/            # Health check endpoints
│   │   ├── inventory/         # Inventory management
│   │   ├── marketplace/       # Marketplace module
│   │   ├── monitoring/        # System monitoring
│   │   ├── patients/          # Patient management
│   │   ├── tenants/           # Multi-tenant management
│   │   ├── testing/           # Test utilities
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry point
│   ├── test/                  # Test files
│   │   ├── integration/
│   │   ├── performance/
│   │   └── unit/
│   ├── package.json
│   └── tsconfig.json
│
├── database/                    # Database Scripts
│   ├── schemas/               # Main schema files
│   │   ├── mysql-schema.sql          # ⭐ PRIMARY: Complete MySQL schema
│   │   ├── schema.sql                # Legacy PostgreSQL schema
│   │   ├── phase2-schema.sql
│   │   ├── phase3-billing-schema.sql
│   │   ├── phase4-advanced-schema.sql
│   │   ├── ai-schema.sql
│   │   ├── analytics-schema.sql
│   │   └── features-schema.sql
│   ├── migrations/            # Database migrations & fixes
│   │   ├── fix-*.sql         # Bug fixes
│   │   ├── add-*.sql         # Column additions
│   │   └── rename-*.sql      # Renaming operations
│   ├── seeds/                 # Test data
│   │   ├── create-*.sql      # Create test records
│   │   └── insert-*.sql      # Insert test data
│   ├── performance/           # Performance optimization
│   │   ├── performance-optimization-indexes.sql  # ⭐ All indexes
│   │   └── verify-indexes.sql
│   └── README.md
│
├── docs/                        # Documentation
│   ├── archive/               # Historical documentation (68+ files)
│   ├── setup/                 # Setup guides
│   │   ├── DOCKER_SETUP.md
│   │   ├── MANUAL_DATABASE_SETUP.md
│   │   ├── MANUAL_STARTUP.md
│   │   ├── QUICK_DATABASE_SETUP.md
│   │   └── SETUP.md
│   └── SUDAN_PAYMENT_SYSTEM_IMPLEMENTATION.md
│
├── k8s/                         # Kubernetes Configuration
│   ├── deployment.yaml
│   └── rollback.yaml
│
├── mobile-app/                  # React Native Mobile App
│   ├── src/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                     # Utility Scripts
│   ├── startup/               # Application startup scripts
│   │   ├── run-dev.bat
│   │   ├── run-dev.sh
│   │   ├── start-dev.bat
│   │   ├── start-dev.sh
│   │   ├── start-dev-environment.bat
│   │   ├── start-dev-environment.ps1
│   │   └── START_APPLICATION.bat
│   ├── deploy.sh              # Deployment script
│   └── docker-setup-quick.ps1
│
├── docker-compose.mysql.yml     # Docker Compose for MySQL
├── docker-compose.yml           # Docker Compose main
├── .gitignore                   # Git ignore patterns
├── PROJECT_STRUCTURE.md         # This file
├── README.md                    # Main documentation
└── START_HERE.md               # Quick start guide

```

## Naming Conventions

### Frontend (admin-panel)
- **Components**: PascalCase (e.g., `PatientTable.tsx`, `InvoiceTable.tsx`)
- **Pages**: PascalCase with "Page" suffix (e.g., `DashboardPage.tsx`)
- **Services**: kebab-case with "-api" suffix (e.g., `billing-api.ts`)
- **Utils**: kebab-case with ".utils" suffix (e.g., `currency.utils.ts`)
- **Types**: kebab-case (e.g., `billing.ts`, `marketplace.ts`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`)

### Backend
- **Modules**: kebab-case directories (e.g., `billing/`, `appointments/`)
- **Controllers**: kebab-case with ".controller.ts" (e.g., `billing.controller.ts`)
- **Services**: kebab-case with ".service.ts" (e.g., `billing.service.ts`)
- **Entities**: kebab-case with ".entity.ts" (e.g., `invoice.entity.ts`)
- **DTOs**: kebab-case with ".dto.ts" (e.g., `create-invoice.dto.ts`)
- **Guards**: kebab-case with ".guard.ts" (e.g., `jwt-auth.guard.ts`)
- **Decorators**: kebab-case with ".decorator.ts" (e.g., `roles.decorator.ts`)

### Database
- **Schemas**: kebab-case with "-schema.sql" (e.g., `mysql-schema.sql`)
- **Migrations**: prefix with action (e.g., `fix-*.sql`, `add-*.sql`)
- **Seeds**: prefix with purpose (e.g., `create-*.sql`, `insert-*.sql`)
- **Performance**: prefix with "performance-" (e.g., `performance-optimization-indexes.sql`)

### Documentation
- **Root docs**: UPPERCASE with underscores (e.g., `START_HERE.md`, `README.md`)
- **Subdirectory docs**: UPPERCASE with underscores (e.g., `DOCKER_SETUP.md`)

## Module Organization

### Frontend Modules
Each feature module in `admin-panel/src/components/` follows this pattern:
- `<Feature>Table.tsx` - List/table view
- `<Feature>Form.tsx` - Create/edit form
- Supporting components as needed

### Backend Modules
Each module in `backend/src/` follows NestJS conventions:
```
module-name/
├── module-name.controller.ts    # HTTP endpoints
├── module-name.service.ts       # Business logic
├── module-name.module.ts        # Module definition
├── entities/                    # Database entities
├── dto/                         # Data transfer objects
├── controllers/                 # Additional controllers
└── services/                    # Additional services
```

## Key Files

### Configuration Files
- `backend/.env` - Backend environment variables
- `backend/package.json` - Backend dependencies
- `admin-panel/package.json` - Frontend dependencies
- `mobile-app/package.json` - Mobile app dependencies
- `tsconfig.json` - TypeScript configuration (in each project)
- `docker-compose.yml` - Docker configuration

### Entry Points
- `backend/src/main.ts` - Backend application entry
- `admin-panel/src/index.tsx` - Frontend application entry
- `mobile-app/index.js` - Mobile app entry

### Primary Database Schema
- `database/schemas/mysql-schema.sql` - Complete MySQL schema (USE THIS)

## Best Practices

1. **Keep modules focused**: Each module should have a single responsibility
2. **Use consistent naming**: Follow the conventions above
3. **Organize by feature**: Group related files together
4. **Minimize dependencies**: Keep modules loosely coupled
5. **Document changes**: Update relevant documentation when making changes

## Development Workflow

1. **Start backend**: `cd backend && npm run start:dev`
2. **Start frontend**: `cd admin-panel && npm start`
3. **Run tests**: `npm test` in respective directories
4. **Build for production**: `npm run build` in respective directories

## Deployment Structure

### Development
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`
- API Docs: `http://localhost:3001/api`

### Production
- Use Docker Compose: `docker-compose up -d`
- Or deploy separately to your hosting platform
- See `docs/setup/DOCKER_SETUP.md` for details

