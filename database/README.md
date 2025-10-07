# Database Scripts

This directory contains all database-related SQL scripts organized by purpose.

## Directory Structure

```
database/
├── schemas/              # Main database schema files
│   ├── mysql-schema.sql           # Complete MySQL schema (MAIN - use this)
│   ├── schema.sql                 # Original PostgreSQL schema
│   ├── phase2-schema.sql          # Phase 2 feature additions
│   ├── phase3-billing-schema.sql  # Billing module schema
│   ├── phase4-advanced-schema.sql # Advanced features schema
│   ├── ai-schema.sql              # AI module schema
│   ├── analytics-schema.sql       # Analytics module schema
│   └── features-schema.sql        # Feature flags schema
│
├── migrations/           # Database migrations and fixes
│   ├── fix-*.sql                  # Bug fixes and corrections
│   ├── add-*.sql                  # Column/table additions
│   ├── rename-*.sql               # Renaming operations
│   └── sudan-payment-system-migration.sql
│
├── seeds/                # Test data and initial records
│   ├── create-*.sql               # Create test users/clinics
│   └── insert-*.sql               # Insert test data
│
└── performance/          # Performance optimization scripts
    ├── performance-indexes-mysql.sql
    ├── performance-indexes.sql
    ├── performance-optimization-indexes.sql
    └── verify-indexes.sql
```

## Quick Start

### Initial Setup (MySQL - Current)

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE healthcare_saas;"

# 2. Run main schema
mysql -u root -p healthcare_saas < schemas/mysql-schema.sql

# 3. Apply performance indexes
mysql -u root -p healthcare_saas < performance/performance-optimization-indexes.sql

# 4. Create test data (optional)
mysql -u root -p healthcare_saas < seeds/create-admin-user.sql
mysql -u root -p healthcare_saas < seeds/create-test-clinic.sql
```

### Initial Setup (PostgreSQL - Legacy)

```bash
# 1. Create database
createdb healthcare_platform

# 2. Run schemas in order
psql healthcare_platform < schemas/schema.sql
psql healthcare_platform < schemas/phase2-schema.sql
psql healthcare_platform < schemas/phase3-billing-schema.sql
psql healthcare_platform < schemas/phase4-advanced-schema.sql
psql healthcare_platform < schemas/analytics-schema.sql
psql healthcare_platform < schemas/ai-schema.sql
psql healthcare_platform < schemas/features-schema.sql
```

## Schema Files

- **mysql-schema.sql** - ⭐ PRIMARY: Complete MySQL schema with all tables
- **schema.sql** - Legacy PostgreSQL base schema
- **phase2-schema.sql** - Marketplace & inventory features
- **phase3-billing-schema.sql** - Billing & payment features
- **phase4-advanced-schema.sql** - Advanced scheduling features
- **ai-schema.sql** - AI predictions & insights
- **analytics-schema.sql** - Analytics & reporting
- **features-schema.sql** - Feature flags & A/B testing

## Migrations

Historical migration scripts that have already been applied to the main schema.
These are kept for reference and audit purposes.

## Seeds

Test data scripts for development and testing:
- `create-admin-user.sql` - Creates default admin user
- `create-test-clinic.sql` - Creates test clinic/tenant
- `insert-test-patients.sql` - Sample patient data

## Performance

Index creation and optimization scripts:
- `performance-optimization-indexes.sql` - ⭐ PRIMARY: All optimized indexes

## Notes

- **Current Database**: MySQL 8.0
- **Legacy Support**: PostgreSQL 13+ schemas available
- **Main Schema File**: `schemas/mysql-schema.sql`
- **Performance**: Always apply indexes after schema creation

