-- AI & Machine Learning Schema
-- This script creates tables for AI models, predictions, insights, and automation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AI Models Table
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    model_name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('predictive', 'classification', 'regression', 'clustering', 'nlp', 'computer_vision', 'recommendation')),
    model_category VARCHAR(50) NOT NULL CHECK (model_category IN ('appointment_prediction', 'revenue_forecasting', 'patient_outcome', 'no_show_prediction', 'treatment_recommendation', 'billing_optimization', 'clinical_insights', 'patient_engagement')),
    status VARCHAR(50) NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'trained', 'deployed', 'deprecated', 'failed')),
    algorithm VARCHAR(100) NOT NULL,
    model_file_path VARCHAR(255),
    model_version VARCHAR(255),
    accuracy DECIMAL(5, 4),
    precision DECIMAL(5, 4),
    recall DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    model_config JSONB NOT NULL,
    training_data_config JSONB NOT NULL,
    feature_importance JSONB,
    training_samples INTEGER,
    validation_samples INTEGER,
    test_samples INTEGER,
    last_trained_at TIMESTAMPTZ,
    last_deployed_at TIMESTAMPTZ,
    next_retrain_at TIMESTAMPTZ,
    retrain_frequency INTEGER NOT NULL DEFAULT 30, -- days
    auto_retrain BOOLEAN NOT NULL DEFAULT true,
    performance_metrics JSONB,
    deployment_config JSONB,
    monitoring_config JSONB,
    is_production BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Predictions Table
CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('appointment_no_show', 'revenue_forecast', 'patient_outcome', 'treatment_success', 'billing_risk', 'patient_engagement', 'provider_performance', 'inventory_demand')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    input_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score DECIMAL(8, 6),
    probability_score DECIMAL(8, 6),
    feature_contributions JSONB,
    explanation JSONB,
    predicted_for_date TIMESTAMPTZ,
    actual_outcome_date TIMESTAMPTZ,
    actual_outcome JSONB,
    accuracy_score DECIMAL(8, 6),
    is_validated BOOLEAN NOT NULL DEFAULT false,
    validated_at TIMESTAMPTZ,
    expiry_days INTEGER NOT NULL DEFAULT 30, -- days
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Insights Table
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID REFERENCES clinics(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('performance', 'opportunity', 'risk', 'trend', 'recommendation', 'anomaly', 'pattern', 'forecast')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('appointment', 'revenue', 'patient', 'provider', 'clinical', 'operational', 'financial', 'marketing')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'acted_on', 'dismissed', 'archived')),
    confidence_score DECIMAL(8, 6),
    impact_score DECIMAL(8, 6),
    data_points JSONB NOT NULL,
    recommendations JSONB,
    supporting_evidence JSONB,
    related_metrics JSONB,
    detected_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    action_taken JSONB,
    action_taken_at TIMESTAMPTZ,
    action_taken_by UUID REFERENCES users(id),
    is_automated BOOLEAN NOT NULL DEFAULT false,
    requires_human_review BOOLEAN NOT NULL DEFAULT false,
    tags JSONB,
    metadata JSONB,
    auto_archive_days INTEGER NOT NULL DEFAULT 30, -- days
    auto_archive_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Automation Rules Table
CREATE TABLE ai_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID REFERENCES clinics(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    automation_type VARCHAR(50) NOT NULL CHECK (automation_type IN ('scheduling', 'billing', 'communication', 'clinical', 'marketing', 'inventory', 'reporting', 'notification')),
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('schedule', 'event', 'condition', 'prediction', 'manual', 'api')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused', 'error', 'disabled')),
    trigger_config JSONB NOT NULL,
    action_config JSONB NOT NULL,
    condition_config JSONB,
    ai_config JSONB,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    execution_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    next_execution_at TIMESTAMPTZ,
    execution_frequency INTEGER NOT NULL DEFAULT 0, -- minutes
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    approval_config JSONB,
    error_handling_config JSONB,
    notification_config JSONB,
    metadata JSONB,
    daily_limit INTEGER NOT NULL DEFAULT 1000, -- max executions per day
    daily_execution_count INTEGER NOT NULL DEFAULT 0,
    daily_count_reset_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Automation Executions Table
CREATE TABLE ai_automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES ai_automations(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'skipped')),
    trigger_data JSONB NOT NULL,
    execution_data JSONB,
    result_data JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_time INTEGER, -- milliseconds
    error_message TEXT,
    error_details JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ai_models_tenant ON ai_models(tenant_id);
CREATE INDEX idx_ai_models_category ON ai_models(model_category);
CREATE INDEX idx_ai_models_status ON ai_models(status);
CREATE INDEX idx_ai_models_production ON ai_models(is_production);
CREATE INDEX idx_ai_models_next_retrain ON ai_models(next_retrain_at);

CREATE INDEX idx_ai_predictions_tenant ON ai_predictions(tenant_id);
CREATE INDEX idx_ai_predictions_model ON ai_predictions(model_id);
CREATE INDEX idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX idx_ai_predictions_status ON ai_predictions(status);
CREATE INDEX idx_ai_predictions_validated ON ai_predictions(is_validated);
CREATE INDEX idx_ai_predictions_expires ON ai_predictions(expires_at);

CREATE INDEX idx_ai_insights_tenant ON ai_insights(tenant_id);
CREATE INDEX idx_ai_insights_clinic ON ai_insights(clinic_id);
CREATE INDEX idx_ai_insights_category ON ai_insights(category);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX idx_ai_insights_status ON ai_insights(status);
CREATE INDEX idx_ai_insights_auto_archive ON ai_insights(auto_archive_at);
CREATE INDEX idx_ai_insights_detected ON ai_insights(detected_at);

