-- Analytics & Business Intelligence Schema
-- This script creates tables for advanced analytics, dashboards, and reporting

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Analytics Metrics Table
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID REFERENCES clinics(id), -- Assuming clinics table exists
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('appointment', 'revenue', 'patient', 'provider', 'inventory', 'clinical', 'operational')),
    metric_category VARCHAR(50) NOT NULL CHECK (metric_category IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'real_time')),
    metric_name VARCHAR(100) NOT NULL,
    metric_description VARCHAR(255) NOT NULL,
    metric_data JSONB NOT NULL,
    numeric_value DECIMAL(15, 4),
    unit VARCHAR(50),
    metric_date DATE NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'processing')),
    metadata JSONB,
    comparison_data JSONB,
    growth_rate DECIMAL(5, 2),
    trend_direction DECIMAL(5, 2), -- -1 (down), 0 (stable), 1 (up)
    breakdown_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Dashboards Table
CREATE TABLE analytics_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID REFERENCES clinics(id),
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dashboard_type VARCHAR(50) NOT NULL CHECK (dashboard_type IN ('executive', 'operational', 'clinical', 'financial', 'custom')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    layout_config JSONB NOT NULL,
    filters_config JSONB,
    refresh_settings JSONB,
    is_public BOOLEAN NOT NULL DEFAULT false,
    auto_refresh BOOLEAN NOT NULL DEFAULT true,
    refresh_interval INTEGER NOT NULL DEFAULT 300, -- seconds
    last_refreshed_at TIMESTAMPTZ,
    sharing_settings JSONB,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard Widgets Table
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN ('chart', 'kpi', 'table', 'gauge', 'heatmap', 'treemap', 'scatter', 'funnel', 'pie', 'bar', 'line', 'area', 'metric', 'alert')),
    chart_type VARCHAR(50) CHECK (chart_type IN ('line', 'bar', 'pie', 'doughnut', 'area', 'scatter', 'radar', 'polar', 'bubble', 'heatmap', 'treemap', 'funnel')),
    widget_config JSONB NOT NULL,
    data_config JSONB NOT NULL,
    chart_options JSONB,
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 4,
    height INTEGER NOT NULL DEFAULT 3,
    min_width INTEGER NOT NULL DEFAULT 1,
    min_height INTEGER NOT NULL DEFAULT 1,
    is_resizable BOOLEAN NOT NULL DEFAULT true,
    is_movable BOOLEAN NOT NULL DEFAULT true,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    filters JSONB,
    drill_down_config JSONB,
    last_updated_at TIMESTAMPTZ,
    cache_settings JSONB,
    cache_ttl INTEGER NOT NULL DEFAULT 300, -- seconds
    alert_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Reports Table
