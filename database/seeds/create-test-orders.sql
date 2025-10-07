-- CREATE TEST ORDERS FOR MARKETPLACE
-- This creates realistic test orders with items

USE healthcare_saas;

-- Get tenant and clinic IDs
SET @tenant_id = (SELECT id FROM tenants LIMIT 1);
SET @clinic_id = (SELECT id FROM clinics LIMIT 1);

-- Get supplier IDs (create if they don't exist)
SET @supplier1 = (SELECT id FROM suppliers WHERE name = 'Dental Supply Co' LIMIT 1);
SET @supplier2 = (SELECT id FROM suppliers WHERE name = 'MedEquip International' LIMIT 1);
SET @supplier3 = (SELECT id FROM suppliers WHERE name = 'ProDental Supplies' LIMIT 1);

-- If no suppliers exist, create them first
INSERT IGNORE INTO suppliers (id, tenant_id, name, contact_info, address, status, business_info, rating, total_orders, on_time_delivery_rate) VALUES
(UUID(), @tenant_id, 'Dental Supply Co', 
 '{"email": "contact@dentalsupply.com", "phone": "+1-555-0101", "contactPerson": "John Smith"}',
 '{"street": "123 Medical Plaza", "city": "New York", "state": "NY", "country": "USA"}',
 'active', '{}', 4.8, 25, 98.5);

SET @supplier1 = (SELECT id FROM suppliers WHERE name = 'Dental Supply Co' LIMIT 1);

-- Get a user ID for created_by
SET @user_id = (SELECT id FROM users LIMIT 1);

-- Create Test Orders
INSERT INTO orders (
  id, tenant_id, clinic_id, supplier_id, order_number, order_date, expected_delivery_date,
  status, subtotal, tax_amount, shipping_cost, discount_amount, total_amount,
  notes, created_by, created_at, updated_at
) VALUES

-- Order 1: Pending order
(UUID(), @tenant_id, @clinic_id, @supplier1, 'ORD-2025-001', 
 NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY),
 'pending', 1250.00, 125.00, 50.00, 0.00, 1425.00,
 'Routine dental supplies restock', @user_id, NOW(), NOW()),

-- Order 2: Confirmed order
(UUID(), @tenant_id, @clinic_id, @supplier1, 'ORD-2025-002',
 DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY),
 'confirmed', 890.50, 89.05, 35.00, 50.00, 964.55,
 'Emergency equipment order', @user_id, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),

-- Order 3: Shipped order
(UUID(), @tenant_id, @clinic_id, @supplier1, 'ORD-2025-003',
 DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY),
 'shipped', 2100.00, 210.00, 75.00, 100.00, 2285.00,
 'Monthly supply order', @user_id, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),

-- Order 4: Delivered order
(UUID(), @tenant_id, @clinic_id, @supplier1, 'ORD-2025-004',
 DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
 'delivered', 675.00, 67.50, 25.00, 0.00, 767.50,
 'Gloves and masks bulk order', @user_id, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),

-- Order 5: Draft order
(UUID(), @tenant_id, @clinic_id, @supplier1, 'ORD-2025-005',
 NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY),
 'draft', 3200.00, 320.00, 100.00, 200.00, 3420.00,
 'New equipment purchase - waiting approval', @user_id, NOW(), NOW());

-- Verify
SELECT 'SUCCESS! Created 5 test orders' AS Result, COUNT(*) AS TotalOrders 
FROM orders 
WHERE tenant_id = @tenant_id;

-- Show orders summary
SELECT 
  order_number,
  status,
  subtotal,
  total_amount,
  DATE_FORMAT(order_date, '%Y-%m-%d') as order_date
FROM orders
WHERE tenant_id = @tenant_id
ORDER BY order_date DESC;

