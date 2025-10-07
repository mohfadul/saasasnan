-- Phase 3: Billing and Payment System Schema
-- This script adds the billing, payment, and insurance management tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Billing: Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id), -- Assuming clinics table exists
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    customer_type VARCHAR(50) NOT NULL CHECK (customer_type IN ('patient', 'insurance', 'third_party')),
    customer_id UUID, -- References patients(id) or insurance_providers(id)
    customer_info JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    balance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    payment_terms INTEGER NOT NULL DEFAULT 30,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_date DATE,
    notes TEXT,
    terms_and_conditions TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT unique_tenant_invoice_number UNIQUE(tenant_id, invoice_number)
);

-- Billing: Invoice Items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    item_type VARCHAR(50) CHECK (item_type IN ('service', 'product', 'treatment', 'procedure', 'consultation')),
    reference_id UUID, -- References appointments(id), products(id), etc.
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing: Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID REFERENCES invoices(id),
    payment_number VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check', 'insurance', 'online')),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    processing_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT unique_tenant_payment_number UNIQUE(tenant_id, payment_number)
);

-- Billing: Insurance Providers
CREATE TABLE insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    contact_info JSONB NOT NULL,
    coverage_details JSONB DEFAULT '{}',
    copay_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT unique_tenant_provider_name UNIQUE(tenant_id, name)
);

-- Billing: Patient Insurance
CREATE TABLE patient_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    insurance_provider_id UUID NOT NULL REFERENCES insurance_providers(id),
    policy_number VARCHAR(100) NOT NULL,
    group_number VARCHAR(100),
    effective_date DATE,
    expiration_date DATE,
    copay_amount DECIMAL(10, 2),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT unique_patient_policy_number UNIQUE(patient_id, policy_number)
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_tenant_clinic ON invoices(tenant_id, clinic_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_type, customer_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_payments_tenant_invoice ON payments(tenant_id, invoice_id);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_insurance_providers_tenant ON insurance_providers(tenant_id);
CREATE INDEX idx_patient_insurance_patient ON patient_insurance(patient_id);
CREATE INDEX idx_patient_insurance_provider ON patient_insurance(insurance_provider_id);
CREATE INDEX idx_patient_insurance_primary ON patient_insurance(patient_id, is_primary) WHERE is_primary = true;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_providers_updated_at BEFORE UPDATE ON insurance_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_insurance_updated_at BEFORE UPDATE ON patient_insurance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS VARCHAR(100) AS $$
DECLARE
    v_year INTEGER;
    v_count INTEGER;
    v_invoice_number VARCHAR(100);
BEGIN
    v_year := EXTRACT(YEAR FROM NOW());
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM invoices
    WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM created_at) = v_year;
    
    v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate payment numbers
CREATE OR REPLACE FUNCTION generate_payment_number(p_tenant_id UUID)
RETURNS VARCHAR(100) AS $$
DECLARE
    v_year INTEGER;
    v_count INTEGER;
    v_payment_number VARCHAR(100);
BEGIN
    v_year := EXTRACT(YEAR FROM NOW());
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM payments
    WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM created_at) = v_year;
    
    v_payment_number := 'PAY-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
    
    RETURN v_payment_number;
END;
$$ LANGUAGE plpgsql;

-- Create view for invoice summary
CREATE VIEW invoice_summary AS
SELECT 
    i.id,
    i.tenant_id,
    i.clinic_id,
    i.invoice_number,
    i.invoice_date,
    i.due_date,
    i.customer_type,
    i.customer_info,
    i.total_amount,
    i.paid_amount,
    i.balance_amount,
    i.status,
    i.created_at,
    COUNT(ii.id) as item_count,
    COALESCE(SUM(p.amount), 0) as total_payments,
    COUNT(p.id) as payment_count
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
LEFT JOIN payments p ON i.id = p.invoice_id AND p.status = 'completed'
WHERE i.deleted_at IS NULL
GROUP BY i.id, i.tenant_id, i.clinic_id, i.invoice_number, i.invoice_date, 
         i.due_date, i.customer_type, i.customer_info, i.total_amount, 
         i.paid_amount, i.balance_amount, i.status, i.created_at;

-- Create view for payment summary
CREATE VIEW payment_summary AS
SELECT 
    p.id,
    p.tenant_id,
    p.invoice_id,
    p.payment_number,
    p.payment_date,
    p.payment_method,
    p.amount,
    p.status,
    p.created_at,
    i.invoice_number,
    i.customer_info
FROM payments p
LEFT JOIN invoices i ON p.invoice_id = i.id
WHERE p.deleted_at IS NULL;

-- Insert sample data (optional)
-- Note: This assumes you have existing tenant and user data

-- Sample insurance providers
-- INSERT INTO insurance_providers (tenant_id, name, contact_info, coverage_details, copay_percentage) VALUES
-- ('your-tenant-id', 'Blue Cross Blue Shield', '{"phone": "1-800-123-4567", "email": "info@bcbs.com"}', '{"coverage_type": "PPO", "network": "national"}', 20.00),
-- ('your-tenant-id', 'Aetna', '{"phone": "1-800-987-6543", "email": "info@aetna.com"}', '{"coverage_type": "HMO", "network": "regional"}', 15.00);

COMMENT ON TABLE invoices IS 'Main invoice table for billing system';
COMMENT ON TABLE invoice_items IS 'Line items for each invoice';
COMMENT ON TABLE payments IS 'Payment records linked to invoices';
COMMENT ON TABLE insurance_providers IS 'Insurance company information';
COMMENT ON TABLE patient_insurance IS 'Patient insurance coverage details';

COMMENT ON COLUMN invoices.customer_type IS 'Type of customer: patient, insurance, or third_party';
COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, paid, overdue, or cancelled';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment: cash, card, bank_transfer, check, insurance, or online';
COMMENT ON COLUMN payments.status IS 'Payment status: pending, completed, failed, refunded, or cancelled';
COMMENT ON COLUMN patient_insurance.is_primary IS 'Whether this is the patient''s primary insurance';
