-- Phase 4: Advanced Appointments & Clinical Notes Schema
-- This script adds advanced appointment features and clinical documentation tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Advanced Appointments: Recurrence Patterns
CREATE TABLE appointment_recurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    recurrence_type VARCHAR(50) NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
    interval_value INTEGER NOT NULL DEFAULT 1,
    recurrence_count INTEGER,
    end_type VARCHAR(50) NOT NULL DEFAULT 'never' CHECK (end_type IN ('never', 'after_count', 'on_date')),
    end_date DATE,
    days_of_week JSONB DEFAULT '[]',
    days_of_month JSONB DEFAULT '[]',
    months_of_year JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advanced Appointments: Waitlist Management
CREATE TABLE appointment_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    requested_by UUID NOT NULL REFERENCES users(id),
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    appointment_type VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    preferred_provider_id UUID REFERENCES users(id),
    notes TEXT,
    reason_for_appointment TEXT,
    priority_level INTEGER NOT NULL DEFAULT 5 CHECK (priority_level BETWEEN 1 AND 10),
    is_urgent BOOLEAN NOT NULL DEFAULT false,
    contact_method VARCHAR(50) NOT NULL DEFAULT 'any' CHECK (contact_method IN ('phone', 'email', 'sms', 'any')),
    contact_time_preference VARCHAR(50) NOT NULL DEFAULT 'any' CHECK (contact_time_preference IN ('morning', 'afternoon', 'evening', 'any')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'scheduled', 'cancelled', 'expired')),
    contacted_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    scheduled_appointment_id UUID REFERENCES appointments(id),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Advanced Appointments: Conflict Detection
