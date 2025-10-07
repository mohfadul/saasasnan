-- PHARMACY MODULE SCHEMA
-- Healthcare SaaS Platform - Pharmacy Management
-- Compatible with MySQL 8.0+

USE healthcare_saas;

-- =====================================================
-- PHARMACY DRUG CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_drug_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pharmacy_categories_tenant (tenant_id),
    INDEX idx_pharmacy_categories_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHARMACY SUPPLIERS
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_suppliers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    supplier_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact VARCHAR(100) NOT NULL,
    address TEXT NULL,
    drugs_available TEXT NULL,
    tax_id VARCHAR(100) NULL,
    license_number VARCHAR(100) NULL,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_orders INT DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.0,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    notify_on_expiry BOOLEAN DEFAULT TRUE,
    notify_on_low_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pharmacy_suppliers_tenant (tenant_id),
    INDEX idx_pharmacy_suppliers_status (status),
    INDEX idx_pharmacy_suppliers_code (supplier_code),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHARMACY DRUGS
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_drugs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) NULL,
    category_id VARCHAR(36) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    drug_code VARCHAR(100) UNIQUE NOT NULL,
    generic_name VARCHAR(255) NULL,
    brand_name VARCHAR(100) NULL,
    manufacturer VARCHAR(100) NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NULL,
    unit_of_measure VARCHAR(50) DEFAULT 'unit',
    dosage_form VARCHAR(100) NULL COMMENT 'tablet, capsule, syrup, injection',
    strength VARCHAR(100) NULL COMMENT '500mg, 250ml, etc',
    requires_prescription BOOLEAN DEFAULT FALSE,
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    storage_requirements TEXT NULL,
    side_effects TEXT NULL,
    contraindications TEXT NULL,
    image_url VARCHAR(500) NULL,
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pharmacy_drugs_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_pharmacy_drugs_supplier (supplier_id),
    INDEX idx_pharmacy_drugs_category (category_id),
    INDEX idx_pharmacy_drugs_code (drug_code),
    INDEX idx_pharmacy_drugs_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES pharmacy_suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES pharmacy_drug_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHARMACY DRUG INVENTORY (Stock Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_drug_inventory (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    drug_id VARCHAR(36) NOT NULL,
    quantity INT DEFAULT 0,
    minimum_stock INT DEFAULT 0,
    maximum_stock INT DEFAULT 1000,
    reorder_level INT DEFAULT 10,
    batch_id VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    manufacture_date DATE NULL,
    shelf_location VARCHAR(255) NULL,
    bin_number VARCHAR(100) NULL,
    batch_cost_price DECIMAL(10,2) NOT NULL,
    batch_selling_price DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'low_stock', 'out_of_stock', 'expired', 'recalled') DEFAULT 'available',
    expiry_alert_sent BOOLEAN DEFAULT FALSE,
    low_stock_alert_sent BOOLEAN DEFAULT FALSE,
    added_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pharmacy_inventory_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_pharmacy_inventory_drug (drug_id),
    INDEX idx_pharmacy_inventory_batch (batch_id),
    INDEX idx_pharmacy_inventory_expiry (expiry_date),
    INDEX idx_pharmacy_inventory_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES pharmacy_drugs(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_batch_drug (drug_id, batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHARMACY SALES (POS Transactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_sales (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    sale_number VARCHAR(100) UNIQUE NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    patient_id VARCHAR(36) NULL,
    customer_name VARCHAR(255) NULL,
    customer_phone VARCHAR(100) NULL,
    prescription_id VARCHAR(36) NULL,
    doctor_name VARCHAR(255) NULL,
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    payment_method ENUM('cash', 'card', 'insurance', 'mobile_wallet', 'bank_transfer') DEFAULT 'cash',
    payment_reference VARCHAR(255) NULL,
    status ENUM('draft', 'completed', 'refunded', 'cancelled') DEFAULT 'completed',
    notes TEXT NULL,
    cashier_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pharmacy_sales_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_pharmacy_sales_number (sale_number),
    INDEX idx_pharmacy_sales_date (sale_date),
    INDEX idx_pharmacy_sales_patient (patient_id),
    INDEX idx_pharmacy_sales_status (status),
    INDEX idx_pharmacy_sales_cashier (cashier_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHARMACY SALE ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_sale_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sale_id VARCHAR(36) NOT NULL,
    drug_id VARCHAR(36) NOT NULL,
    inventory_id VARCHAR(36) NULL,
    drug_name VARCHAR(255) NOT NULL,
    batch_id VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pharmacy_sale_items_sale (sale_id),
    INDEX idx_pharmacy_sale_items_drug (drug_id),
    FOREIGN KEY (sale_id) REFERENCES pharmacy_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES pharmacy_drugs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DOCTOR PRESCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_doctor_prescriptions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    prescription_number VARCHAR(100) UNIQUE NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    doctor_contact VARCHAR(100) NOT NULL,
    doctor_id VARCHAR(100) NOT NULL COMMENT 'License number or ID',
    doctor_email VARCHAR(255) NOT NULL,
    patient_id VARCHAR(36) NULL,
    patient_name VARCHAR(255) NULL,
    prescription_date DATE NOT NULL,
    pickup_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'verified', 'picked_up', 'cancelled', 'expired') DEFAULT 'pending',
    verified_at TIMESTAMP NULL,
    verified_by VARCHAR(36) NULL,
    picked_up_at TIMESTAMP NULL,
    notes TEXT NULL,
    special_instructions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pharmacy_prescriptions_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_pharmacy_prescriptions_number (prescription_number),
    INDEX idx_pharmacy_prescriptions_doctor (doctor_id),
    INDEX idx_pharmacy_prescriptions_patient (patient_id),
    INDEX idx_pharmacy_prescriptions_status (status),
    INDEX idx_pharmacy_prescriptions_pickup (pickup_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PRESCRIPTION ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_prescription_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    prescription_id VARCHAR(36) NOT NULL,
    drug_id VARCHAR(36) NOT NULL,
    drug_name VARCHAR(255) NOT NULL,
    drug_price DECIMAL(10,2) NOT NULL,
    quantity_prescribed INT NOT NULL,
    quantity_dispensed INT DEFAULT 0,
    dosage_instructions TEXT NULL,
    frequency VARCHAR(100) NULL COMMENT 'e.g., 3 times daily',
    duration_days INT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pharmacy_prescription_items_prescription (prescription_id),
    INDEX idx_pharmacy_prescription_items_drug (drug_id),
    FOREIGN KEY (prescription_id) REFERENCES pharmacy_doctor_prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES pharmacy_drugs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT SAMPLE DRUG CATEGORIES
-- =====================================================
INSERT INTO pharmacy_drug_categories (id, tenant_id, name, description, sort_order) 
SELECT 
    UUID(),
    t.id,
    category_name,
    category_desc,
    sort_num
FROM tenants t
CROSS JOIN (
    SELECT 'Antibiotics' as category_name, 'Antimicrobial medications' as category_desc, 1 as sort_num
    UNION ALL SELECT 'Pain Relief', 'Analgesics and pain management', 2
    UNION ALL SELECT 'Vitamins & Supplements', 'Nutritional supplements and vitamins', 3
    UNION ALL SELECT 'Cardiovascular', 'Heart and blood pressure medications', 4
    UNION ALL SELECT 'Diabetes', 'Blood sugar management medications', 5
    UNION ALL SELECT 'Respiratory', 'Asthma and respiratory treatments', 6
    UNION ALL SELECT 'Gastrointestinal', 'Digestive system medications', 7
    UNION ALL SELECT 'Dermatology', 'Skin care and topical treatments', 8
) categories
WHERE NOT EXISTS (
    SELECT 1 FROM pharmacy_drug_categories WHERE tenant_id = t.id
);

SELECT 'Pharmacy schema created successfully!' AS Status;

