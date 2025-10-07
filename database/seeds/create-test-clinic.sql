-- Create a test clinic for demo tenant
USE healthcare_saas;

INSERT INTO clinics (
    id,
    tenant_id,
    name,
    address,
    phone,
    email,
    timezone,
    business_hours,
    settings,
    is_active,
    created_at,
    updated_at
) VALUES (
    'demo-clinic-001',
    'demo-tenant-001',
    'Main Dental Clinic',
    JSON_OBJECT(
        'street', '100 Healthcare Drive',
        'city', 'New York',
        'state', 'NY',
        'zip', '10001',
        'country', 'USA'
    ),
    '+1-212-555-0100',
    'info@maindental.com',
    'America/New_York',
    JSON_OBJECT(
        'monday', JSON_OBJECT('open', '09:00', 'close', '17:00'),
        'tuesday', JSON_OBJECT('open', '09:00', 'close', '17:00'),
        'wednesday', JSON_OBJECT('open', '09:00', 'close', '17:00'),
        'thursday', JSON_OBJECT('open', '09:00', 'close', '17:00'),
        'friday', JSON_OBJECT('open', '09:00', 'close', '16:00')
    ),
    JSON_OBJECT(
        'appointmentDuration', 30,
        'allowOnlineBooking', true
    ),
    true,
    NOW(),
    NOW()
);

SELECT 'Clinic created successfully!' as Status;
SELECT id, name, phone FROM clinics WHERE id = 'demo-clinic-001';