CREATE TABLE appointment_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    primary_appointment_id UUID NOT NULL REFERENCES appointments(id),
    conflicting_appointment_id UUID NOT NULL REFERENCES appointments(id),
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('provider_double_booking', 'room_double_booking', 'patient_double_booking', 'schedule_conflict', 'resource_unavailable')),
    status VARCHAR(50) NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'resolved', 'ignored', 'escalated')),
    description TEXT NOT NULL,
    conflict_details JSONB DEFAULT '{}',
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    severity_level INTEGER NOT NULL DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 5),
    auto_resolved BOOLEAN NOT NULL DEFAULT false,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Notes: Main clinical documentation
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('consultation', 'examination', 'treatment', 'follow_up', 'emergency', 'progress', 'discharge')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'amended', 'archived')),
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT,
    medical_history TEXT,
    dental_history TEXT,
    examination_findings TEXT,
    diagnosis TEXT,
    treatment_rendered TEXT,
    treatment_plan TEXT,
    recommendations TEXT,
    follow_up_instructions TEXT,
    additional_notes TEXT,
    vital_signs JSONB DEFAULT '{}',
    medications JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    procedures_performed JSONB DEFAULT '[]',
    provider_signature TEXT,
    signed_at TIMESTAMPTZ,
    amended_by UUID REFERENCES users(id),
    amended_at TIMESTAMPTZ,
    amendment_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Clinical Notes: Treatment Plans
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    clinical_note_id UUID REFERENCES clinical_notes(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'accepted', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    actual_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    insurance_estimate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    patient_responsibility DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    in_progress_items INTEGER NOT NULL DEFAULT 0,
    pending_items INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    patient_consent_notes TEXT,
    patient_consent_date TIMESTAMPTZ,
    patient_consent_obtained BOOLEAN NOT NULL DEFAULT false,
    proposed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Clinical Notes: Treatment Plan Items
CREATE TABLE treatment_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    provider_id UUID REFERENCES users(id),
    procedure_name VARCHAR(255) NOT NULL,
    procedure_code VARCHAR(50),
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('procedure', 'consultation', 'examination', 'cleaning', 'restoration', 'extraction', 'implant', 'orthodontic', 'periodontal', 'endodontic', 'prosthodontic', 'surgery', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 60,
    scheduled_date DATE,
    scheduled_time TIME,
    room_id VARCHAR(50),
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    insurance_coverage DECIMAL(10, 2) NOT NULL DEFAULT 0,
    patient_responsibility DECIMAL(10, 2) NOT NULL DEFAULT 0,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    progress_notes TEXT,
    depends_on_item_id UUID REFERENCES treatment_plan_items(id),
    sequence_order INTEGER NOT NULL DEFAULT 1,
    special_instructions TEXT,
    required_materials JSONB DEFAULT '[]',
    contraindications JSONB DEFAULT '[]',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_appointment_recurrences_appointment ON appointment_recurrences(appointment_id);
CREATE INDEX idx_appointment_recurrences_active ON appointment_recurrences(is_active) WHERE is_active = true;

CREATE INDEX idx_appointment_waitlist_tenant_clinic ON appointment_waitlist(tenant_id, clinic_id);
CREATE INDEX idx_appointment_waitlist_patient ON appointment_waitlist(patient_id);
CREATE INDEX idx_appointment_waitlist_status ON appointment_waitlist(status);
CREATE INDEX idx_appointment_waitlist_priority ON appointment_waitlist(priority_level, is_urgent);
CREATE INDEX idx_appointment_waitlist_expires ON appointment_waitlist(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_appointment_conflicts_tenant ON appointment_conflicts(tenant_id);
CREATE INDEX idx_appointment_conflicts_primary ON appointment_conflicts(primary_appointment_id);
CREATE INDEX idx_appointment_conflicts_conflicting ON appointment_conflicts(conflicting_appointment_id);
CREATE INDEX idx_appointment_conflicts_status ON appointment_conflicts(status);
CREATE INDEX idx_appointment_conflicts_severity ON appointment_conflicts(severity_level);

CREATE INDEX idx_clinical_notes_tenant ON clinical_notes(tenant_id);
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_provider ON clinical_notes(provider_id);
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX idx_clinical_notes_type ON clinical_notes(note_type);
CREATE INDEX idx_clinical_notes_status ON clinical_notes(status);
CREATE INDEX idx_clinical_notes_created ON clinical_notes(created_at);

CREATE INDEX idx_treatment_plans_tenant ON treatment_plans(tenant_id);
CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_provider ON treatment_plans(provider_id);
CREATE INDEX idx_treatment_plans_clinical_note ON treatment_plans(clinical_note_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX idx_treatment_plans_priority ON treatment_plans(priority);

CREATE INDEX idx_treatment_plan_items_plan ON treatment_plan_items(treatment_plan_id);
CREATE INDEX idx_treatment_plan_items_appointment ON treatment_plan_items(appointment_id);
CREATE INDEX idx_treatment_plan_items_provider ON treatment_plan_items(provider_id);
CREATE INDEX idx_treatment_plan_items_status ON treatment_plan_items(status);
CREATE INDEX idx_treatment_plan_items_sequence ON treatment_plan_items(treatment_plan_id, sequence_order);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointment_recurrences_updated_at BEFORE UPDATE ON appointment_recurrences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_waitlist_updated_at BEFORE UPDATE ON appointment_waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_conflicts_updated_at BEFORE UPDATE ON appointment_conflicts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plan_items_updated_at BEFORE UPDATE ON treatment_plan_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for reporting
CREATE VIEW appointment_recurrence_summary AS
SELECT 
    ar.id,
    ar.appointment_id,
    a.tenant_id,
    a.clinic_id,
    a.patient_id,
    a.provider_id,
    ar.recurrence_type,
    ar.interval_value,
    ar.end_type,
    ar.end_date,
    ar.is_active,
    ar.last_generated_at,
    COUNT(ra.id) as generated_appointments_count
FROM appointment_recurrences ar
JOIN appointments a ON ar.appointment_id = a.id
LEFT JOIN appointments ra ON ra.master_appointment_id = a.id
WHERE ar.is_active = true
GROUP BY ar.id, ar.appointment_id, a.tenant_id, a.clinic_id, a.patient_id, a.provider_id, 
         ar.recurrence_type, ar.interval_value, ar.end_type, ar.end_date, ar.is_active, ar.last_generated_at;

CREATE VIEW waitlist_summary AS
SELECT 
    w.id,
    w.tenant_id,
    w.clinic_id,
    w.patient_id,
    w.appointment_type,
    w.priority_level,
    w.is_urgent,
    w.status,
    w.created_at,
    w.expires_at,
    CASE 
        WHEN w.expires_at < NOW() AND w.status = 'active' THEN 'expired'
        ELSE w.status
    END as effective_status
FROM appointment_waitlist w
WHERE w.deleted_at IS NULL;

CREATE VIEW clinical_notes_summary AS
SELECT 
    cn.id,
    cn.tenant_id,
    cn.clinic_id,
    cn.patient_id,
    cn.provider_id,
    cn.note_type,
    cn.status,
    cn.chief_complaint,
    cn.diagnosis,
    cn.created_at,
    cn.signed_at,
    cn.amended_at,
    LENGTH(cn.chief_complaint) + LENGTH(COALESCE(cn.history_of_present_illness, '')) + 
    LENGTH(COALESCE(cn.examination_findings, '')) + LENGTH(COALESCE(cn.treatment_rendered, '')) as note_length
FROM clinical_notes cn
WHERE cn.deleted_at IS NULL;

CREATE VIEW treatment_plan_summary AS
SELECT 
    tp.id,
    tp.tenant_id,
    tp.clinic_id,
    tp.patient_id,
    tp.provider_id,
    tp.title,
    tp.status,
    tp.priority,
    tp.estimated_cost,
    tp.actual_cost,
    tp.total_items,
    tp.completed_items,
    tp.pending_items,
    CASE 
        WHEN tp.total_items > 0 THEN (tp.completed_items::DECIMAL / tp.total_items) * 100
        ELSE 0
    END as completion_percentage,
    tp.created_at,
    tp.estimated_completion_date,
    tp.actual_completion_date
FROM treatment_plans tp
WHERE tp.deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE appointment_recurrences IS 'Recurring appointment patterns and schedules';
COMMENT ON TABLE appointment_waitlist IS 'Patient waitlist for appointment scheduling';
COMMENT ON TABLE appointment_conflicts IS 'Detected and resolved appointment scheduling conflicts';
COMMENT ON TABLE clinical_notes IS 'Clinical documentation and medical notes';
COMMENT ON TABLE treatment_plans IS 'Comprehensive treatment plans for patients';
COMMENT ON TABLE treatment_plan_items IS 'Individual procedures and items within treatment plans';

COMMENT ON COLUMN appointment_waitlist.priority_level IS 'Priority level 1-10 (10 being highest priority)';
COMMENT ON COLUMN appointment_conflicts.severity_level IS 'Conflict severity 1-5 (5 being most severe)';
COMMENT ON COLUMN clinical_notes.status IS 'Note status: draft, finalized, amended, or archived';
COMMENT ON COLUMN treatment_plans.status IS 'Treatment plan workflow status';
COMMENT ON COLUMN treatment_plan_items.sequence_order IS 'Order of execution within the treatment plan';
