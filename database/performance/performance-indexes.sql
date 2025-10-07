-- Performance Optimization Indexes
-- Execute these indexes to significantly improve query performance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Critical performance indexes for appointments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tenant_date_status 
ON appointments(tenant_id, start_time, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tenant_provider_date 
ON appointments(tenant_id, provider_id, start_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tenant_patient_date 
ON appointments(tenant_id, patient_id, start_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tenant_clinic_date 
ON appointments(tenant_id, clinic_id, start_time);

-- Partial indexes for active appointments (most common queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_appointments 
ON appointments(tenant_id, start_time, provider_id) 
WHERE status IN ('scheduled', 'confirmed', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_appointments 
ON appointments(tenant_id, start_time) 
WHERE status = 'scheduled' AND start_time > NOW();

-- Critical performance indexes for patients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_tenant_created 
ON patients(tenant_id, created_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_tenant_clinic_created 
ON patients(tenant_id, clinic_id, created_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_external_id 
ON patients(tenant_id, patient_external_id) 
WHERE deleted_at IS NULL;

-- Enhanced GIN index for patient tags (better performance for JSON queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_tags_gin 
ON patients USING GIN (tags) 
WHERE deleted_at IS NULL;

-- Critical performance indexes for billing/invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_status_date 
ON invoices(tenant_id, status, invoice_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_patient_status 
ON invoices(tenant_id, patient_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_date_status 
ON payments(tenant_id, payment_date, status);

-- Critical performance indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_metrics_tenant_date 
ON analytics_metrics(tenant_id, metric_date, metric_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_metrics_tenant_category 
ON analytics_metrics(tenant_id, metric_category, metric_date);

-- Performance indexes for clinical notes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinical_notes_tenant_patient_created 
ON clinical_notes(tenant_id, patient_id, created_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinical_notes_tenant_provider_created 
ON clinical_notes(tenant_id, provider_id, created_at) 
WHERE deleted_at IS NULL;

-- Performance indexes for treatment plans
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_tenant_patient_status 
ON treatment_plans(tenant_id, patient_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_tenant_provider_status 
ON treatment_plans(tenant_id, provider_id, status) 
WHERE deleted_at IS NULL;

-- Performance indexes for marketplace/products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_status_featured 
ON products(tenant_id, status, is_featured, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_category_status 
ON products(tenant_id, category_id, status);

-- Full-text search index for products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search 
ON products USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Performance indexes for inventory
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_tenant_clinic_status 
ON inventory(tenant_id, clinic_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_tenant_product_status 
ON inventory(tenant_id, product_id, status);

-- Performance indexes for orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tenant_status_date 
ON orders(tenant_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tenant_clinic_date 
ON orders(tenant_id, clinic_id, created_at);

-- Performance indexes for users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_role_active 
ON users(tenant_id, role) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_clinic_role 
ON users(tenant_id, clinic_id, role) 
WHERE deleted_at IS NULL;

-- Performance indexes for audit logs (for compliance queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_timestamp 
ON audit_logs(tenant_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp 
ON audit_logs(user_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource 
ON audit_logs(resource_type, resource_id, created_at);

-- Performance indexes for monitoring/metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_tenant_name_timestamp 
ON metrics(tenant_id, name, timestamp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_tenant_timestamp 
ON metrics(tenant_id, timestamp) 
WHERE status = 'active';

-- Performance indexes for AI insights
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insights_tenant_category_priority 
ON ai_insights(tenant_id, category, priority, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insights_tenant_status_priority 
ON ai_insights(tenant_id, status, priority, created_at);

-- Performance indexes for features/flags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_flags_tenant_active 
ON feature_flags(tenant_id) 
WHERE is_active = true;

-- Performance indexes for A/B testing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ab_tests_tenant_active 
ON ab_tests(tenant_id, is_active, start_date, end_date);

-- Add comments for documentation
COMMENT ON INDEX idx_appointments_tenant_date_status IS 'Optimizes appointment queries by tenant, date range, and status';
COMMENT ON INDEX idx_patients_tenant_created IS 'Optimizes patient listing queries with tenant filtering and creation date sorting';
COMMENT ON INDEX idx_invoices_tenant_status_date IS 'Optimizes billing queries by tenant, status, and date range';
COMMENT ON INDEX idx_analytics_metrics_tenant_date IS 'Optimizes analytics dashboard queries by tenant and date range';
COMMENT ON INDEX idx_products_search IS 'Enables fast full-text search on product names and descriptions';

-- Update table statistics for query planner
ANALYZE appointments;
ANALYZE patients;
ANALYZE invoices;
ANALYZE payments;
ANALYZE analytics_metrics;
ANALYZE clinical_notes;
ANALYZE treatment_plans;
ANALYZE products;
ANALYZE inventory;
ANALYZE orders;
ANALYZE users;
ANALYZE audit_logs;
ANALYZE metrics;
ANALYZE ai_insights;
ANALYZE feature_flags;
ANALYZE ab_tests;
