-- Feature Management System Schema
-- This schema supports feature flags, A/B testing, and gradual rollouts

-- Feature Flags
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'boolean' CHECK (type IN ('boolean', 'string', 'number', 'json')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    rollout_strategy VARCHAR(50) DEFAULT 'immediate' CHECK (rollout_strategy IN ('immediate', 'gradual', 'percentage', 'targeted', 'a_b_test')),
    default_value JSONB NOT NULL,
    rollout_config JSONB NOT NULL,
    targeting_rules JSONB,
    variants JSONB,
    is_experiment BOOLEAN DEFAULT false,
    experiment_id VARCHAR(255),
    experiment_config JSONB,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    evaluation_count INTEGER DEFAULT 0,
    positive_evaluations INTEGER DEFAULT 0,
    metrics JSONB,
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_flag_key UNIQUE(tenant_id, key)
);

-- Feature Flag Evaluations (for caching and analytics)
CREATE TABLE feature_flag_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('user', 'session', 'request', 'system')),
    context_id VARCHAR(255) NOT NULL,
    evaluated_value JSONB NOT NULL,
    variant VARCHAR(100),
    rollout_percentage DECIMAL(8,6),
    is_targeted BOOLEAN DEFAULT false,
    targeting_match JSONB,
    evaluation_context JSONB,
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_flag_context_evaluation UNIQUE(feature_flag_id, context_type, context_id)
);

-- A/B Tests
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN ('conversion', 'engagement', 'performance', 'ux', 'feature')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
    traffic_split VARCHAR(50) DEFAULT 'equal' CHECK (traffic_split IN ('equal', 'custom', 'weighted')),
    variants JSONB NOT NULL,
    traffic_allocation JSONB NOT NULL,
    targeting_rules JSONB,
    success_metrics JSONB NOT NULL,
    significance_level DECIMAL(5,2) DEFAULT 0.05,
    minimum_sample_size INTEGER,
    maximum_duration_days INTEGER,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    planned_end_date TIMESTAMPTZ,
    results JSONB DEFAULT '{
        "total_participants": 0,
        "variant_stats": {},
        "is_statistically_significant": false,
        "test_duration_days": 0
    }',
    auto_stop_on_significance BOOLEAN DEFAULT false,
    auto_apply_winner BOOLEAN DEFAULT false,
    experiment_config JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B Test Participants
