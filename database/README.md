# 🗄️ Database Documentation - Healthcare SaaS Platform

**Database**: healthcare_saas  
**Engine**: MySQL 8.0+  
**Character Set**: utf8mb4  
**Collation**: utf8mb4_unicode_ci  
**Total Tables**: 39  

---

## 📁 Directory Structure

```
database/
├── schemas/
│   ├── 00-master-schema.sql       ⭐ REQUIRED (31 core tables)
│   ├── 01-pharmacy-module.sql     ⭐ OPTIONAL (8 pharmacy tables)
│   ├── modules/                   📚 Reference schemas
│   │   ├── ai-module.sql          (AI tables - subset of master)
│   │   ├── analytics-module.sql   (Analytics tables - subset of master)
│   │   └── features-module.sql    (Feature flags - subset of master)
│   └── archive/                   📁 Legacy development schemas
│       ├── schema.sql             (old PostgreSQL schema)
│       ├── phase2-schema.sql      (development artifact)
│       ├── phase3-billing-schema.sql (merged into master)
│       └── phase4-advanced-schema.sql (merged into master)
│
├── migrations/                    🔄 Incremental schema updates
│   ├── fix-*.sql                  (Bug fixes)
│   ├── add-*.sql                  (Column additions)
│   └── sudan-payment-system-migration.sql
│
├── seeds/                         🌱 Test & initial data
│   ├── create-admin-user.sql     (Default admin account)
│   ├── create-test-clinic.sql    (Sample clinic)
│   └── insert-test-patients.sql  (Sample patient data)
│
└── performance/                   ⚡ Performance optimization
    ├── performance-optimization-indexes.sql
    └── verify-indexes.sql
```

---

## 🚀 Quick Start

### **New Installation** (Fresh Database)

```bash
# Step 1: Create database
mysql -u root -e "CREATE DATABASE healthcare_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Step 2: Run master schema (REQUIRED - 31 tables)
mysql -u root healthcare_saas < schemas/00-master-schema.sql

# Step 3: Run pharmacy module (OPTIONAL - 8 tables)
mysql -u root healthcare_saas < schemas/01-pharmacy-module.sql

# Step 4: Create admin user
mysql -u root healthcare_saas < seeds/create-admin-user.sql

# Step 5: Create test clinic (for development)
mysql -u root healthcare_saas < seeds/create-test-clinic.sql

# Step 6: Verify installation
mysql -u root healthcare_saas -e "SHOW TABLES;"
# Should show 39 tables (or 31 without pharmacy)
```

### **Updating Existing Database**

```bash
# Run any pending migrations
mysql -u root healthcare_saas < migrations/[migration-file].sql

# Or apply all migrations (BE CAREFUL!)
for file in migrations/*.sql; do
  mysql -u root healthcare_saas < "$file"
done
```

---

## 📊 Schema Files

### **00-master-schema.sql** (35KB, 31 tables)

**Purpose**: Complete core platform  
**Status**: ✅ Production-ready  
**Tables**:
- Core: tenants, clinics, users, patients (6 tables)
- Marketplace: suppliers, products, orders, inventory (7 tables)
- Billing: invoices, payments, insurance (6 tables)
- Clinical: clinical_notes, treatment_plans (2 tables)
- AI/ML: ai_models, ai_predictions, ai_insights (3 tables)
- Analytics: analytics_events, performance_metrics (2 tables)
- Features: feature_flags, ab_tests (3 tables)
- System: alerts, appointment_conflicts (2 tables)

### **01-pharmacy-module.sql** (13KB, 8 tables)

**Purpose**: Pharmacy management module  
**Status**: ✅ Production-ready  
**Dependencies**: Requires 00-master-schema.sql first  
**Tables**:
- pharmacy_drug_categories
- pharmacy_suppliers
- pharmacy_drugs
- pharmacy_drug_inventory
- pharmacy_sales
- pharmacy_sale_items
- pharmacy_doctor_prescriptions
- pharmacy_prescription_items

---

## 📋 Table Categories

### **Core Platform** (31 tables)

| Category | Count | Tables |
|----------|-------|--------|
| Multi-tenancy | 3 | tenants, clinics, users |
| Patient Management | 3 | patients, appointments, appointment_recurrences |
| Marketplace | 7 | suppliers, products, orders, inventory, etc. |
| Billing | 6 | invoices, payments, insurance, etc. |
| Clinical | 2 | clinical_notes, treatment_plans |
| AI/ML | 3 | ai_models, ai_predictions, ai_insights |
| Analytics | 2 | analytics_events, performance_metrics |
| Features | 3 | feature_flags, ab_tests, ab_test_participants |
| System | 2 | alerts, alert_incidents, appointment_conflicts |

