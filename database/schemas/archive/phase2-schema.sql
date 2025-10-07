-- Healthcare SaaS Platform - Phase 2 Schema Extensions
-- Marketplace, Inventory, Billing, and Advanced Features

-- Suppliers table for marketplace
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    contact_info JSONB NOT NULL, -- email, phone, address
    business_info JSONB DEFAULT '{}', -- tax_id, business_license, etc.
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_orders INTEGER DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    INDEX idx_suppliers_tenant_status (tenant_id, status),
    INDEX idx_suppliers_rating (tenant_id, rating DESC)
);

-- Product categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_categories_tenant (tenant_id),
    INDEX idx_categories_parent (tenant_id, parent_id)
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    category_id UUID REFERENCES product_categories(id),
    
    -- Product details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    brand VARCHAR(255),
    model VARCHAR(255),
    
    -- Pricing
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    minimum_price DECIMAL(10,2),
    
    -- Product attributes
    attributes JSONB DEFAULT '{}', -- size, color, material, etc.
    specifications JSONB DEFAULT '{}',
    images JSONB DEFAULT '[]',
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    
    -- SEO and search
    meta_title VARCHAR(255),
    meta_description TEXT,
    search_keywords TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT unique_tenant_sku UNIQUE(tenant_id, sku),
    INDEX idx_products_tenant_supplier (tenant_id, supplier_id),
    INDEX idx_products_category (tenant_id, category_id),
    INDEX idx_products_status (tenant_id, status),
    INDEX idx_products_search (tenant_id, name, description, tags)
);

-- Inventory table for stock management
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Stock levels
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    maximum_stock INTEGER DEFAULT 1000,
    reserved_stock INTEGER DEFAULT 0, -- Stock reserved for pending orders
    
    -- Location and tracking
    location VARCHAR(255), -- Shelf, room, etc.
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- Cost tracking
    average_cost DECIMAL(10,2),
    last_cost DECIMAL(10,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'low_stock', 'out_of_stock', 'expired')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_clinic_product UNIQUE(tenant_id, clinic_id, product_id),
    INDEX idx_inventory_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_inventory_product (tenant_id, product_id),
    INDEX idx_inventory_status (tenant_id, status),
    INDEX idx_inventory_expiry (tenant_id, expiry_date)
);

-- Inventory transactions for tracking stock movements
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    product_id UUID NOT NULL REFERENCES products(id),
    inventory_id UUID NOT NULL REFERENCES inventory(id),
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'transfer', 'return', 'waste')),
    quantity INTEGER NOT NULL, -- Positive for stock in, negative for stock out
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- Reference information
    reference_type VARCHAR(50), -- 'order', 'appointment', 'manual', etc.
    reference_id UUID,
    notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_inventory_transactions_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_inventory_transactions_product (tenant_id, product_id),
    INDEX idx_inventory_transactions_type (tenant_id, transaction_type),
    INDEX idx_inventory_transactions_date (tenant_id, created_at)
);

-- Orders table for marketplace purchases
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    
    -- Order details
    order_number VARCHAR(100) NOT NULL,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery_date TIMESTAMPTZ,
    actual_delivery_date TIMESTAMPTZ,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')),
    
    -- Financial
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Additional info
    notes TEXT,
    shipping_address JSONB,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_order_number UNIQUE(tenant_id, order_number),
    INDEX idx_orders_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_orders_supplier (tenant_id, supplier_id),
    INDEX idx_orders_status (tenant_id, status),
    INDEX idx_orders_date (tenant_id, order_date)
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Product snapshot at time of order
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
);

-- Billing and invoicing
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    
    -- Invoice details
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Customer information (can be patient or insurance)
    customer_type VARCHAR(50) NOT NULL CHECK (customer_type IN ('patient', 'insurance', 'third_party')),
    customer_id UUID, -- References patients(id) or insurance_providers(id)
    customer_info JSONB NOT NULL, -- Name, address, contact info
    
    -- Financial
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status and payment
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    payment_terms INTEGER DEFAULT 30, -- Days
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_date DATE,
    
    -- Additional
    notes TEXT,
    terms_and_conditions TEXT,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_invoice_number UNIQUE(tenant_id, invoice_number),
    INDEX idx_invoices_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_invoices_customer (tenant_id, customer_type, customer_id),
    INDEX idx_invoices_status (tenant_id, status),
    INDEX idx_invoices_date (tenant_id, invoice_date)
);

-- Invoice line items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    
    -- Item details
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Reference to source (appointment, product, etc.)
    item_type VARCHAR(50), -- 'service', 'product', 'treatment', etc.
    reference_id UUID,
    
    -- Tax information
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_invoice_items_invoice (invoice_id),
    INDEX idx_invoice_items_reference (item_type, reference_id)
);

