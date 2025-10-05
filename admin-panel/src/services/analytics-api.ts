import { apiClient } from './api';

export interface AnalyticsFilter {
  clinic_id?: string;
  start_date?: string;
  end_date?: string;
  provider_id?: string;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface MetricResult {
  metric_name: string;
  value: number;
  previous_value?: number;
  growth_rate?: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
  breakdown?: Record<string, any>;
}

export interface DashboardOverview {
  total_appointments: MetricResult;
  total_revenue: MetricResult;
  total_patients: MetricResult;
  active_providers: MetricResult;
  completed_appointments: MetricResult;
  pending_invoices: MetricResult;
  total_clinical_notes: MetricResult;
  active_treatment_plans: MetricResult;
}

export interface TimeSeriesData {
  period: string;
  total: number;
  completed: number;
  completion_rate: number;
}

export interface RevenueTimeSeries {
  period: string;
  total_revenue: number;
  invoice_count: number;
}

export interface ProviderPerformance {
  provider_id: string;
  provider_email: string;
  total_appointments: number;
  completed_appointments: number;
  completion_rate: number;
  avg_duration: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  dashboard_type: 'executive' | 'operational' | 'clinical' | 'financial' | 'custom';
  status: 'active' | 'draft' | 'archived';
  layout_config: Record<string, any>;
  widgets: Widget[];
  created_at: string;
  updated_at: string;
}

export interface Widget {
  id: string;
  title: string;
  description?: string;
  widget_type: 'chart' | 'kpi' | 'table' | 'gauge' | 'heatmap' | 'treemap' | 'scatter' | 'funnel' | 'pie' | 'bar' | 'line' | 'area' | 'metric' | 'alert';
  chart_type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar' | 'polar' | 'bubble' | 'heatmap' | 'treemap' | 'funnel';
  widget_config: Record<string, any>;
  data_config: Record<string, any>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface Report {
  id: string;
  report_name: string;
  description?: string;
  report_type: 'financial' | 'operational' | 'clinical' | 'patient' | 'provider' | 'appointment' | 'inventory' | 'custom';
  report_format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  created_at: string;
  generated_at?: string;
  download_url?: string;
  file_size?: number;
}

class AnalyticsAPI {
  // Dashboard Overview
  async getDashboardOverview(filters: AnalyticsFilter = {}): Promise<DashboardOverview> {
    const response = await apiClient.get('/analytics/dashboard/overview', {
      params: filters,
    });
    return response.data;
  }

  // Appointment Analytics
  async getAppointmentAnalytics(filters: AnalyticsFilter = {}): Promise<{
    total_appointments: MetricResult;
    timeseries: TimeSeriesData[];
  }> {
    const response = await apiClient.get('/analytics/appointments', {
      params: filters,
    });
    return response.data;
  }

  // Revenue Analytics
  async getRevenueAnalytics(filters: AnalyticsFilter = {}): Promise<{
    total_revenue: MetricResult;
    pending_invoices: MetricResult;
    timeseries: RevenueTimeSeries[];
  }> {
    const response = await apiClient.get('/analytics/revenue', {
      params: filters,
    });
    return response.data;
  }

  // Provider Performance
  async getProviderPerformance(filters: AnalyticsFilter = {}): Promise<ProviderPerformance[]> {
    const response = await apiClient.get('/analytics/providers/performance', {
      params: filters,
    });
    return response.data;
  }

  // Patient Analytics
  async getPatientAnalytics(filters: AnalyticsFilter = {}): Promise<{
    total_patients: MetricResult;
  }> {
    const response = await apiClient.get('/analytics/patients', {
      params: filters,
    });
    return response.data;
  }

  // Clinical Analytics
  async getClinicalAnalytics(filters: AnalyticsFilter = {}): Promise<{
    clinical_notes: MetricResult;
    treatment_plans: MetricResult;
  }> {
    const response = await apiClient.get('/analytics/clinical', {
      params: filters,
    });
    return response.data;
  }

  // Real-time Analytics
  async getRealtimeAnalytics(): Promise<{
    today_appointments: {
      total: number;
      completed: number;
      pending: number;
    };
    today_revenue: {
      amount: number;
      currency: string;
    };
    active_appointments: {
      count: number;
      appointments: any[];
    };
    pending_tasks: {
      count: number;
      tasks: any[];
    };
    last_updated: string;
  }> {
    const response = await apiClient.get('/analytics/realtime');
    return response.data;
  }