CREATE INDEX idx_ai_automations_tenant ON ai_automations(tenant_id);
CREATE INDEX idx_ai_automations_type ON ai_automations(automation_type);
CREATE INDEX idx_ai_automations_status ON ai_automations(status);
CREATE INDEX idx_ai_automations_enabled ON ai_automations(is_enabled);
CREATE INDEX idx_ai_automations_next_execution ON ai_automations(next_execution_at);

CREATE INDEX idx_ai_automation_executions_automation ON ai_automation_executions(automation_id);
CREATE INDEX idx_ai_automation_executions_status ON ai_automation_executions(status);
CREATE INDEX idx_ai_automation_executions_started ON ai_automation_executions(started_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_predictions_updated_at BEFORE UPDATE ON ai_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_automations_updated_at BEFORE UPDATE ON ai_automations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_automation_executions_updated_at BEFORE UPDATE ON ai_automation_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for AI analytics
CREATE VIEW ai_model_performance_summary AS
SELECT 
    m.tenant_id,
    m.model_category,
    COUNT(*) as total_models,
    COUNT(CASE WHEN m.status = 'deployed' THEN 1 END) as deployed_models,
    AVG(m.accuracy) as avg_accuracy,
    AVG(m.precision) as avg_precision,
    AVG(m.recall) as avg_recall,
    AVG(m.f1_score) as avg_f1_score,
    SUM(p.execution_count) as total_predictions
FROM ai_models m
LEFT JOIN (
    SELECT 
        model_id,
        COUNT(*) as execution_count
    FROM ai_predictions
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY model_id
) p ON m.id = p.model_id
GROUP BY m.tenant_id, m.model_category;

CREATE VIEW ai_insights_summary AS
SELECT 
    i.tenant_id,
    i.category,
    COUNT(*) as total_insights,
    COUNT(CASE WHEN i.status = 'new' THEN 1 END) as new_insights,
    COUNT(CASE WHEN i.priority = 'critical' THEN 1 END) as critical_insights,
    COUNT(CASE WHEN i.priority = 'high' THEN 1 END) as high_priority_insights,
    AVG(i.confidence_score) as avg_confidence,
    AVG(i.impact_score) as avg_impact
FROM ai_insights i
WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY i.tenant_id, i.category;

CREATE VIEW ai_automation_summary AS
SELECT 
    a.tenant_id,
    a.automation_type,
    COUNT(*) as total_automations,
    COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_automations,
    SUM(a.execution_count) as total_executions,
    SUM(a.success_count) as total_successes,
    SUM(a.failure_count) as total_failures,
    CASE 
        WHEN SUM(a.execution_count) > 0 
        THEN (SUM(a.success_count)::DECIMAL / SUM(a.execution_count)) * 100
        ELSE 0
    END as success_rate
FROM ai_automations a
GROUP BY a.tenant_id, a.automation_type;

-- Create functions for AI operations
CREATE OR REPLACE FUNCTION cleanup_expired_predictions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_predictions 
    WHERE expires_at < NOW() 
    AND status IN ('completed', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION archive_old_insights()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE ai_insights 
    SET status = 'archived'
    WHERE auto_archive_at < NOW() 
    AND status NOT IN ('archived', 'acted_on');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_daily_automation_counts()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE ai_automations 
    SET daily_execution_count = 0,
        daily_count_reset_date = CURRENT_DATE
    WHERE daily_count_reset_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ai_model_metrics(p_model_id UUID)
RETURNS TABLE (
    model_id UUID,
    total_predictions BIGINT,
    successful_predictions BIGINT,
    avg_confidence DECIMAL,
    avg_accuracy DECIMAL,
    last_prediction_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.model_id,
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as successful_predictions,
        AVG(p.confidence_score) as avg_confidence,
        AVG(p.accuracy_score) as avg_accuracy,
        MAX(p.created_at) as last_prediction_date
    FROM ai_predictions p
    WHERE p.model_id = p_model_id
    AND p.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY p.model_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_ai_insights_summary(p_tenant_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    category VARCHAR,
    insight_count BIGINT,
    avg_confidence DECIMAL,
    avg_impact DECIMAL,
    critical_count BIGINT,
    high_priority_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.category,
        COUNT(*) as insight_count,
        AVG(i.confidence_score) as avg_confidence,
        AVG(i.impact_score) as avg_impact,
        COUNT(CASE WHEN i.priority = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN i.priority = 'high' THEN 1 END) as high_priority_count
    FROM ai_insights i
    WHERE i.tenant_id = p_tenant_id
    AND i.created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    GROUP BY i.category
    ORDER BY insight_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE ai_models IS 'AI/ML models for predictive analytics and automation';
COMMENT ON TABLE ai_predictions IS 'Individual predictions made by AI models';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE ai_automations IS 'Automation rules and workflows triggered by AI';
COMMENT ON TABLE ai_automation_executions IS 'Execution logs for automation rules';

COMMENT ON VIEW ai_model_performance_summary IS 'Summary of AI model performance metrics';
COMMENT ON VIEW ai_insights_summary IS 'Summary of AI insights by category';
COMMENT ON VIEW ai_automation_summary IS 'Summary of automation execution statistics';

COMMENT ON FUNCTION cleanup_expired_predictions() IS 'Removes expired predictions from the database';
COMMENT ON FUNCTION archive_old_insights() IS 'Archives old insights that have passed their auto-archive date';
COMMENT ON FUNCTION reset_daily_automation_counts() IS 'Resets daily execution counts for automation rules';
COMMENT ON FUNCTION get_ai_model_metrics(UUID) IS 'Returns performance metrics for a specific AI model';
COMMENT ON FUNCTION generate_ai_insights_summary(UUID, INTEGER) IS 'Generates insights summary for a tenant over specified days';