CREATE TABLE ab_test_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ab_test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    variant VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'converted', 'dropped', 'excluded')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ,
    dropped_at TIMESTAMPTZ,
    conversion_data JSONB,
    session_data JSONB,
    device_info JSONB,
    user_attributes JSONB,
    session_id VARCHAR(255),
    device_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_test_user_participation UNIQUE(ab_test_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_feature_flags_tenant_status ON feature_flags(tenant_id, status);
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_active_dates ON feature_flags(start_date, end_date) WHERE status = 'active';

CREATE INDEX idx_feature_flag_evaluations_flag_id ON feature_flag_evaluations(feature_flag_id);
CREATE INDEX idx_feature_flag_evaluations_context ON feature_flag_evaluations(context_type, context_id);
CREATE INDEX idx_feature_flag_evaluations_expires ON feature_flag_evaluations(expires_at);

CREATE INDEX idx_ab_tests_tenant_status ON ab_tests(tenant_id, status);
CREATE INDEX idx_ab_tests_dates ON ab_tests(start_date, end_date);

CREATE INDEX idx_ab_test_participants_test_id ON ab_test_participants(ab_test_id);
CREATE INDEX idx_ab_test_participants_user_id ON ab_test_participants(user_id);
CREATE INDEX idx_ab_test_participants_status ON ab_test_participants(status);
CREATE INDEX idx_ab_test_participants_variant ON ab_test_participants(variant);

-- Triggers for updated_at
CREATE TRIGGER trigger_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Materialized view for feature flag analytics
CREATE MATERIALIZED VIEW feature_flag_analytics AS
SELECT 
    ff.id as flag_id,
    ff.tenant_id,
    ff.key as flag_key,
    ff.name as flag_name,
    ff.status,
    ff.type,
    ff.evaluation_count,
    ff.positive_evaluations,
    CASE 
        WHEN ff.evaluation_count > 0 
        THEN (ff.positive_evaluations::decimal / ff.evaluation_count) * 100 
        ELSE 0 
    END as positive_rate,
    COUNT(DISTINCT ffe.context_id) as unique_evaluators,
    COUNT(DISTINCT CASE WHEN ffe.is_targeted THEN ffe.context_id END) as targeted_evaluators,
    COUNT(DISTINCT ffe.variant) as variant_count,
    AVG(CASE WHEN ffe.rollout_percentage IS NOT NULL THEN ffe.rollout_percentage ELSE 0 END) as avg_rollout_percentage,
    DATE_TRUNC('day', ff.created_at) as created_date,
    CASE 
        WHEN ff.end_date IS NOT NULL AND ff.end_date < NOW() THEN 'expired'
        WHEN ff.start_date IS NOT NULL AND ff.start_date > NOW() THEN 'scheduled'
        WHEN ff.status = 'active' THEN 'running'
        ELSE ff.status
    END as effective_status
FROM feature_flags ff
LEFT JOIN feature_flag_evaluations ffe ON ff.id = ffe.feature_flag_id
GROUP BY ff.id, ff.tenant_id, ff.key, ff.name, ff.status, ff.type, 
         ff.evaluation_count, ff.positive_evaluations, ff.created_at, ff.start_date, ff.end_date;

CREATE UNIQUE INDEX idx_feature_flag_analytics_flag_id ON feature_flag_analytics(flag_id);
CREATE INDEX idx_feature_flag_analytics_tenant_status ON feature_flag_analytics(tenant_id, effective_status);

-- Materialized view for A/B test analytics
CREATE MATERIALIZED VIEW ab_test_analytics AS
SELECT 
    at.id as test_id,
    at.tenant_id,
    at.name as test_name,
    at.test_type,
    at.status,
    at.traffic_split,
    at.results->>'total_participants'::integer as total_participants,
    at.results->>'winner' as winner,
    (at.results->>'is_statistically_significant')::boolean as is_statistically_significant,
    (at.results->>'test_duration_days')::integer as test_duration_days,
    COUNT(DISTINCT atp.id) as actual_participants,
    COUNT(DISTINCT CASE WHEN atp.status = 'converted' THEN atp.id END) as conversions,
    COUNT(DISTINCT CASE WHEN atp.status = 'converted' THEN atp.id END)::decimal / 
        NULLIF(COUNT(DISTINCT atp.id), 0) * 100 as overall_conversion_rate,
    at.start_date,
    at.end_date,
    CASE 
        WHEN at.end_date IS NOT NULL THEN 'completed'
        WHEN at.start_date IS NOT NULL THEN 'running'
        ELSE 'draft'
    END as effective_status
FROM ab_tests at
LEFT JOIN ab_test_participants atp ON at.id = atp.ab_test_id
GROUP BY at.id, at.tenant_id, at.name, at.test_type, at.status, at.traffic_split,
         at.results, at.start_date, at.end_date;

CREATE UNIQUE INDEX idx_ab_test_analytics_test_id ON ab_test_analytics(test_id);
CREATE INDEX idx_ab_test_analytics_tenant_status ON ab_test_analytics(tenant_id, effective_status);

-- Function to refresh analytics views
CREATE OR REPLACE FUNCTION refresh_feature_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY feature_flag_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY ab_test_analytics;
END;
$$ LANGUAGE plpgsql;

-- Sample feature flags for common healthcare features
INSERT INTO feature_flags (tenant_id, key, name, description, type, status, rollout_strategy, default_value, rollout_config, variants) VALUES
(
    (SELECT id FROM tenants LIMIT 1),
    'enable_telehealth_appointments',
    'Enable Telehealth Appointments',
    'Allow patients to book and attend virtual appointments',
    'boolean',
    'active',
    'percentage',
    false,
    '{"percentage": 50}',
    '{"enabled": true, "disabled": false}'
),
(
    (SELECT id FROM tenants LIMIT 1),
    'advanced_analytics_dashboard',
    'Advanced Analytics Dashboard',
    'Show enhanced analytics and reporting features',
    'boolean',
    'active',
    'targeted',
    false,
    '{}',
    '{"enabled": true, "disabled": false}'
),
(
    (SELECT id FROM tenants LIMIT 1),
    'ai_powered_scheduling',
    'AI-Powered Scheduling',
    'Use AI to optimize appointment scheduling',
    'boolean',
    'draft',
    'gradual',
    false,
    '{"start_date": "2024-01-01T00:00:00Z", "end_date": "2024-01-31T23:59:59Z", "max_percentage": 25}',
    '{"enabled": true, "disabled": false}'
),
(
    (SELECT id FROM tenants LIMIT 1),
    'mobile_app_features',
    'Mobile App Feature Set',
    'Control which features are available in the mobile app',
    'json',
    'active',
    'targeted',
    '{"appointments": true, "billing": true, "records": false}',
    '{}',
    '{"basic": {"appointments": true, "billing": false, "records": false}, "premium": {"appointments": true, "billing": true, "records": true}}'
);

-- Sample A/B test for appointment booking flow
INSERT INTO ab_tests (tenant_id, name, description, test_type, status, traffic_split, variants, traffic_allocation, success_metrics, significance_level, minimum_sample_size) VALUES
(
    (SELECT id FROM tenants LIMIT 1),
    'Appointment Booking Flow Optimization',
    'Test different appointment booking flows to improve conversion rates',
    'conversion',
    'running',
    'equal',
    '{"control": {"flow_type": "standard", "steps": 5}, "variant_a": {"flow_type": "simplified", "steps": 3}, "variant_b": {"flow_type": "guided", "steps": 4}}',
    '{"control": 33.33, "variant_a": 33.33, "variant_b": 33.34}',
    '{"primary": "booking_completion_rate", "secondary": ["time_to_complete", "user_satisfaction_score"]}',
    0.05,
    100
);

-- Comments for documentation
COMMENT ON TABLE feature_flags IS 'Feature flags for controlling application behavior and gradual rollouts';
COMMENT ON TABLE feature_flag_evaluations IS 'Cache and analytics data for feature flag evaluations';
COMMENT ON TABLE ab_tests IS 'A/B tests for comparing different feature implementations';
COMMENT ON TABLE ab_test_participants IS 'User assignments and outcomes for A/B tests';

COMMENT ON COLUMN feature_flags.rollout_strategy IS 'Strategy for rolling out the feature: immediate, gradual, percentage-based, targeted, or A/B test';
COMMENT ON COLUMN feature_flags.variants IS 'Different variants of the feature for A/B testing';
COMMENT ON COLUMN feature_flags.targeting_rules IS 'Rules for targeting specific users or user segments';

COMMENT ON COLUMN ab_tests.traffic_allocation IS 'Percentage of traffic allocated to each variant';
COMMENT ON COLUMN ab_tests.success_metrics IS 'Metrics used to measure test success';
COMMENT ON COLUMN ab_tests.results IS 'Calculated test results including statistical significance';