-- Payment transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID REFERENCES invoices(id),
    
    -- Payment details
    payment_number VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check', 'insurance', 'online')),
    amount DECIMAL(10,2) NOT NULL,
    
    -- Payment processing
    transaction_id VARCHAR(255), -- External payment processor ID
    gateway_response JSONB, -- Full response from payment gateway
    processing_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    
    -- Additional
    notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_payment_number UNIQUE(tenant_id, payment_number),
    INDEX idx_payments_tenant_invoice (tenant_id, invoice_id),
    INDEX idx_payments_method (tenant_id, payment_method),
    INDEX idx_payments_status (tenant_id, status),
    INDEX idx_payments_date (tenant_id, payment_date)
);

-- Insurance providers
CREATE TABLE insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    contact_info JSONB NOT NULL,
    coverage_details JSONB DEFAULT '{}',
    copay_percentage DECIMAL(5,2) DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_insurance_tenant (tenant_id, status)
);

-- Patient insurance information
CREATE TABLE patient_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    insurance_provider_id UUID NOT NULL REFERENCES insurance_providers(id),
    
    policy_number VARCHAR(100) NOT NULL,
    group_number VARCHAR(100),
    effective_date DATE,
    expiration_date DATE,
    copay_amount DECIMAL(10,2),
    
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_patient_insurance_patient (patient_id),
    INDEX idx_patient_insurance_provider (insurance_provider_id)
);

-- Enhanced appointments with advanced features
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS 
    recurrence_pattern JSONB DEFAULT NULL;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS 
    master_appointment_id UUID REFERENCES appointments(id);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS 
    waitlist_position INTEGER DEFAULT NULL;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS 
    reminder_sent BOOLEAN DEFAULT false;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS 
    confirmation_sent BOOLEAN DEFAULT false;

-- Appointment waitlist
CREATE TABLE appointment_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    appointment_type VARCHAR(100),
    reason TEXT,
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    
    status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'accepted', 'declined', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_waitlist_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_waitlist_provider (tenant_id, provider_id),
    INDEX idx_waitlist_status (tenant_id, status),
    INDEX idx_waitlist_priority (tenant_id, priority DESC)
);

-- Clinical notes and treatment plans (referenced in original schema but expanded)
ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS 
    note_category VARCHAR(50) DEFAULT 'general' CHECK (note_category IN ('general', 'examination', 'treatment', 'follow_up', 'consultation'));

ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS 
    is_confidential BOOLEAN DEFAULT false;

ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS 
    attachments JSONB DEFAULT '[]';

-- Treatment plan items
CREATE TABLE treatment_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id),
    
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    completion_date DATE,
    
    -- Reference to appointment or procedure
    appointment_id UUID REFERENCES appointments(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_treatment_items_plan (treatment_plan_id),
    INDEX idx_treatment_items_appointment (appointment_id)
);

-- Insert sample data for testing
INSERT INTO product_categories (tenant_id, name, description) VALUES 
((SELECT id FROM tenants WHERE subdomain = 'platform'), 'Dental Instruments', 'Surgical and diagnostic instruments'),
((SELECT id FROM tenants WHERE subdomain = 'platform'), 'Consumables', 'Disposable dental supplies'),
((SELECT id FROM tenants WHERE subdomain = 'platform'), 'Materials', 'Dental materials and composites');

INSERT INTO suppliers (tenant_id, name, contact_info, business_info) VALUES 
((SELECT id FROM tenants WHERE subdomain = 'platform'), 'Dental Supply Co', 
 '{"email": "sales@dentalsupply.com", "phone": "+1-555-0123", "address": {"street": "123 Dental St", "city": "Dental City", "state": "DC", "zip": "12345"}}',
 '{"tax_id": "12-3456789", "business_license": "BL123456"}');

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_products_search_full ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' ')));

-- Add triggers for automatic updates
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update inventory status based on stock levels
    IF NEW.current_stock <= NEW.minimum_stock THEN
        NEW.status = 'low_stock';
    ELSIF NEW.current_stock <= 0 THEN
        NEW.status = 'out_of_stock';
    ELSE
        NEW.status = 'active';
    END IF;
    
    -- Check for expired items
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
        NEW.status = 'expired';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_status
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_status();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    order_prefix TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM orders 
    WHERE tenant_id = tenant_uuid 
    AND order_number ~ '^ORD-\d{4}-\d+$';
    
    order_prefix := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-';
    
    RETURN order_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    invoice_prefix TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices 
    WHERE tenant_id = tenant_uuid 
    AND invoice_number ~ '^INV-\d{4}-\d+$';
    
    invoice_prefix := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-';
    
    RETURN invoice_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
