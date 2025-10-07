-- HOSPITAL MANAGEMENT MODULE SCHEMA
-- Healthcare SaaS Platform - Converted from Laravel HMS
-- Compatible with MySQL 8.0+

USE healthcare_saas;

-- =====================================================
-- HOSPITAL DEPARTMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS hospital_departments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    head_doctor_id VARCHAR(36) NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hospital_departments_tenant (tenant_id),
    INDEX idx_hospital_departments_head_doctor (head_doctor_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (head_doctor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DOCTOR SCHEDULES
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    doctor_id VARCHAR(36) NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    department_id VARCHAR(36) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_doctor_schedules_tenant (tenant_id),
    INDEX idx_doctor_schedules_doctor (doctor_id),
    INDEX idx_doctor_schedules_day (day_of_week),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES hospital_departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DOCTOR DAYOFFS
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_dayoffs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    doctor_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    reason TEXT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_doctor_dayoffs_tenant (tenant_id),
    INDEX idx_doctor_dayoffs_doctor (doctor_id),
    INDEX idx_doctor_dayoffs_date (date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- HOSPITAL BEDS
-- =====================================================
CREATE TABLE IF NOT EXISTS hospital_beds (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    bed_number VARCHAR(50) NOT NULL,
    bed_type VARCHAR(100) NOT NULL COMMENT 'ICU, General, Private, Semi-Private',
    status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
    price_per_day DECIMAL(10,2) NULL,
    floor VARCHAR(50) NULL,
    room_number VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hospital_beds_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_hospital_beds_department (department_id),
    INDEX idx_hospital_beds_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES hospital_departments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bed_number (clinic_id, bed_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- BED ALLOTMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS bed_allotments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    bed_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    allotment_date TIMESTAMP NOT NULL,
    discharge_date TIMESTAMP NULL,
    status ENUM('active', 'discharged', 'transferred') DEFAULT 'active',
    notes TEXT NULL,
    assigned_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_bed_allotments_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_bed_allotments_bed (bed_id),
    INDEX idx_bed_allotments_patient (patient_id),
    INDEX idx_bed_allotments_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (bed_id) REFERENCES hospital_beds(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- BLOOD DONORS
-- =====================================================
CREATE TABLE IF NOT EXISTS blood_donors (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(100) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    address TEXT NULL,
    last_donation_date DATE NULL,
    total_donations INT DEFAULT 0,
    status ENUM('active', 'inactive', 'blacklisted') DEFAULT 'active',
    medical_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_blood_donors_tenant (tenant_id),
    INDEX idx_blood_donors_blood_group (blood_group),
    INDEX idx_blood_donors_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- BLOOD BANK INVENTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS blood_bank_inventory (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    quantity INT DEFAULT 0 COMMENT 'Units/Bags',
    donor_id VARCHAR(36) NULL,
    collection_date DATE NULL,
    expiry_date DATE NULL,
    status ENUM('available', 'reserved', 'used', 'expired') DEFAULT 'available',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_blood_bank_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_blood_bank_blood_group (blood_group),
    INDEX idx_blood_bank_status (status),
    INDEX idx_blood_bank_expiry (expiry_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES blood_donors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LAB TEST TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS lab_test_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    department_id VARCHAR(36) NULL,
    price DECIMAL(10,2) NOT NULL,
    parameters JSON NULL COMMENT 'Test parameters/fields',
    normal_range TEXT NULL,
    turnaround_time_hours INT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_lab_templates_tenant (tenant_id),
    INDEX idx_lab_templates_department (department_id),
    INDEX idx_lab_templates_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES hospital_departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LAB REPORTS
-- =====================================================
CREATE TABLE IF NOT EXISTS lab_reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    template_id VARCHAR(36) NOT NULL,
    doctor_id VARCHAR(36) NULL,
    lab_technician_id VARCHAR(36) NULL,
    test_results JSON NULL,
    findings TEXT NULL,
    recommendations TEXT NULL,
    test_date DATE NOT NULL,
    result_date DATE NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_lab_reports_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_lab_reports_patient (patient_id),
    INDEX idx_lab_reports_template (template_id),
    INDEX idx_lab_reports_status (status),
    INDEX idx_lab_reports_date (test_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES lab_test_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (lab_technician_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- HOSPITAL SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS hospital_services (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    department_id VARCHAR(36) NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    requirements TEXT NULL COMMENT 'Pre-requisites or preparation needed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hospital_services_tenant (tenant_id),
    INDEX idx_hospital_services_department (department_id),
    INDEX idx_hospital_services_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES hospital_departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SERVICE PACKAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS service_packages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    service_ids JSON NOT NULL COMMENT 'Array of service IDs',
    original_price DECIMAL(10,2) NOT NULL,
    package_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) NULL,
    validity_days INT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_service_packages_tenant (tenant_id),
    INDEX idx_service_packages_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PATIENT DOCUMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NULL COMMENT 'pdf, image, etc',
    file_size INT NULL COMMENT 'in bytes',
    uploaded_by VARCHAR(36) NULL,
    document_type ENUM('lab_result', 'prescription', 'scan', 'report', 'consent', 'other') DEFAULT 'other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_documents_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_patient_documents_patient (patient_id),
    INDEX idx_patient_documents_type (document_type),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- HOSPITAL EXPENSES
-- =====================================================
CREATE TABLE IF NOT EXISTS hospital_expenses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    category VARCHAR(100) NOT NULL COMMENT 'salaries, utilities, supplies, equipment',
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT NULL,
    department_id VARCHAR(36) NULL,
    vendor_name VARCHAR(255) NULL,
    receipt_number VARCHAR(100) NULL,
    approved_by VARCHAR(36) NULL,
    status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hospital_expenses_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_hospital_expenses_category (category),
    INDEX idx_hospital_expenses_date (date),
    INDEX idx_hospital_expenses_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES hospital_departments(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- FINANCIAL RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS financial_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    income DECIMAL(12,2) DEFAULT 0,
    expense DECIMAL(12,2) DEFAULT 0,
    net_balance DECIMAL(12,2) DEFAULT 0,
    notes TEXT NULL,
    recorded_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_financial_records_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_financial_records_date (date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_financial_record_date (clinic_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Hospital module schema created successfully!' AS Status;

