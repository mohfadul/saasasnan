import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../tenants/tenant.guard';
import { AnalyticsService, AnalyticsFilter } from './analytics.service';
import { DashboardService, CreateDashboardDto, CreateWidgetDto } from './dashboard.service';
import { ReportsService, CreateReportDto } from './reports.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly dashboardService: DashboardService,
    private readonly reportsService: ReportsService,
  ) {}

  // Dashboard Overview
  @Get('dashboard/overview')
  async getDashboardOverview(
    @Request() req: any,
    @Query('clinic_id') clinicId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('provider_id') providerId?: string,
  ) {
    const filters: AnalyticsFilter = {
      tenant_id: req.user.tenant_id,
      clinic_id: clinicId,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
      provider_id: providerId,
    };

    return await this.analyticsService.getDashboardOverview(filters);
  }

  // Appointment Analytics
  @Get('appointments')
  async getAppointmentAnalytics(
    @Request() req: any,
    @Query('clinic_id') clinicId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    const filters: AnalyticsFilter = {
      tenant_id: req.user.tenant_id,
      clinic_id: clinicId,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
    };

    const [totalAppointments, timeSeries] = await Promise.all([
      this.analyticsService.getTotalAppointments(filters),
      this.analyticsService.getAppointmentsTimeSeries(filters, period),
    ]);

    return {
      total_appointments: totalAppointments,
      timeseries: timeSeries,
    };
  }

  // Revenue Analytics
  @Get('revenue')
  async getRevenueAnalytics(
    @Request() req: any,
    @Query('clinic_id') clinicId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ) {
    const filters: AnalyticsFilter = {
      tenant_id: req.user.tenant_id,
      clinic_id: clinicId,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
    };

    const [totalRevenue, pendingInvoices, timeSeries] = await Promise.all([
      this.analyticsService.getTotalRevenue(filters),
      this.analyticsService.getPendingInvoices(filters),
      this.analyticsService.getRevenueTimeSeries(filters, period),
    ]);

    return {
      total_revenue: totalRevenue,
      pending_invoices: pendingInvoices,
      timeseries: timeSeries,
    };
  }

  // Provider Performance
  @Get('providers/performance')
  async getProviderPerformance(
    @Request() req: any,
    @Query('clinic_id') clinicId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const filters: AnalyticsFilter = {
      tenant_id: req.user.tenant_id,
      clinic_id: clinicId,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
    };

    return await this.analyticsService.getProviderPerformance(filters);
  }

  // Patient Analytics
  @Get('patients')
  async getPatientAnalytics(
    @Request() req: any,
    @Query('clinic_id') clinicId?: string,
  ) {
    const filters: AnalyticsFilter = {
      tenant_id: req.user.tenant_id,
      clinic_id: clinicId,
    };

    const totalPatients = await this.analyticsService.getTotalPatients(filters);
    
    return {
      total_patients: totalPatients,
    };
  }

  // Clinical Analytics
  @Get('clinical')
  async getClinicalAnalytics(
    @Request() req: any,
    @Query('clinic_id') clinicId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const filters: AnalyticsFilter = {
      tenant_id: req.user.tenant_id,
      clinic_id: clinicId,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
    };

    const [clinicalNotes, treatmentPlans] = await Promise.all([
      this.analyticsService.getTotalClinicalNotes(filters),
      this.analyticsService.getActiveTreatmentPlans(filters),
    ]);

    return {
      clinical_notes: clinicalNotes,
      treatment_plans: treatmentPlans,
    };
  }

  // Dashboard Management
  @Post('dashboards')
  async createDashboard(
    @Request() req: any,
    @Body() createDashboardDto: CreateDashboardDto,
  ) {
    return await this.dashboardService.createDashboard(
      req.user.tenant_id,
      req.user.id,
      createDashboardDto,
    );
  }

  @Get('dashboards')
  async getDashboards(
    @Request() req: any,
    @Query('dashboard_type') dashboardType?: string,
    @Query('status') status?: string,
  ) {
    return await this.dashboardService.getDashboards(
      req.user.tenant_id,
      dashboardType as any,
      status as any,
    );
  }

  @Get('dashboards/:id')
  async getDashboardById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return await this.dashboardService.getDashboardById(id, req.user.tenant_id);
  }

  @Put('dashboards/:id')
  async updateDashboard(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateData: Partial<CreateDashboardDto>,
  ) {
    return await this.dashboardService.updateDashboard(id, req.user.tenant_id, updateData);
  }

  @Delete('dashboards/:id')
  async deleteDashboard(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.dashboardService.deleteDashboard(id, req.user.tenant_id);
    return { message: 'Dashboard deleted successfully' };
  }

  @Post('dashboards/:id/refresh')
  async refreshDashboard(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return await this.dashboardService.refreshDashboardData(id, req.user.tenant_id);
  }

  // Widget Management
  @Post('dashboards/:dashboardId/widgets')
  async addWidget(
    @Param('dashboardId') dashboardId: string,
    @Request() req: any,
    @Body() createWidgetDto: CreateWidgetDto,
  ) {
    return await this.dashboardService.addWidget(dashboardId, req.user.tenant_id, createWidgetDto);
  }

  @Put('widgets/:widgetId')
  async updateWidget(
    @Param('widgetId') widgetId: string,
    @Request() req: any,
    @Body() updateData: Partial<CreateWidgetDto>,
  ) {
    return await this.dashboardService.updateWidget(widgetId, req.user.tenant_id, updateData);
  }

  @Delete('widgets/:widgetId')
  async deleteWidget(
    @Param('widgetId') widgetId: string,
    @Request() req: any,
  ) {
    await this.dashboardService.deleteWidget(widgetId, req.user.tenant_id);
    return { message: 'Widget deleted successfully' };
  }

  // Dashboard Templates
  @Post('dashboards/templates/:templateType')
  async createFromTemplate(
    @Param('templateType') templateType: string,
    @Request() req: any,
    @Body('name') name?: string,
  ) {
    return await this.dashboardService.createFromTemplate(
      req.user.tenant_id,
      req.user.id,
      templateType as any,
      name,
    );
  }

  // Reports Management
  @Post('reports')
  async createReport(
    @Request() req: any,
    @Body() createReportDto: CreateReportDto,
  ) {
    return await this.reportsService.createReport(
      req.user.tenant_id,
      req.user.id,
      createReportDto,
    );
  }

  @Get('reports')
  async getReports(
    @Request() req: any,
    @Query('report_type') reportType?: string,
    @Query('status') status?: string,
  ) {
    return await this.reportsService.getReports(
      req.user.tenant_id,
      reportType as any,
      status as any,
    );
  }

  @Get('reports/:id')
  async getReportById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return await this.reportsService.getReportById(id, req.user.tenant_id);
  }

  @Delete('reports/:id')
  async deleteReport(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.reportsService.deleteReport(id, req.user.tenant_id);
    return { message: 'Report deleted successfully' };
  }

  @Get('reports/:id/download')
  async downloadReport(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const fileBuffer = await this.reportsService.downloadReport(id, req.user.tenant_id);
      const report = await this.reportsService.getReportById(id, req.user.tenant_id);
      
      res.set({
        'Content-Type': `application/${report.report_format}`,
        'Content-Disposition': `attachment; filename="${report.report_name}.${report.report_format}"`,
        'Content-Length': fileBuffer.length.toString(),
      });

      res.send(fileBuffer);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Report not found or not ready' });
    }
  }

  // Real-time Analytics
  @Get('realtime')
  async getRealtimeAnalytics(@Request() req: any) {
    const filters: AnalyticsFilter = {
      tenant_id: req.user.tenant_id,
    };

    const [
      todayAppointments,
      todayRevenue,
      activeAppointments,
      pendingTasks,
    ] = await Promise.all([
      this.getTodayAppointments(filters),
      this.getTodayRevenue(filters),
      this.getActiveAppointments(filters),
      this.getPendingTasks(filters),
    ]);

    return {
      today_appointments: todayAppointments,
      today_revenue: todayRevenue,
      active_appointments: activeAppointments,
      pending_tasks: pendingTasks,
      last_updated: new Date(),
    };
  }

  // Custom Analytics Query
  @Post('query')
  async executeCustomQuery(
    @Request() req: any,
    @Body() queryConfig: {
      type: string;
      filters: Record<string, any>;
      aggregations?: string[];
      groupBy?: string[];
      orderBy?: string;
      limit?: number;
    },
  ) {
    const filters: AnalyticsFilter = {
      tenant_id: req.user.tenant_id,
      ...queryConfig.filters,
    };

    // Execute custom analytics query based on type
    switch (queryConfig.type) {
      case 'appointment_analytics':
        return await this.analyticsService.getAppointmentsTimeSeries(
          filters,
          queryConfig.filters.period || 'daily'
        );
      
      case 'revenue_analytics':
        return await this.analyticsService.getRevenueTimeSeries(
          filters,
          queryConfig.filters.period || 'monthly'
        );
      
      case 'provider_performance':
        return await this.analyticsService.getProviderPerformance(filters);
      
      default:
        return { error: 'Invalid query type' };
    }
  }

  // Helper methods for real-time analytics
  private async getTodayAppointments(filters: AnalyticsFilter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filtersWithToday = {
      ...filters,
      start_date: today,
      end_date: tomorrow,
    };

    const totalAppointments = await this.analyticsService.getTotalAppointments(filtersWithToday);
    const completedAppointments = await this.analyticsService.getCompletedAppointments(filtersWithToday);

    return {
      total: totalAppointments.value,
      completed: completedAppointments.value,
      pending: totalAppointments.value - completedAppointments.value,
    };
  }

  private async getTodayRevenue(filters: AnalyticsFilter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filtersWithToday = {
      ...filters,
      start_date: today,
      end_date: tomorrow,
    };

    const todayRevenue = await this.analyticsService.getTotalRevenue(filtersWithToday);
    
    return {
      amount: todayRevenue.value,
      currency: 'USD',
    };
  }

  private async getActiveAppointments(filters: AnalyticsFilter) {
    // Implementation would query currently active appointments
    return {
      count: 3,
      appointments: [
        { id: '1', patient: 'John Doe', provider: 'Dr. Smith', start_time: new Date() },
        { id: '2', patient: 'Jane Smith', provider: 'Dr. Johnson', start_time: new Date() },
      ],
    };
  }

  private async getPendingTasks(filters: AnalyticsFilter) {
    // Implementation would query pending tasks
    return {
      count: 5,
      tasks: [
        { type: 'follow_up', count: 2 },
        { type: 'treatment_plan_review', count: 3 },
      ],
    };
  }
}
