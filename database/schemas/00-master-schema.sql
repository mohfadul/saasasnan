-- Healthcare SaaS Platform - MySQL Schema for Hostinger
-- Compatible with Hostinger's MySQL hosting environment

-- Set MySQL storage engine and character set
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
SET default_storage_engine = InnoDB;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

-- Create database (if not exists)
-- CREATE DATABASE IF NOT EXISTS healthcare_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE healthcare_platform;

-- Tenants table (multi-tenancy foundation)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    config JSON DEFAULT ('{}'),
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenants_subdomain (subdomain),
    INDEX idx_tenants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clinics table (dental practices within tenants)
CREATE TABLE IF NOT EXISTS clinics (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address JSON DEFAULT ('{}'),
    contact_info JSON DEFAULT ('{}'),
    settings JSON DEFAULT ('{}'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clinics_tenant (tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users with RBAC and security
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NULL,
    email VARCHAR(255) NOT NULL,
    encrypted_password VARCHAR(255) NULL,
    role ENUM('super_admin', 'clinic_admin', 'dentist', 'staff', 'supplier', 'patient') DEFAULT 'staff',
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    phone VARCHAR(50) NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(100) NULL,
    last_login_at TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    UNIQUE KEY unique_tenant_email (tenant_id, email),
    INDEX idx_users_tenant_role (tenant_id, role),
    INDEX idx_users_clinic (clinic_id),
    INDEX idx_users_email (email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced Patients table with PHI protection
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    
    -- Encrypted PHI fields
    encrypted_demographics LONGBLOB NOT NULL, -- Encrypted JSON with name, DOB, etc.
    demographics_key_id VARCHAR(100) NULL, -- KMS key ID for decryption
    
    -- Non-PHI fields
    patient_external_id VARCHAR(100) NULL,
    tags JSON DEFAULT ('[]'),
    consent_flags JSON DEFAULT ('{}'),
    medical_alert_flags JSON DEFAULT ('{}'),
    last_visit_at TIMESTAMP NULL,
    
    -- Audit fields
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Indexes for performance
    INDEX idx_patients_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_patients_external_id (tenant_id, patient_external_id),
    INDEX idx_patients_created_by (created_by),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced Appointments with comprehensive tracking
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    
    -- Appointment details
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    appointment_type VARCHAR(100) NULL,
    reason TEXT NULL,
    room_id VARCHAR(36) NULL,
    
    -- Status tracking
    checked_in_at TIMESTAMP NULL,
    seen_by_provider_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT NULL,
    
    -- Recurrence
    recurrence_pattern JSON NULL,
    master_appointment_id VARCHAR(36) NULL,
    
    -- Audit
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_appointments_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_appointments_patient (patient_id),
    INDEX idx_appointments_provider (provider_id),
    INDEX idx_appointments_start_time (start_time),
    INDEX idx_appointments_status (status),
    INDEX idx_appointments_master (master_appointment_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (master_appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment Recurrence
CREATE TABLE IF NOT EXISTS appointment_recurrences (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    appointment_id VARCHAR(36) NOT NULL,
    recurrence_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
    recurrence_interval INT DEFAULT 1,
    recurrence_days JSON NULL, -- For weekly recurrence
    recurrence_end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_recurrences_appointment (appointment_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment Conflicts
CREATE TABLE IF NOT EXISTS appointment_conflicts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    appointment_id VARCHAR(36) NOT NULL,
    conflict_type ENUM('double_booking', 'resource_conflict', 'time_overlap') NOT NULL,
    conflicting_appointment_id VARCHAR(36) NULL,
    conflict_details JSON DEFAULT ('{}'),
    resolution_status ENUM('pending', 'resolved', 'ignored') DEFAULT 'pending',
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_conflicts_tenant (tenant_id),
    INDEX idx_conflicts_appointment (appointment_id),
    INDEX idx_conflicts_status (resolution_status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (conflicting_appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_info JSON DEFAULT ('{}'),
    address JSON DEFAULT ('{}'),
    tax_id VARCHAR(100) NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_suppliers_tenant (tenant_id),
    INDEX idx_suppliers_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    parent_id VARCHAR(36) NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_categories_tenant (tenant_id),
    INDEX idx_categories_parent (parent_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NULL,
    
    -- Product details
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100) NULL,
    brand VARCHAR(255) NULL,
    model VARCHAR(255) NULL,
    
    -- Pricing
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    minimum_price DECIMAL(10,2) NULL,
    
    -- Product attributes
    attributes JSON DEFAULT ('{}'),
    specifications JSON DEFAULT ('{}'),
    images JSON DEFAULT ('[]'),
    
    -- Status and metadata
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    is_featured BOOLEAN DEFAULT FALSE,
    tags JSON DEFAULT ('[]'),
    
    -- SEO and search
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    search_keywords JSON DEFAULT ('[]'),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_products_tenant (tenant_id),
    INDEX idx_products_supplier (supplier_id),
    INDEX idx_products_category (category_id),
    INDEX idx_products_sku (sku),
    INDEX idx_products_status (status),
    INDEX idx_products_featured (is_featured),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_orders_tenant (tenant_id),
    INDEX idx_orders_supplier (supplier_id),
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_status (status),
    INDEX idx_orders_date (order_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NULL,
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT DEFAULT 0,
    maximum_stock INT NULL,
    reorder_point INT DEFAULT 0,
    last_restocked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_inventory_tenant (tenant_id),
    INDEX idx_inventory_product (product_id),
    INDEX idx_inventory_clinic (clinic_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    inventory_id VARCHAR(36) NOT NULL,
    transaction_type ENUM('in', 'out', 'adjustment', 'transfer') NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255) NULL,
    reference_id VARCHAR(36) NULL, -- Order ID, Appointment ID, etc.
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_transactions_tenant (tenant_id),
    INDEX idx_transactions_inventory (inventory_id),
    INDEX idx_transactions_type (transaction_type),
    INDEX idx_transactions_date (created_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_invoices_tenant (tenant_id),
    INDEX idx_invoices_patient (patient_id),
    INDEX idx_invoices_number (invoice_number),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_date (invoice_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    invoice_id VARCHAR(36) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_invoice_items_invoice (invoice_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    invoice_id VARCHAR(36) NULL,
    patient_id VARCHAR(36) NOT NULL,
    payment_method ENUM('cash', 'card', 'check', 'bank_transfer', 'insurance') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    reference_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payments_tenant (tenant_id),
    INDEX idx_payments_invoice (invoice_id),
    INDEX idx_payments_patient (patient_id),
    INDEX idx_payments_date (payment_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insurance Providers
CREATE TABLE IF NOT EXISTS insurance_providers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_info JSON DEFAULT ('{}'),
    coverage_details JSON DEFAULT ('{}'),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_insurance_tenant (tenant_id),
    INDEX idx_insurance_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patient Insurance
CREATE TABLE IF NOT EXISTS patient_insurance (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id VARCHAR(36) NOT NULL,
    insurance_provider_id VARCHAR(36) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    group_number VARCHAR(100) NULL,
    effective_date DATE NOT NULL,
    expiration_date DATE NULL,
    coverage_percentage DECIMAL(5,2) DEFAULT 0,
    deductible DECIMAL(10,2) DEFAULT 0,
    max_coverage DECIMAL(10,2) NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_insurance_patient (patient_id),
    INDEX idx_patient_insurance_provider (insurance_provider_id),
    INDEX idx_patient_insurance_primary (is_primary),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (insurance_provider_id) REFERENCES insurance_providers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clinical Notes
CREATE TABLE IF NOT EXISTS clinical_notes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    appointment_id VARCHAR(36) NULL,
    provider_id VARCHAR(36) NOT NULL,
    note_type ENUM('consultation', 'treatment', 'follow_up', 'emergency') NOT NULL,
    chief_complaint TEXT NULL,
    history_of_present_illness TEXT NULL,
    clinical_findings TEXT NULL,
    diagnosis TEXT NULL,
    treatment_plan TEXT NULL,
    follow_up_instructions TEXT NULL,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clinical_notes_tenant (tenant_id),
    INDEX idx_clinical_notes_patient (patient_id),
    INDEX idx_clinical_notes_appointment (appointment_id),
    INDEX idx_clinical_notes_provider (provider_id),
    INDEX idx_clinical_notes_type (note_type),
    INDEX idx_clinical_notes_date (created_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    start_date DATE NULL,
    end_date DATE NULL,
    estimated_cost DECIMAL(10,2) NULL,
    actual_cost DECIMAL(10,2) NULL,
    phases JSON DEFAULT ('[]'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_treatment_plans_tenant (tenant_id),
    INDEX idx_treatment_plans_patient (patient_id),
    INDEX idx_treatment_plans_provider (provider_id),
    INDEX idx_treatment_plans_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Models
CREATE TABLE IF NOT EXISTS ai_models (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    model_type ENUM('prediction', 'classification', 'regression', 'clustering') NOT NULL,
    model_category ENUM('appointments', 'billing', 'clinical', 'inventory', 'marketing') NOT NULL,
    version VARCHAR(50) NOT NULL,
    status ENUM('training', 'active', 'inactive', 'deprecated') DEFAULT 'training',
    accuracy_score DECIMAL(5,4) NULL,
    training_data_size INT DEFAULT 0,
    model_parameters JSON DEFAULT ('{}'),
    performance_metrics JSON DEFAULT ('{}'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ai_models_tenant (tenant_id),
    INDEX idx_ai_models_type (model_type),
    INDEX idx_ai_models_category (model_category),
    INDEX idx_ai_models_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    model_id VARCHAR(36) NOT NULL,
    prediction_type ENUM('no_show', 'revenue', 'outcome', 'treatment') NOT NULL,
    input_data JSON NOT NULL,
    prediction_result JSON NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    actual_outcome JSON NULL,
    accuracy_score DECIMAL(5,4) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ai_predictions_tenant (tenant_id),
    INDEX idx_ai_predictions_model (model_id),
    INDEX idx_ai_predictions_type (prediction_type),
    INDEX idx_ai_predictions_date (created_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Insights
CREATE TABLE IF NOT EXISTS ai_insights (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    insight_category ENUM('appointments', 'billing', 'clinical', 'inventory', 'marketing', 'operations', 'patient_satisfaction', 'revenue') NOT NULL,
    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    insight_data JSON NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('new', 'reviewed', 'actioned', 'dismissed') DEFAULT 'new',
    actionable BOOLEAN DEFAULT FALSE,
    action_taken TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ai_insights_tenant (tenant_id),
    INDEX idx_ai_insights_category (insight_category),
    INDEX idx_ai_insights_priority (priority),
    INDEX idx_ai_insights_status (status),
    INDEX idx_ai_insights_actionable (actionable),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    flag_name VARCHAR(100) NOT NULL,
    flag_description TEXT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage DECIMAL(5,2) DEFAULT 0,
    target_users JSON DEFAULT ('[]'),
    conditions JSON DEFAULT ('{}'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_tenant_flag (tenant_id, flag_name),
    INDEX idx_feature_flags_tenant (tenant_id),
    INDEX idx_feature_flags_enabled (is_enabled),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A/B Tests
CREATE TABLE IF NOT EXISTS ab_tests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('draft', 'running', 'paused', 'completed') DEFAULT 'draft',
    start_date DATE NULL,
    end_date DATE NULL,
    variants JSON NOT NULL,
    success_metric VARCHAR(100) NOT NULL,
    target_audience JSON DEFAULT ('{}'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ab_tests_tenant (tenant_id),
    INDEX idx_ab_tests_status (status),
    INDEX idx_ab_tests_dates (start_date, end_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A/B Test Participants
CREATE TABLE IF NOT EXISTS ab_test_participants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    test_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    variant VARCHAR(50) NOT NULL,
    conversion_events JSON DEFAULT ('[]'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_test_user (test_id, user_id),
    INDEX idx_ab_participants_test (test_id),
    INDEX idx_ab_participants_user (user_id),
    INDEX idx_ab_participants_variant (variant),
    FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(100) NOT NULL,
    event_data JSON DEFAULT ('{}'),
    user_id VARCHAR(36) NULL,
    session_id VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_analytics_events_tenant (tenant_id),
    INDEX idx_analytics_events_type (event_type),
    INDEX idx_analytics_events_category (event_category),
    INDEX idx_analytics_events_user (user_id),
    INDEX idx_analytics_events_date (created_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50) NULL,
    metric_category VARCHAR(100) NOT NULL,
    tags JSON DEFAULT ('[]'),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_performance_metrics_tenant (tenant_id),
    INDEX idx_performance_metrics_name (metric_name),
    INDEX idx_performance_metrics_category (metric_category),
    INDEX idx_performance_metrics_date (recorded_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('active', 'acknowledged', 'resolved', 'suppressed') DEFAULT 'active',
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    acknowledged_by VARCHAR(36) NULL,
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(36) NULL,
    metadata JSON DEFAULT ('{}'),
    
    INDEX idx_alerts_tenant (tenant_id),
    INDEX idx_alerts_type (alert_type),
    INDEX idx_alerts_severity (severity),
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_triggered (triggered_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert Incidents
CREATE TABLE IF NOT EXISTS alert_incidents (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    alert_id VARCHAR(36) NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    incident_data JSON DEFAULT ('{}'),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_alert_incidents_alert (alert_id),
    INDEX idx_alert_incidents_type (incident_type),
    INDEX idx_alert_incidents_date (occurred_at),
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default tenant for testing
INSERT IGNORE INTO tenants (id, name, subdomain, config, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Default Healthcare Practice', 'default', '{"theme": "light", "timezone": "UTC"}', 'active');

-- Insert default clinic
INSERT IGNORE INTO clinics (id, tenant_id, name, address, contact_info, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Clinic', 
'{"street": "123 Healthcare St", "city": "Medical City", "state": "MC", "zip": "12345", "country": "USA"}',
'{"phone": "+1-555-0123", "email": "info@mainclinic.com", "website": "https://mainclinic.com"}',
'{"appointment_duration": 30, "working_hours": {"start": "09:00", "end": "17:00"}}');

-- Insert default admin user
INSERT IGNORE INTO users (id, tenant_id, clinic_id, email, encrypted_password, role, first_name, last_name) VALUES 
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 
'admin@healthcare-platform.com', '$2b$10$rQZ8vQZ8vQZ8vQZ8vQZ8vO', 'super_admin', 'Admin', 'User');

-- Create views for common queries
CREATE OR REPLACE VIEW v_patient_summary AS
SELECT 
    p.id,
    p.tenant_id,
    p.clinic_id,
    p.patient_external_id,
    p.tags,
    p.last_visit_at,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
    MAX(a.start_time) as last_appointment_date
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.tenant_id, p.clinic_id, p.patient_external_id, p.tags, p.last_visit_at;

CREATE OR REPLACE VIEW v_appointment_summary AS
SELECT 
    a.id,
    a.tenant_id,
    a.clinic_id,
    a.patient_id,
    a.provider_id,
    a.start_time,
    a.end_time,
    a.status,
    a.appointment_type,
    p.patient_external_id,
    u.first_name as provider_first_name,
    u.last_name as provider_last_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN users u ON a.provider_id = u.id
WHERE a.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_revenue_summary AS
SELECT 
    i.tenant_id,
    i.clinic_id,
    DATE(i.invoice_date) as invoice_date,
    COUNT(i.id) as total_invoices,
    SUM(i.total_amount) as total_revenue,
    SUM(i.paid_amount) as paid_revenue,
    SUM(i.total_amount - i.paid_amount) as outstanding_revenue
FROM invoices i
WHERE i.deleted_at IS NULL
GROUP BY i.tenant_id, i.clinic_id, DATE(i.invoice_date);

-- Create indexes for performance
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_appointments_start_time_status ON appointments(start_time, status);
CREATE INDEX idx_invoices_date_status ON invoices(invoice_date, status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Grant permissions (adjust as needed for Hostinger)
-- GRANT ALL PRIVILEGES ON healthcare_platform.* TO 'healthcare_user'@'%';
-- FLUSH PRIVILEGES;