### **Pharmacy Module** (8 tables)

| Category | Count | Tables |
|----------|-------|--------|
| Drug Management | 3 | pharmacy_drugs, pharmacy_drug_categories, pharmacy_drug_inventory |
| Sales/POS | 2 | pharmacy_sales, pharmacy_sale_items |
| Prescriptions | 2 | pharmacy_doctor_prescriptions, pharmacy_prescription_items |
| Suppliers | 1 | pharmacy_suppliers |

---

## 🔗 Key Relationships

```
tenants (1:N)
  ├──> clinics (1:N)
  │     ├──> users
  │     ├──> patients (1:N)
  │     │     ├──> appointments
  │     │     ├──> clinical_notes
  │     │     ├──> treatment_plans
  │     │     ├──> invoices (1:N)
  │     │     │     ├──> invoice_items
  │     │     │     └──> payments
  │     │     └──> pharmacy_sales
  │     ├──> orders
  │     └──> pharmacy_drugs
  ├──> suppliers (1:N)
  │     └──> products (1:N)
  │           └──> inventory
  └──> pharmacy_suppliers (1:N)
        └──> pharmacy_drugs
```

---

## 🔐 Security Features

### **Multi-Tenancy**
- All tables include `tenant_id`
- Foreign key to `tenants(id)` with CASCADE delete
- Queries automatically scoped by tenant

### **PHI Encryption**
```sql
patients.encrypted_demographics LONGBLOB  -- AES-256-GCM encrypted
patients.demographics_key_id              -- KMS key reference
```

### **Audit Logging**
- `created_at`, `updated_at` on all tables
- `created_by`, `updated_by` where applicable
- `deleted_at` for soft deletes
- Separate `payment_audit_log` for payment tracking

---

## 📈 Performance

### **Indexing Strategy**
- ✅ All primary keys indexed
- ✅ All foreign keys indexed
- ✅ Composite indexes on common query patterns
- ✅ Unique indexes on business rules
- ✅ **Total**: 150+ indexes

### **Optimization Scripts**
```bash
# Analyze table statistics
mysql healthcare_saas < performance/verify-indexes.sql

# Add optimized indexes
mysql healthcare_saas < performance/performance-optimization-indexes.sql
```

---

## 🧪 Validation

### **Table Count Check**
```sql
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'healthcare_saas';
-- Expected: 39 (with pharmacy) or 31 (without)
```

### **Foreign Key Check**
```sql
SELECT COUNT(*) as foreign_keys
FROM information_schema.key_column_usage
WHERE table_schema = 'healthcare_saas'
  AND referenced_table_name IS NOT NULL;
-- Expected: 85+
```

### **Index Check**
```sql
SELECT COUNT(*) as total_indexes
FROM information_schema.statistics
WHERE table_schema = 'healthcare_saas';
-- Expected: 150+
```

---

## 📚 Additional Documentation

- **DATABASE_ARCHITECTURE_REPORT.md** - Complete database analysis
- **DATABASE_ERD.md** - Full ERD with all relationships
- **DATABASE_MIGRATION_GUIDE.md** - Schema reorganization guide
- **NAMING_CONVENTIONS.md** - Database naming standards (in project root)

---

## ⚠️ Important Notes

### **For Production**
1. Always backup before schema changes
2. Test migrations on staging first
3. Use transactions for multi-step migrations
4. Monitor performance after large changes

### **For Development**
1. Use `00-master-schema.sql` as base
2. Keep dev DB in sync with schema files
3. Don't modify schemas directly - use migrations
4. Seed data available for testing

---

## 🆘 Troubleshooting

### **Tables Not Created**
```bash
# Check MySQL version (need 8.0+)
mysql -u root -e "SELECT VERSION();"

# Check for errors in schema execution
mysql -u root healthcare_saas < schemas/00-master-schema.sql 2>&1 | grep ERROR
```

### **Foreign Key Errors**
```bash
# Disable temporarily to diagnose
SET FOREIGN_KEY_CHECKS=0;
# ... run query ...
SET FOREIGN_KEY_CHECKS=1;
```

### **Character Set Issues**
```sql
-- Verify database charset
SHOW CREATE DATABASE healthcare_saas;
-- Should show: CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
```

---

**Last Updated**: October 7, 2025  
**Schema Version**: 2.0  
**Status**: ✅ Production Ready  
**Total Tables**: 39  
**Total Indexes**: 150+  
