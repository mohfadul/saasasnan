import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsDashboard, DashboardType, DashboardStatus } from './entities/analytics-dashboard.entity';
import { DashboardWidget, WidgetType, ChartType } from './entities/dashboard-widget.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilter } from './analytics.service';

export interface CreateDashboardDto {
  name: string;
  description?: string;
  dashboard_type: DashboardType;
  layout_config?: Record<string, any>;
  filters_config?: Record<string, any>;
  refresh_settings?: Record<string, any>;
  is_public?: boolean;
  auto_refresh?: boolean;
  refresh_interval?: number;
}

export interface CreateWidgetDto {
  title: string;
  description?: string;
  widget_type: WidgetType;
  chart_type?: ChartType;
  widget_config: Record<string, any>;
  data_config: Record<string, any>;
  chart_options?: Record<string, any>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  filters?: Record<string, any>;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(AnalyticsDashboard)
    private dashboardRepository: Repository<AnalyticsDashboard>,
    @InjectRepository(DashboardWidget)
    private widgetRepository: Repository<DashboardWidget>,
    private analyticsService: AnalyticsService,
  ) {}

  // Dashboard Management
  async createDashboard(
    tenantId: string,
    userId: string,
    createDashboardDto: CreateDashboardDto,
  ): Promise<AnalyticsDashboard> {
    const dashboard = this.dashboardRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      ...createDashboardDto,
    });

    const savedDashboard = await this.dashboardRepository.save(dashboard);

    // Create default widgets based on dashboard type
    await this.createDefaultWidgets(savedDashboard);

    return savedDashboard;
  }

  async getDashboards(
    tenantId: string,
    dashboardType?: DashboardType,
    status?: DashboardStatus,
  ): Promise<AnalyticsDashboard[]> {
    const query = this.dashboardRepository
      .createQueryBuilder('dashboard')
      .leftJoinAndSelect('dashboard.widgets', 'widget')
      .where('dashboard.tenant_id = :tenant_id', { tenant_id: tenantId });

    if (dashboardType) {
      query.andWhere('dashboard.dashboard_type = :dashboard_type', { dashboard_type: dashboardType });
    }

    if (status) {
      query.andWhere('dashboard.status = :status', { status: status });
    }

    return await query
      .orderBy('dashboard.created_at', 'DESC')
      .getMany();
  }

  async getDashboardById(id: string, tenantId: string): Promise<AnalyticsDashboard> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['widgets'],
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    return dashboard;
  }

  async updateDashboard(
    id: string,
    tenantId: string,
    updateData: Partial<CreateDashboardDto>,
  ): Promise<AnalyticsDashboard> {
    const dashboard = await this.getDashboardById(id, tenantId);
    
    Object.assign(dashboard, updateData);
    dashboard.updated_at = new Date();

    return await this.dashboardRepository.save(dashboard);
  }

  async deleteDashboard(id: string, tenantId: string): Promise<void> {
    const dashboard = await this.getDashboardById(id, tenantId);
    await this.dashboardRepository.remove(dashboard);
  }

  // Widget Management
  async addWidget(
    dashboardId: string,
    tenantId: string,
    createWidgetDto: CreateWidgetDto,
  ): Promise<DashboardWidget> {
    const dashboard = await this.getDashboardById(dashboardId, tenantId);

    const widget = this.widgetRepository.create({
      dashboard_id: dashboardId,
      ...createWidgetDto,
    });

    return await this.widgetRepository.save(widget);
  }

  async updateWidget(
    widgetId: string,
    tenantId: string,
    updateData: Partial<CreateWidgetDto>,
  ): Promise<DashboardWidget> {
    const widget = await this.getWidgetById(widgetId, tenantId);
    
    Object.assign(widget, updateData);
    widget.last_updated_at = new Date();

    return await this.widgetRepository.save(widget);
  }

  async deleteWidget(widgetId: string, tenantId: string): Promise<void> {
    const widget = await this.getWidgetById(widgetId, tenantId);
    await this.widgetRepository.remove(widget);
  }

  async getWidgetById(widgetId: string, tenantId: string): Promise<DashboardWidget> {
    const widget = await this.widgetRepository
      .createQueryBuilder('widget')
      .leftJoin('widget.dashboard', 'dashboard')
      .where('widget.id = :widgetId', { widgetId })
      .andWhere('dashboard.tenant_id = :tenantId', { tenantId })
      .getOne();

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    return widget;
  }

  // Dashboard Data Refresh
  async refreshDashboardData(dashboardId: string, tenantId: string): Promise<AnalyticsDashboard> {
    const dashboard = await this.getDashboardById(dashboardId, tenantId);

    // Refresh all widgets with fresh data
    for (const widget of dashboard.widgets) {
      await this.refreshWidgetData(widget);
    }

    dashboard.last_refreshed_at = new Date();
    return await this.dashboardRepository.save(dashboard);
  }

  private async refreshWidgetData(widget: DashboardWidget): Promise<void> {
    try {
      const filters: AnalyticsFilter = {
        tenant_id: widget.dashboard.tenant_id,
        ...widget.filters,
      };

      let data;
      switch (widget.data_config.type) {
        case 'overview_metrics':
          data = await this.analyticsService.getDashboardOverview(filters);
          break;
        case 'appointments_timeseries':
          data = await this.analyticsService.getAppointmentsTimeSeries(
            filters,
            widget.data_config.period || 'daily'
          );
          break;
        case 'revenue_timeseries':
          data = await this.analyticsService.getRevenueTimeSeries(
            filters,
            widget.data_config.period || 'daily'
          );
          break;
        case 'provider_performance':
          data = await this.analyticsService.getProviderPerformance(filters);
          break;
        default:
          data = {};
      }

      // Update widget with new data
      widget.widget_config.data = data;
      widget.last_updated_at = new Date();
      await this.widgetRepository.save(widget);
    } catch (error) {
      this.logger.error(`Error refreshing widget ${widget.id}:`, error);
    }
  }

  // Default Widget Creation
  private async createDefaultWidgets(dashboard: AnalyticsDashboard): Promise<void> {
    const defaultWidgets = this.getDefaultWidgetsForType(dashboard.dashboard_type);

    for (const widgetConfig of defaultWidgets) {
      const widget = this.widgetRepository.create({
        dashboard_id: dashboard.id,
        ...widgetConfig,
      });
      await this.widgetRepository.save(widget);
    }
  }

  private getDefaultWidgetsForType(dashboardType: DashboardType): CreateWidgetDto[] {
    const baseWidgets = [
      {
        title: 'Total Appointments',
        widget_type: WidgetType.KPI,
        widget_config: { data: {} },
        data_config: { type: 'overview_metrics', metric: 'total_appointments' },
        position_x: 0,
        position_y: 0,
        width: 3,
        height: 2,
      },
      {
        title: 'Total Revenue',
        widget_type: WidgetType.KPI,
        widget_config: { data: {} },
        data_config: { type: 'overview_metrics', metric: 'total_revenue' },
        position_x: 3,
        position_y: 0,
        width: 3,
        height: 2,
      },
      {
        title: 'Active Patients',
        widget_type: WidgetType.KPI,
        widget_config: { data: {} },
        data_config: { type: 'overview_metrics', metric: 'total_patients' },
        position_x: 6,
        position_y: 0,
        width: 3,
        height: 2,
      },
      {
        title: 'Appointments Trend',
        widget_type: WidgetType.CHART,
        chart_type: ChartType.LINE,
        widget_config: { data: {} },
        data_config: { type: 'appointments_timeseries', period: 'daily' },
        chart_options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true },
          },
        },
        position_x: 0,
        position_y: 2,
        width: 6,
        height: 4,
      },
      {
        title: 'Revenue Trend',
        widget_type: WidgetType.CHART,
        chart_type: ChartType.BAR,
        widget_config: { data: {} },
        data_config: { type: 'revenue_timeseries', period: 'weekly' },
        chart_options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true },
          },
        },
        position_x: 6,
        position_y: 2,
        width: 3,
        height: 4,
      },
    ];

    switch (dashboardType) {
      case DashboardType.EXECUTIVE:
        return [
          ...baseWidgets,
          {
            title: 'Provider Performance',
            widget_type: WidgetType.TABLE,
            widget_config: { data: {} },
            data_config: { type: 'provider_performance' },
            position_x: 0,
            position_y: 6,
            width: 9,
            height: 4,
          },
        ];

      case DashboardType.OPERATIONAL:
        return [
          ...baseWidgets.slice(0, 3), // Only KPIs
          {
            title: 'Appointment Status Distribution',
            widget_type: WidgetType.CHART,
            chart_type: ChartType.PIE,
            widget_config: { data: {} },
            data_config: { type: 'appointment_status_distribution' },
            position_x: 0,
            position_y: 2,
            width: 4,
            height: 4,
          },
          {
            title: 'Daily Appointments',
            widget_type: WidgetType.CHART,
            chart_type: ChartType.LINE,
            widget_config: { data: {} },
            data_config: { type: 'appointments_timeseries', period: 'daily' },
            position_x: 4,
        position_y: 2,
            width: 5,
            height: 4,
          },
        ];

      case DashboardType.FINANCIAL:
        return [
          {
            title: 'Total Revenue',
            widget_type: WidgetType.KPI,
            widget_config: { data: {} },
            data_config: { type: 'overview_metrics', metric: 'total_revenue' },
            position_x: 0,
            position_y: 0,
            width: 3,
            height: 2,
          },
          {
            title: 'Pending Invoices',
            widget_type: WidgetType.KPI,
            widget_config: { data: {} },
            data_config: { type: 'overview_metrics', metric: 'pending_invoices' },
            position_x: 3,
            position_y: 0,
            width: 3,
            height: 2,
          },
          {
            title: 'Revenue Trend',
            widget_type: WidgetType.CHART,
            chart_type: ChartType.BAR,
            widget_config: { data: {} },
            data_config: { type: 'revenue_timeseries', period: 'monthly' },
            position_x: 0,
            position_y: 2,
            width: 6,
            height: 4,
          },
        ];

      case DashboardType.CLINICAL:
        return [
          {
            title: 'Clinical Notes',
            widget_type: WidgetType.KPI,
            widget_config: { data: {} },
            data_config: { type: 'overview_metrics', metric: 'total_clinical_notes' },
            position_x: 0,
            position_y: 0,
            width: 3,
            height: 2,
          },
          {
            title: 'Active Treatment Plans',
            widget_type: WidgetType.KPI,
            widget_config: { data: {} },
            data_config: { type: 'overview_metrics', metric: 'active_treatment_plans' },
            position_x: 3,
            position_y: 0,
            width: 3,
            height: 2,
          },
        ];

      default:
        return baseWidgets;
    }
  }

  // Dashboard Templates
  async createFromTemplate(
    tenantId: string,
    userId: string,
    templateType: DashboardType,
    name?: string,
  ): Promise<AnalyticsDashboard> {
    const dashboardName = name || `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Dashboard`;

    const dashboard = await this.createDashboard(tenantId, userId, {
      name: dashboardName,
      dashboard_type: templateType,
      description: `Pre-configured ${templateType} dashboard`,
    });

    return dashboard;
  }

  // Dashboard Sharing
  async shareDashboard(
    dashboardId: string,
    tenantId: string,
    sharingSettings: Record<string, any>,
  ): Promise<AnalyticsDashboard> {
    const dashboard = await this.getDashboardById(dashboardId, tenantId);
    
    dashboard.sharing_settings = sharingSettings;
    dashboard.is_public = sharingSettings.is_public || false;

    return await this.dashboardRepository.save(dashboard);
  }
}
