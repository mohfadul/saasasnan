-- Database Index Verification Script
-- Run this script to verify that all performance indexes are properly created

-- Check if indexes exist and their usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    idx_tup_read / GREATEST(idx_scan, 1) as avg_tuples_per_scan
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- Check index sizes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) as size_bytes
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Verify critical performance indexes exist
SELECT 
    t.relname as table_name,
    i.relname as index_name,
    pg_get_indexdef(i.oid) as index_definition
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
WHERE t.relname IN ('appointments', 'patients', 'invoices', 'analytics_metrics', 'clinical_notes')
  AND i.relname LIKE 'idx_%'
ORDER BY t.relname, i.relname;

-- Check for missing indexes on frequently queried columns
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
  AND tablename IN ('appointments', 'patients', 'invoices', 'analytics_metrics')
  AND (attname LIKE '%tenant_id%' OR attname LIKE '%created_at%' OR attname LIKE '%status%')
ORDER BY tablename, attname;

-- Show table statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
  AND tablename IN ('appointments', 'patients', 'invoices', 'analytics_metrics', 'clinical_notes')
ORDER BY n_live_tup DESC;

-- Check for unused indexes (candidates for removal)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Performance test queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM appointments 
WHERE tenant_id = 'test-tenant' 
  AND start_time >= '2023-01-01' 
  AND start_time <= '2023-12-31'
  AND status IN ('scheduled', 'confirmed')
ORDER BY start_time DESC
LIMIT 50;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM patients 
WHERE tenant_id = 'test-tenant' 
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM invoices 
WHERE tenant_id = 'test-tenant' 
  AND status = 'paid' 
  AND invoice_date >= '2023-01-01'
ORDER BY invoice_date DESC;