  // Custom Query
  async executeCustomQuery(queryConfig: {
    type: string;
    filters: Record<string, any>;
    aggregations?: string[];
    groupBy?: string[];
    orderBy?: string;
    limit?: number;
  }): Promise<any> {
    const response = await apiClient.post('/analytics/query', queryConfig);
    return response.data;
  }

  // Dashboard Management
  async createDashboard(dashboardData: {
    name: string;
    description?: string;
    dashboard_type: 'executive' | 'operational' | 'clinical' | 'financial' | 'custom';
    layout_config?: Record<string, any>;
    filters_config?: Record<string, any>;
    refresh_settings?: Record<string, any>;
    is_public?: boolean;
    auto_refresh?: boolean;
    refresh_interval?: number;
  }): Promise<Dashboard> {
    const response = await apiClient.post('/analytics/dashboards', dashboardData);
    return response.data;
  }

  async getDashboards(filters: {
    dashboard_type?: string;
    status?: string;
  } = {}): Promise<Dashboard[]> {
    const response = await apiClient.get('/analytics/dashboards', {
      params: filters,
    });
    return response.data;
  }

  async getDashboardById(id: string): Promise<Dashboard> {
    const response = await apiClient.get(`/analytics/dashboards/${id}`);
    return response.data;
  }

  async updateDashboard(id: string, updateData: Partial<Dashboard>): Promise<Dashboard> {
    const response = await apiClient.put(`/analytics/dashboards/${id}`, updateData);
    return response.data;
  }

  async deleteDashboard(id: string): Promise<void> {
    await apiClient.delete(`/analytics/dashboards/${id}`);
  }

  async refreshDashboard(id: string): Promise<Dashboard> {
    const response = await apiClient.post(`/analytics/dashboards/${id}/refresh`);
    return response.data;
  }

  async createFromTemplate(templateType: string, name?: string): Promise<Dashboard> {
    const response = await apiClient.post(`/analytics/dashboards/templates/${templateType}`, {
      name,
    });
    return response.data;
  }

  // Widget Management
  async addWidget(dashboardId: string, widgetData: {
    title: string;
    description?: string;
    widget_type: Widget['widget_type'];
    chart_type?: Widget['chart_type'];
    widget_config: Record<string, any>;
    data_config: Record<string, any>;
    chart_options?: Record<string, any>;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    filters?: Record<string, any>;
  }): Promise<Widget> {
    const response = await apiClient.post(`/analytics/dashboards/${dashboardId}/widgets`, widgetData);
    return response.data;
  }

  async updateWidget(widgetId: string, updateData: Partial<Widget>): Promise<Widget> {
    const response = await apiClient.put(`/analytics/widgets/${widgetId}`, updateData);
    return response.data;
  }

  async deleteWidget(widgetId: string): Promise<void> {
    await apiClient.delete(`/analytics/widgets/${widgetId}`);
  }

  // Reports Management
  async createReport(reportData: {
    report_name: string;
    description?: string;
    report_type: Report['report_type'];
    report_format: Report['report_format'];
    frequency?: Report['frequency'];
    report_config: Record<string, any>;
    filters: Record<string, any>;
    schedule_config?: Record<string, any>;
    start_date?: string;
    end_date?: string;
    recipient_list?: Record<string, any>;
    is_public?: boolean;
  }): Promise<Report> {
    const response = await apiClient.post('/analytics/reports', reportData);
    return response.data;
  }

  async getReports(filters: {
    report_type?: string;
    status?: string;
  } = {}): Promise<Report[]> {
    const response = await apiClient.get('/analytics/reports', {
      params: filters,
    });
    return response.data;
  }

  async getReportById(id: string): Promise<Report> {
    const response = await apiClient.get(`/analytics/reports/${id}`);
    return response.data;
  }

  async deleteReport(id: string): Promise<void> {
    await apiClient.delete(`/analytics/reports/${id}`);
  }

  async downloadReport(id: string): Promise<Blob> {
    const response = await apiClient.get(`/analytics/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  }

  getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const analyticsAPI = new AnalyticsAPI();
export default analyticsAPI;
