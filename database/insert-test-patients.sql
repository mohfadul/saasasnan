-- Insert Test Patients
-- Password for all users: Admin123!
-- Password hash: $2b$10$pKXMuTBDEjDZdf1JDcmZ9.b8TOUIyJmt55WZl3JdgprW4ax.qgPSO

USE healthcare_saas;

-- Insert test patients for demo-clinic-001
INSERT INTO patients (
    id,
    tenant_id,
    clinic_id,
    demographics,
    patient_external_id,
    tags,
    consent_flags,
    medical_alert_flags,
    created_at,
    updated_at
) VALUES
(
    'patient-001',
    'demo-tenant-001',
    'demo-clinic-001',
    JSON_OBJECT(
        'firstName', 'John',
        'lastName', 'Smith',
        'dateOfBirth', '1985-03-15',
        'gender', 'male',
        'phone', '+12125551001',
        'email', 'john.smith@email.com',
        'address', JSON_OBJECT(
            'street', '123 Main St',
            'city', 'New York',
            'state', 'NY',
            'zip', '10001'
        )
    ),
    'EXT-001',
    JSON_ARRAY('vip', 'insurance'),
    JSON_OBJECT('hipaa', true, 'marketing', false),
    JSON_OBJECT('allergies', true, 'medications', false),
    NOW(),
    NOW()
),
(
    'patient-002',
    'demo-tenant-001',
    'demo-clinic-001',
    JSON_OBJECT(
        'firstName', 'Sarah',
        'lastName', 'Johnson',
        'dateOfBirth', '1990-07-22',
        'gender', 'female',
        'phone', '+12125551002',
        'email', 'sarah.johnson@email.com',
        'address', JSON_OBJECT(
            'street', '456 Oak Ave',
            'city', 'Brooklyn',
            'state', 'NY',
            'zip', '11201'
        )
    ),
    'EXT-002',
    JSON_ARRAY('new', 'insurance'),
    JSON_OBJECT('hipaa', true, 'marketing', true),
    JSON_OBJECT('allergies', false, 'medications', false),
    NOW(),
    NOW()
),
(
    'patient-003',
    'demo-tenant-001',
    'demo-clinic-001',
    JSON_OBJECT(
        'firstName', 'Michael',
        'lastName', 'Chen',
        'dateOfBirth', '1978-11-08',
        'gender', 'male',
        'phone', '+12125551003',
        'email', 'michael.chen@email.com',
        'address', JSON_OBJECT(
            'street', '789 Elm Street',
            'city', 'Queens',
            'state', 'NY',
            'zip', '11354'
        )
    ),
    'EXT-003',
    JSON_ARRAY('regular'),
    JSON_OBJECT('hipaa', true, 'marketing', false),
    JSON_OBJECT('allergies', true, 'medications', true),
    NOW(),
    NOW()
),
(
    'patient-004',
    'demo-tenant-001',
    'demo-clinic-001',
    JSON_OBJECT(
        'firstName', 'Emily',
        'lastName', 'Rodriguez',
        'dateOfBirth', '1995-04-30',
        'gender', 'female',
        'phone', '+12125551004',
        'email', 'emily.rodriguez@email.com',
        'address', JSON_OBJECT(
            'street', '321 Park Place',
            'city', 'Manhattan',
            'state', 'NY',
            'zip', '10003'
        )
    ),
    'EXT-004',
    JSON_ARRAY('vip'),
    JSON_OBJECT('hipaa', true, 'marketing', true),
    JSON_OBJECT('allergies', false, 'medications', false),
    NOW(),
    NOW()
),
(
    'patient-005',
    'demo-tenant-001',
    'demo-clinic-001',
    JSON_OBJECT(
        'firstName', 'David',
        'lastName', 'Kim',
        'dateOfBirth', '1982-09-12',
        'gender', 'male',
        'phone', '+12125551005',
        'email', 'david.kim@email.com',
        'address', JSON_OBJECT(
            'street', '555 Broadway',
            'city', 'New York',
            'state', 'NY',
            'zip', '10012'
        )
    ),
    'EXT-005',
    JSON_ARRAY('regular', 'insurance'),
    JSON_OBJECT('hipaa', true, 'marketing', false),
    JSON_OBJECT('allergies', false, 'medications', true),
    NOW(),
    NOW()
);

SELECT 'Successfully inserted 5 test patients!' as Status;

-- Verify insertion
SELECT 
    id,
    JSON_UNQUOTE(JSON_EXTRACT(demographics, '$.firstName')) as first_name,
    JSON_UNQUOTE(JSON_EXTRACT(demographics, '$.lastName')) as last_name,
    JSON_UNQUOTE(JSON_EXTRACT(demographics, '$.email')) as email
FROM patients
WHERE tenant_id = 'demo-tenant-001'
ORDER BY created_at DESC;