CREATE TABLE analytics_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    clinic_id UUID REFERENCES clinics(id),
    created_by UUID NOT NULL REFERENCES users(id),
    report_name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('financial', 'operational', 'clinical', 'patient', 'provider', 'appointment', 'inventory', 'custom')),
    report_format VARCHAR(50) NOT NULL CHECK (report_format IN ('pdf', 'excel', 'csv', 'json', 'html')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    frequency VARCHAR(50) NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    report_config JSONB NOT NULL,
    filters JSONB NOT NULL,
    schedule_config JSONB,
    start_date DATE,
    end_date DATE,
    scheduled_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    file_size INTEGER, -- bytes
    file_path VARCHAR(500),
    download_url VARCHAR(500),
    download_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    error_message TEXT,
    recipient_list JSONB,
    is_public BOOLEAN NOT NULL DEFAULT false,
    auto_delete BOOLEAN NOT NULL DEFAULT true,
    retention_days INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_analytics_metrics_tenant ON analytics_metrics(tenant_id);
CREATE INDEX idx_analytics_metrics_clinic ON analytics_metrics(clinic_id);
CREATE INDEX idx_analytics_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX idx_analytics_metrics_category ON analytics_metrics(metric_category);
CREATE INDEX idx_analytics_metrics_date ON analytics_metrics(metric_date);
CREATE INDEX idx_analytics_metrics_calculated ON analytics_metrics(calculated_at);

CREATE INDEX idx_analytics_dashboards_tenant ON analytics_dashboards(tenant_id);
CREATE INDEX idx_analytics_dashboards_created_by ON analytics_dashboards(created_by);
CREATE INDEX idx_analytics_dashboards_type ON analytics_dashboards(dashboard_type);
CREATE INDEX idx_analytics_dashboards_status ON analytics_dashboards(status);
CREATE INDEX idx_analytics_dashboards_public ON analytics_dashboards(is_public);

CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_widgets_position ON dashboard_widgets(position_x, position_y);
CREATE INDEX idx_dashboard_widgets_hidden ON dashboard_widgets(is_hidden);

CREATE INDEX idx_analytics_reports_tenant ON analytics_reports(tenant_id);
CREATE INDEX idx_analytics_reports_created_by ON analytics_reports(created_by);
CREATE INDEX idx_analytics_reports_type ON analytics_reports(report_type);
CREATE INDEX idx_analytics_reports_status ON analytics_reports(status);
CREATE INDEX idx_analytics_reports_frequency ON analytics_reports(frequency);
CREATE INDEX idx_analytics_reports_scheduled ON analytics_reports(scheduled_at);
CREATE INDEX idx_analytics_reports_generated ON analytics_reports(generated_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analytics_metrics_updated_at BEFORE UPDATE ON analytics_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_dashboards_updated_at BEFORE UPDATE ON analytics_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_reports_updated_at BEFORE UPDATE ON analytics_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized views for common analytics queries
CREATE MATERIALIZED VIEW appointment_analytics_summary AS
SELECT 
    DATE_TRUNC('day', start_time) as date,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
    COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_appointments,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes
FROM appointments
WHERE start_time >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE_TRUNC('day', start_time)
ORDER BY date DESC;

CREATE MATERIALIZED VIEW revenue_analytics_summary AS
SELECT 
    DATE_TRUNC('month', invoice_date) as month,
    COUNT(*) as total_invoices,
    SUM(total_amount) as total_revenue,
    SUM(amount_paid) as paid_revenue,
    SUM(amount_due) as outstanding_revenue,
    AVG(total_amount) as avg_invoice_amount
FROM invoices
WHERE invoice_date >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

CREATE MATERIALIZED VIEW provider_performance_summary AS
SELECT 
    provider_id,
    DATE_TRUNC('month', start_time) as month,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes,
    ROUND(
        (COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as completion_rate
FROM appointments
WHERE start_time >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY provider_id, DATE_TRUNC('month', start_time)
ORDER BY month DESC, completion_rate DESC;

-- Create indexes on materialized views
CREATE INDEX idx_appointment_analytics_date ON appointment_analytics_summary(date);
CREATE INDEX idx_revenue_analytics_month ON revenue_analytics_summary(month);
CREATE INDEX idx_provider_performance_month ON provider_performance_summary(month);
CREATE INDEX idx_provider_performance_provider ON provider_performance_summary(provider_id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_analytics_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY revenue_analytics_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY provider_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate growth rates
CREATE OR REPLACE FUNCTION calculate_growth_rate(current_value DECIMAL, previous_value DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF previous_value = 0 THEN
        RETURN CASE WHEN current_value > 0 THEN 100 ELSE 0 END;
    END IF;
    
    RETURN ROUND(((current_value - previous_value) / previous_value) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to get trend direction
CREATE OR REPLACE FUNCTION get_trend_direction(growth_rate DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
    IF growth_rate > 5 THEN
        RETURN 'up';
    ELSIF growth_rate < -5 THEN
        RETURN 'down';
    ELSE
        RETURN 'stable';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create views for dashboard data
CREATE VIEW dashboard_overview_metrics AS
SELECT 
    'appointments' as metric_type,
    COUNT(*) as current_value,
    LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', start_time)) as previous_value,
    calculate_growth_rate(
        COUNT(*)::DECIMAL, 
        LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', start_time))::DECIMAL
    ) as growth_rate,
    get_trend_direction(
        calculate_growth_rate(
            COUNT(*)::DECIMAL, 
            LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', start_time))::DECIMAL
        )
    ) as trend
FROM appointments
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', start_time)
ORDER BY DATE_TRUNC('day', start_time) DESC
LIMIT 1;

-- Create a function to generate daily analytics metrics
CREATE OR REPLACE FUNCTION generate_daily_analytics_metrics(p_tenant_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
    v_appointments_count INTEGER;
    v_revenue_amount DECIMAL;
    v_patients_count INTEGER;
    v_providers_count INTEGER;
    v_previous_date DATE := p_date - INTERVAL '1 day';
    v_previous_appointments INTEGER;
    v_previous_revenue DECIMAL;
BEGIN
    -- Get current day metrics
    SELECT COUNT(*) INTO v_appointments_count
    FROM appointments
    WHERE tenant_id = p_tenant_id
    AND DATE(start_time) = p_date;
    
    SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue_amount
    FROM invoices
    WHERE tenant_id = p_tenant_id
    AND DATE(invoice_date) = p_date
    AND status = 'paid';
    
    SELECT COUNT(*) INTO v_patients_count
    FROM patients
    WHERE tenant_id = p_tenant_id
    AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO v_providers_count
    FROM users
    WHERE tenant_id = p_tenant_id
    AND role IN ('dentist', 'clinic_admin');
    
    -- Get previous day metrics for comparison
    SELECT COUNT(*) INTO v_previous_appointments
    FROM appointments
    WHERE tenant_id = p_tenant_id
    AND DATE(start_time) = v_previous_date;
    
    SELECT COALESCE(SUM(total_amount), 0) INTO v_previous_revenue
    FROM invoices
    WHERE tenant_id = p_tenant_id
    AND DATE(invoice_date) = v_previous_date
    AND status = 'paid';
    
    -- Insert appointment metrics
    INSERT INTO analytics_metrics (
        tenant_id, metric_type, metric_category, metric_name, metric_description,
        metric_data, numeric_value, metric_date, calculated_at,
        growth_rate, trend_direction
    ) VALUES (
        p_tenant_id, 'appointment', 'daily', 'Daily Appointments',
        'Total appointments scheduled for the day',
        jsonb_build_object('count', v_appointments_count, 'date', p_date),
        v_appointments_count, p_date, NOW(),
        calculate_growth_rate(v_appointments_count::DECIMAL, v_previous_appointments::DECIMAL),
        CASE get_trend_direction(calculate_growth_rate(v_appointments_count::DECIMAL, v_previous_appointments::DECIMAL))
            WHEN 'up' THEN 1
            WHEN 'down' THEN -1
            ELSE 0
        END
    );
    
    -- Insert revenue metrics
    INSERT INTO analytics_metrics (
        tenant_id, metric_type, metric_category, metric_name, metric_description,
        metric_data, numeric_value, unit, metric_date, calculated_at,
        growth_rate, trend_direction
    ) VALUES (
        p_tenant_id, 'revenue', 'daily', 'Daily Revenue',
        'Total revenue collected for the day',
        jsonb_build_object('amount', v_revenue_amount, 'date', p_date),
        v_revenue_amount, 'USD', p_date, NOW(),
        calculate_growth_rate(v_revenue_amount, v_previous_revenue),
        CASE get_trend_direction(calculate_growth_rate(v_revenue_amount, v_previous_revenue))
            WHEN 'up' THEN 1
            WHEN 'down' THEN -1
            ELSE 0
        END
    );
    
    -- Insert patient metrics (no growth calculation for total patients)
    INSERT INTO analytics_metrics (
        tenant_id, metric_type, metric_category, metric_name, metric_description,
        metric_data, numeric_value, metric_date, calculated_at
    ) VALUES (
        p_tenant_id, 'patient', 'daily', 'Total Patients',
        'Total active patients in the system',
        jsonb_build_object('count', v_patients_count),
        v_patients_count, p_date, NOW()
    );
    
    -- Insert provider metrics
    INSERT INTO analytics_metrics (
        tenant_id, metric_type, metric_category, metric_name, metric_description,
        metric_data, numeric_value, metric_date, calculated_at
    ) VALUES (
        p_tenant_id, 'provider', 'daily', 'Active Providers',
        'Total active providers in the system',
        jsonb_build_object('count', v_providers_count),
        v_providers_count, p_date, NOW()
    );
    
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE analytics_metrics IS 'Stores calculated analytics metrics for dashboards and reporting';
COMMENT ON TABLE analytics_dashboards IS 'User-created analytics dashboards with widgets and configurations';
COMMENT ON TABLE dashboard_widgets IS 'Individual widgets within analytics dashboards';
COMMENT ON TABLE analytics_reports IS 'Generated analytics reports in various formats';

COMMENT ON MATERIALIZED VIEW appointment_analytics_summary IS 'Pre-calculated appointment analytics for better performance';
COMMENT ON MATERIALIZED VIEW revenue_analytics_summary IS 'Pre-calculated revenue analytics for better performance';
COMMENT ON MATERIALIZED VIEW provider_performance_summary IS 'Pre-calculated provider performance metrics';

COMMENT ON FUNCTION refresh_analytics_views() IS 'Refreshes all analytics materialized views';
COMMENT ON FUNCTION generate_daily_analytics_metrics(UUID, DATE) IS 'Generates daily analytics metrics for a tenant';
