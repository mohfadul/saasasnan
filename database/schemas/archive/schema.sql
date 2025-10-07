-- Healthcare SaaS Platform - Core Database Schema
-- Execute these first to set up core tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants table (multi-tenancy foundation)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    config JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_tenants_subdomain (subdomain)
);

-- Clinics table (dental practices within tenants)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    address JSONB NOT NULL,
    contact_info JSONB NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_clinics_tenant (tenant_id)
);

-- Users with RBAC and security
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID REFERENCES clinics(id),
    email VARCHAR(255) NOT NULL,
    encrypted_password VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('super_admin', 'clinic_admin', 'dentist', 'staff', 'supplier', 'patient')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(100),
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT unique_tenant_email UNIQUE(tenant_id, email),
    INDEX idx_users_tenant_role (tenant_id, role),
    INDEX idx_users_clinic (clinic_id)
);

-- Enhanced Patients table with PHI protection
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    
    -- Encrypted PHI fields
    encrypted_demographics BYTEA NOT NULL, -- Encrypted JSON with name, DOB, etc.
    demographics_key_id VARCHAR(100), -- KMS key ID for decryption
    
    -- Non-PHI fields
    patient_external_id VARCHAR(100),
    tags JSONB DEFAULT '[]',
    consent_flags JSONB DEFAULT '{}',
    medical_alert_flags JSONB DEFAULT '{}',
    last_visit_at TIMESTAMPTZ,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Indexes for performance
    INDEX idx_patients_tenant_clinic (tenant_id, clinic_id),
    INDEX idx_patients_external_id (tenant_id, patient_external_id),
    INDEX idx_patients_tags (tenant_id, tags)
);

-- Enhanced Appointments with comprehensive tracking
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    
    -- Appointment details
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    appointment_type VARCHAR(100),
    reason TEXT,
    room_id UUID, -- Will reference clinic_rooms table later
    
    -- Status tracking
    checked_in_at TIMESTAMPTZ,
    seen_by_provider_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Recurrence
    recurrence_pattern JSONB,
    master_appointment_id UUID REFERENCES appointments(id),
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints and indexes
    CONSTRAINT valid_appointment_times CHECK (end_time > start_time),
    INDEX idx_appointments_tenant_clinic_date (tenant_id, clinic_id, start_time),
    INDEX idx_appointments_patient (tenant_id, patient_id),
    INDEX idx_appointments_provider (tenant_id, provider_id)
);

-- Treatment plans and clinical notes
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_treatment_plans_patient (tenant_id, patient_id),
    INDEX idx_treatment_plans_provider (tenant_id, provider_id)
);

-- Clinical notes
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    
    note_type VARCHAR(50) NOT NULL, -- 'examination', 'treatment', 'follow_up'
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_clinical_notes_patient (tenant_id, patient_id),
    INDEX idx_clinical_notes_appointment (tenant_id, appointment_id)
);

-- Audit logs for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_audit_logs_tenant_user (tenant_id, user_id),
    INDEX idx_audit_logs_resource (resource_type, resource_id),
    INDEX idx_audit_logs_timestamp (created_at)
);

-- Insert default super admin tenant
INSERT INTO tenants (name, subdomain, config) VALUES 
('Healthcare Platform', 'platform', '{"features": {"marketplace": true, "ai": true, "analytics": true}}');

-- Insert default super admin user (password: Admin123!)
INSERT INTO users (tenant_id, email, encrypted_password, role, first_name, last_name) VALUES 
(
    (SELECT id FROM tenants WHERE subdomain = 'platform'),
    'admin@healthcare-platform.com',
    crypt('Admin123!', gen_salt('bf')),
    'super_admin',
    'Platform',
    'Administrator'
);
