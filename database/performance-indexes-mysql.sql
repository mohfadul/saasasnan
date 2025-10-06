-- Performance Indexes for MySQL - Healthcare SaaS Platform
-- Run this after initial schema creation for optimal query performance

-- Patients Table Indexes
CREATE INDEX idx_patients_tenant_clinic_created ON patients(tenant_id, clinic_id, created_at DESC);
CREATE INDEX idx_patients_external_lookup ON patients(tenant_id, patient_external_id);
CREATE INDEX idx_patients_last_visit ON patients(last_visit_at DESC) WHERE last_visit_at IS NOT NULL;

-- Appointments Table Indexes
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, start_time DESC);
CREATE INDEX idx_appointments_provider_date ON appointments(provider_id, start_time DESC);
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, start_time DESC);
CREATE INDEX idx_appointments_status_date ON appointments(status, start_time DESC);
CREATE INDEX idx_appointments_clinic_date ON appointments(clinic_id, start_time DESC);

-- Invoices Table Indexes
CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status, invoice_date DESC);
CREATE INDEX idx_invoices_patient_status ON invoices(patient_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status IN ('sent', 'overdue');
CREATE INDEX idx_invoices_total_amount ON invoices(total_amount DESC);

-- Payments Table Indexes
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, payment_date DESC);
CREATE INDEX idx_payments_invoice ON payments(invoice_id, payment_date DESC);
CREATE INDEX idx_payments_patient ON payments(patient_id, payment_date DESC);

-- Products Table Indexes
CREATE INDEX idx_products_tenant_status ON products(tenant_id, status);
CREATE INDEX idx_products_supplier_status ON products(supplier_id, status);
CREATE INDEX idx_products_category ON products(category_id, status);
CREATE INDEX idx_products_sku_lookup ON products(sku, tenant_id);
CREATE INDEX idx_products_featured ON products(is_featured, status) WHERE is_featured = TRUE;
CREATE INDEX idx_products_name_search ON products(name);

-- Inventory Table Indexes
CREATE INDEX idx_inventory_tenant_product ON inventory(tenant_id, product_id);
CREATE INDEX idx_inventory_clinic_product ON inventory(clinic_id, product_id);
CREATE INDEX idx_inventory_low_stock ON inventory(tenant_id, current_stock) WHERE current_stock <= minimum_stock;
CREATE INDEX idx_inventory_status ON inventory(status, tenant_id);

-- Inventory Transactions Table Indexes
CREATE INDEX idx_inv_trans_tenant_date ON inventory_transactions(tenant_id, created_at DESC);
CREATE INDEX idx_inv_trans_product_date ON inventory_transactions(product_id, created_at DESC);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type, created_at DESC);

-- Clinical Notes Table Indexes
CREATE INDEX idx_clinical_notes_patient_date ON clinical_notes(patient_id, created_at DESC);
CREATE INDEX idx_clinical_notes_provider_date ON clinical_notes(provider_id, created_at DESC);
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX idx_clinical_notes_type ON clinical_notes(note_type, tenant_id);

-- Treatment Plans Table Indexes
CREATE INDEX idx_treatment_plans_patient_status ON treatment_plans(patient_id, status);
CREATE INDEX idx_treatment_plans_provider_status ON treatment_plans(provider_id, status);
CREATE INDEX idx_treatment_plans_dates ON treatment_plans(start_date, end_date);

-- Orders Table Indexes
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status, order_date DESC);
CREATE INDEX idx_orders_supplier_status ON orders(supplier_id, status);
CREATE INDEX idx_orders_number_lookup ON orders(order_number, tenant_id);
CREATE INDEX idx_orders_delivery_date ON orders(expected_delivery_date) WHERE status IN ('confirmed', 'shipped');

-- AI Models Table Indexes
CREATE INDEX idx_ai_models_tenant_status ON ai_models(tenant_id, status);
CREATE INDEX idx_ai_models_category_status ON ai_models(model_category, status);
CREATE INDEX idx_ai_models_type ON ai_models(model_type, status);

-- AI Predictions Table Indexes
CREATE INDEX idx_ai_predictions_tenant_date ON ai_predictions(tenant_id, created_at DESC);
CREATE INDEX idx_ai_predictions_model ON ai_predictions(model_id, created_at DESC);
CREATE INDEX idx_ai_predictions_type ON ai_predictions(prediction_type, status);

-- AI Insights Table Indexes
CREATE INDEX idx_ai_insights_tenant_status ON ai_insights(tenant_id, status, priority);
CREATE INDEX idx_ai_insights_category ON ai_insights(category, status);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority, status) WHERE status = 'new';

-- Analytics Metrics Table Indexes
CREATE INDEX idx_analytics_metrics_tenant_date ON performance_metrics(tenant_id, recorded_at DESC);
CREATE INDEX idx_analytics_metrics_name ON performance_metrics(metric_name, tenant_id);
CREATE INDEX idx_analytics_metrics_category ON performance_metrics(metric_category, recorded_at DESC);

-- Analytics Events Table Indexes
CREATE INDEX idx_analytics_events_tenant_date ON analytics_events(tenant_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, created_at DESC);

-- Feature Flags Table Indexes
CREATE INDEX idx_feature_flags_enabled ON feature_flags(tenant_id, is_enabled);

-- Alerts Table Indexes
CREATE INDEX idx_alerts_tenant_status ON alerts(tenant_id, status, severity);
CREATE INDEX idx_alerts_triggered ON alerts(triggered_at DESC) WHERE status = 'active';
CREATE INDEX idx_alerts_type_severity ON alerts(alert_type, severity);

-- Composite Indexes for Common Queries
CREATE INDEX idx_appointments_provider_status_date ON appointments(provider_id, status, start_time DESC);
CREATE INDEX idx_invoices_patient_status_date ON invoices(patient_id, status, invoice_date DESC);
CREATE INDEX idx_products_supplier_featured ON products(supplier_id, is_featured, status);

-- Full-Text Search Indexes (MySQL specific)
-- ALTER TABLE patients ADD FULLTEXT INDEX ft_patient_search (patient_external_id);
-- ALTER TABLE products ADD FULLTEXT INDEX ft_product_search (name, description);
-- ALTER TABLE clinical_notes ADD FULLTEXT INDEX ft_clinical_search (chief_complaint, diagnosis);

-- Analyze tables for optimal query planning
ANALYZE TABLE patients, appointments, invoices, payments, products, inventory, clinical_notes;

-- Show index usage statistics
-- SELECT 
--   table_name,
--   index_name,
--   seq_in_index,
--   column_name,
--   cardinality
-- FROM information_schema.statistics
-- WHERE table_schema = 'healthcare_platform'
-- ORDER BY table_name, index_name, seq_in_index;
