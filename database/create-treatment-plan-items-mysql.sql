-- Create treatment_plan_items table for MySQL
CREATE TABLE IF NOT EXISTS treatment_plan_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    treatment_plan_id CHAR(36) NOT NULL,
    appointment_id CHAR(36) NULL,
    provider_id CHAR(36) NULL,
    
    -- Procedure details
    procedure_name VARCHAR(255) NOT NULL,
    procedure_code VARCHAR(50) NULL,
    item_type VARCHAR(50) NOT NULL DEFAULT 'procedure' 
        CHECK (item_type IN ('procedure', 'consultation', 'examination', 'cleaning', 'restoration', 'extraction', 'implant', 'orthodontic', 'periodontal', 'endodontic', 'prosthodontic', 'surgery', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    description TEXT NULL,
    
    -- Quantity and timing
    quantity INT NOT NULL DEFAULT 1,
    estimated_duration_minutes INT NOT NULL DEFAULT 60,
    scheduled_date DATE NULL,
    scheduled_time TIME NULL,
    room_id VARCHAR(50) NULL,
    
    -- Financial
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    insurance_coverage DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    patient_responsibility DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Progress tracking
    completion_percentage INT NOT NULL DEFAULT 0,
    progress_notes TEXT NULL,
    depends_on_item_id CHAR(36) NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    
    -- Additional details
    special_instructions JSON NULL,
    required_materials JSON NULL,
    contraindications JSON NULL,
    
    -- Timestamps
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (treatment_plan_id) REFERENCES treatment_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (depends_on_item_id) REFERENCES treatment_plan_items(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_treatment_items_plan (treatment_plan_id),
    INDEX idx_treatment_items_appointment (appointment_id),
    INDEX idx_treatment_items_status (status),
    INDEX idx_treatment_items_provider (provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

