import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsReport, ReportType, ReportFormat, ReportStatus, ReportFrequency } from './entities/analytics-report.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilter } from './analytics.service';

export interface CreateReportDto {
  report_name: string;
  description?: string;
  report_type: ReportType;
  report_format: ReportFormat;
  frequency?: ReportFrequency;
  report_config: Record<string, any>;
  filters: Record<string, any>;
  schedule_config?: Record<string, any>;
  start_date?: Date;
  end_date?: Date;
  recipient_list?: Record<string, any>;
  is_public?: boolean;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(AnalyticsReport)
    private reportRepository: Repository<AnalyticsReport>,
    private analyticsService: AnalyticsService,
  ) {}

  // Report Generation
  async createReport(
    tenantId: string,
    userId: string,
    createReportDto: CreateReportDto,
  ): Promise<AnalyticsReport> {
    const report = this.reportRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      ...createReportDto,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(report);

    // Generate report asynchronously
    this.generateReport(savedReport.id).catch(error => {
      this.logger.error(`Error generating report ${savedReport.id}:`, error);
    });

    return savedReport;
  }

  async generateReport(reportId: string): Promise<AnalyticsReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    try {
      // Update status to processing
      report.status = ReportStatus.PROCESSING;
      report.generated_at = new Date();
      await this.reportRepository.save(report);

      // Generate report data based on type
      const reportData = await this.generateReportData(report);

      // Convert to requested format
      const formattedData = await this.formatReportData(reportData, report.report_format);

      // Save report file (in production, this would be saved to cloud storage)
      const filePath = await this.saveReportFile(report, formattedData);

      // Update report with completion details
      report.status = ReportStatus.COMPLETED;
      report.completed_at = new Date();
      report.file_path = filePath;
      report.download_url = `/api/analytics/reports/${reportId}/download`;
      report.file_size = formattedData.length;

      await this.reportRepository.save(report);

      // Send to recipients if configured
      if (report.recipient_list) {
        await this.sendReportToRecipients(report);
      }

      return report;
    } catch (error) {
      this.logger.error(`Error generating report ${reportId}:`, error);
      
      report.status = ReportStatus.FAILED;
      report.error_message = error.message;
      await this.reportRepository.save(report);

      throw error;
    }
  }

  private async generateReportData(report: AnalyticsReport): Promise<any> {
    const filters: AnalyticsFilter = {
      tenant_id: report.tenant_id,
      ...report.filters,
    };

    switch (report.report_type) {
      case ReportType.FINANCIAL:
        return await this.generateFinancialReport(filters, report);
      
      case ReportType.OPERATIONAL:
        return await this.generateOperationalReport(filters, report);
      
      case ReportType.CLINICAL:
        return await this.generateClinicalReport(filters, report);
      
      case ReportType.PATIENT:
        return await this.generatePatientReport(filters, report);
      
      case ReportType.PROVIDER:
        return await this.generateProviderReport(filters, report);
      
      case ReportType.APPOINTMENT:
        return await this.generateAppointmentReport(filters, report);
      
      case ReportType.INVENTORY:
        return await this.generateInventoryReport(filters, report);
      
      default:
        return await this.generateCustomReport(filters, report);
    }
  }

  private async generateFinancialReport(filters: AnalyticsFilter, report: AnalyticsReport): Promise<any> {
    const [
      totalRevenue,
      pendingInvoices,
      revenueTimeSeries,
      paymentMethods,
    ] = await Promise.all([
      this.analyticsService.getTotalRevenue(filters),
      this.analyticsService.getPendingInvoices(filters),
      this.analyticsService.getRevenueTimeSeries(filters, 'monthly'),
      this.getPaymentMethodsBreakdown(filters),
    ]);

    return {
      summary: {
        total_revenue: totalRevenue,
        pending_invoices: pendingInvoices,
        net_revenue: totalRevenue.value - pendingInvoices.value,
      },
      trends: {
        revenue_timeseries: revenueTimeSeries,
      },
      breakdowns: {
        payment_methods: paymentMethods,
      },
      generated_at: new Date(),
      period: {
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
    };
  }

  private async generateOperationalReport(filters: AnalyticsFilter, report: AnalyticsReport): Promise<any> {
    const [
      totalAppointments,
      completedAppointments,
      appointmentsTimeSeries,
      providerPerformance,
    ] = await Promise.all([
      this.analyticsService.getTotalAppointments(filters),
      this.analyticsService.getCompletedAppointments(filters),
      this.analyticsService.getAppointmentsTimeSeries(filters, 'daily'),
      this.analyticsService.getProviderPerformance(filters),
    ]);

    return {
      summary: {
        total_appointments: totalAppointments,
        completed_appointments: completedAppointments,
        completion_rate: (completedAppointments.value / totalAppointments.value) * 100,
      },
      trends: {
        appointments_timeseries: appointmentsTimeSeries,
      },
      performance: {
        provider_performance: providerPerformance,
      },
      generated_at: new Date(),
      period: {
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
    };
  }

  private async generateClinicalReport(filters: AnalyticsFilter, report: AnalyticsReport): Promise<any> {
    const [
      totalClinicalNotes,
      activeTreatmentPlans,
      clinicalNotesByType,
      treatmentPlanStatus,
    ] = await Promise.all([
      this.analyticsService.getTotalClinicalNotes(filters),
      this.analyticsService.getActiveTreatmentPlans(filters),
      this.getClinicalNotesByType(filters),
      this.getTreatmentPlanStatus(filters),
    ]);

    return {
      summary: {
        total_clinical_notes: totalClinicalNotes,
        active_treatment_plans: activeTreatmentPlans,
      },
      breakdowns: {
        clinical_notes_by_type: clinicalNotesByType,
        treatment_plan_status: treatmentPlanStatus,
      },
      generated_at: new Date(),
      period: {
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
    };
  }

  private async generatePatientReport(filters: AnalyticsFilter, report: AnalyticsReport): Promise<any> {
    const [
      totalPatients,
      newPatients,
      patientDemographics,
      patientEngagement,
    ] = await Promise.all([
      this.analyticsService.getTotalPatients(filters),
      this.getNewPatients(filters),
      this.getPatientDemographics(filters),
      this.getPatientEngagement(filters),
    ]);

    return {
      summary: {
        total_patients: totalPatients,
        new_patients: newPatients,
      },
      demographics: patientDemographics,
      engagement: patientEngagement,
      generated_at: new Date(),
      period: {
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
    };
  }

  private async generateProviderReport(filters: AnalyticsFilter, report: AnalyticsReport): Promise<any> {
    const [
      activeProviders,
      providerPerformance,
      providerUtilization,
      providerRevenue,
    ] = await Promise.all([
      this.analyticsService.getActiveProviders(filters),
      this.analyticsService.getProviderPerformance(filters),
      this.getProviderUtilization(filters),
      this.getProviderRevenue(filters),
    ]);

    return {
      summary: {
        active_providers: activeProviders,
      },
      performance: providerPerformance,
      utilization: providerUtilization,
      revenue: providerRevenue,
      generated_at: new Date(),
      period: {
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
    };
  }

  private async generateAppointmentReport(filters: AnalyticsFilter, report: AnalyticsReport): Promise<any> {
    const [
      totalAppointments,
      appointmentsByStatus,
      appointmentsByType,
      appointmentsTimeSeries,
      noShowRate,
    ] = await Promise.all([
      this.analyticsService.getTotalAppointments(filters),
      this.getAppointmentsByStatus(filters),
      this.getAppointmentsByType(filters),
      this.analyticsService.getAppointmentsTimeSeries(filters, 'daily'),
      this.getNoShowRate(filters),
    ]);

    return {
      summary: {
        total_appointments: totalAppointments,
        no_show_rate: noShowRate,
      },
      breakdowns: {
        by_status: appointmentsByStatus,
        by_type: appointmentsByType,
      },
      trends: {
        timeseries: appointmentsTimeSeries,
      },
      generated_at: new Date(),
      period: {
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
    };
  }

  private async generateInventoryReport(filters: AnalyticsFilter, report: AnalyticsReport): Promise<any> {
    // This would integrate with the inventory service
    return {
      summary: {
        total_products: 0,
        low_stock_items: 0,
        total_value: 0,
      },
      generated_at: new Date(),
      period: {
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
    };
  }

  private async generateCustomReport(filters: AnalyticsFilter, report: AnalyticsReport): Promise<any> {
    // Custom report generation based on report_config
    return {
      custom_data: report.report_config,
      generated_at: new Date(),
      period: {
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
    };
  }

  // Helper methods for specific data aggregations
  private async getPaymentMethodsBreakdown(filters: AnalyticsFilter): Promise<any[]> {
    // Implementation would query payment data
    return [
      { method: 'card', count: 150, amount: 15000 },
      { method: 'cash', count: 50, amount: 5000 },
      { method: 'insurance', count: 100, amount: 10000 },
    ];
  }

  private async getClinicalNotesByType(filters: AnalyticsFilter): Promise<any[]> {
    // Implementation would query clinical notes by type
    return [
      { type: 'consultation', count: 120 },
      { type: 'examination', count: 200 },
      { type: 'treatment', count: 80 },
    ];
  }

  private async getTreatmentPlanStatus(filters: AnalyticsFilter): Promise<any[]> {
    // Implementation would query treatment plan status
    return [
      { status: 'active', count: 45 },
      { status: 'completed', count: 120 },
      { status: 'cancelled', count: 15 },
    ];
  }

  private async getNewPatients(filters: AnalyticsFilter): Promise<MetricResult> {
    // Implementation would query new patient registrations
    return {
      metric_name: 'New Patients',
      value: 25,
      trend: 'stable',
    };
  }

  private async getPatientDemographics(filters: AnalyticsFilter): Promise<any> {
    // Implementation would query patient demographic data
    return {
      age_groups: [
        { range: '18-30', count: 150 },
        { range: '31-50', count: 200 },
        { range: '51-70', count: 100 },
      ],
      gender_distribution: [
        { gender: 'male', count: 200 },
        { gender: 'female', count: 250 },
      ],
    };
  }

  private async getPatientEngagement(filters: AnalyticsFilter): Promise<any> {
    // Implementation would query patient engagement metrics
    return {
      avg_appointments_per_patient: 3.5,
      repeat_patient_rate: 0.75,
      patient_satisfaction_score: 4.2,
    };
  }

  private async getProviderUtilization(filters: AnalyticsFilter): Promise<any[]> {
    // Implementation would query provider utilization data
    return [
      { provider_id: '1', utilization_rate: 0.85 },
      { provider_id: '2', utilization_rate: 0.92 },
    ];
  }

  private async getProviderRevenue(filters: AnalyticsFilter): Promise<any[]> {
    // Implementation would query provider revenue data
    return [
      { provider_id: '1', revenue: 25000 },
      { provider_id: '2', revenue: 30000 },
    ];
  }

  private async getAppointmentsByStatus(filters: AnalyticsFilter): Promise<any[]> {
    // Implementation would query appointments by status
    return [
      { status: 'completed', count: 400 },
      { status: 'cancelled', count: 50 },
      { status: 'no_show', count: 25 },
    ];
  }

  private async getAppointmentsByType(filters: AnalyticsFilter): Promise<any[]> {
    // Implementation would query appointments by type
    return [
      { type: 'consultation', count: 150 },
      { type: 'cleaning', count: 200 },
      { type: 'filling', count: 75 },
    ];
  }

  private async getNoShowRate(filters: AnalyticsFilter): Promise<MetricResult> {
    // Implementation would calculate no-show rate
    return {
      metric_name: 'No-Show Rate',
      value: 5.2,
      unit: '%',
      trend: 'stable',
    };
  }

  // Report Formatting
  private async formatReportData(data: any, format: ReportFormat): Promise<any> {
    switch (format) {
      case ReportFormat.JSON:
        return JSON.stringify(data, null, 2);
      
      case ReportFormat.CSV:
        return this.convertToCSV(data);
      
      case ReportFormat.HTML:
        return this.convertToHTML(data);
      
      case ReportFormat.PDF:
        return await this.convertToPDF(data);
      
      case ReportFormat.EXCEL:
        return await this.convertToExcel(data);
      
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private convertToCSV(data: any): string {
    // Implementation for CSV conversion
    return 'CSV data would be generated here';
  }

  private convertToHTML(data: any): string {
    // Implementation for HTML conversion
    return `
      <html>
        <head><title>Analytics Report</title></head>
        <body>
          <h1>Analytics Report</h1>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </body>
      </html>
    `;
  }

  private async convertToPDF(data: any): Promise<Buffer> {
    // Implementation for PDF conversion (would use a library like puppeteer)
    return Buffer.from('PDF data would be generated here');
  }

  private async convertToExcel(data: any): Promise<Buffer> {
    // Implementation for Excel conversion (would use a library like exceljs)
    return Buffer.from('Excel data would be generated here');
  }

  // File Management
  private async saveReportFile(report: AnalyticsReport, data: any): Promise<string> {
    // In production, this would save to cloud storage (S3, etc.)
    const fileName = `${report.id}_${report.report_name.replace(/\s+/g, '_')}.${report.report_format}`;
    const filePath = `reports/${fileName}`;
    
    // For now, just return the file path
    return filePath;
  }

  private async sendReportToRecipients(report: AnalyticsReport): Promise<void> {
    // Implementation for sending reports to recipients
    this.logger.log(`Sending report ${report.id} to recipients`);
  }

  // Report Management
  async getReports(
    tenantId: string,
    reportType?: ReportType,
    status?: ReportStatus,
  ): Promise<AnalyticsReport[]> {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .where('report.tenant_id = :tenant_id', { tenant_id: tenantId });

    if (reportType) {
      query.andWhere('report.report_type = :report_type', { report_type: reportType });
    }

    if (status) {
      query.andWhere('report.status = :status', { status: status });
    }

    return await query
      .orderBy('report.created_at', 'DESC')
      .getMany();
  }

  async getReportById(id: string, tenantId: string): Promise<AnalyticsReport> {
    const report = await this.reportRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  }

  async deleteReport(id: string, tenantId: string): Promise<void> {
    const report = await this.getReportById(id, tenantId);
    await this.reportRepository.remove(report);
  }

  async downloadReport(id: string, tenantId: string): Promise<Buffer> {
    const report = await this.getReportById(id, tenantId);

    if (report.status !== ReportStatus.COMPLETED) {
      throw new Error('Report not ready for download');
    }

    // In production, this would read from cloud storage
    return Buffer.from('Report file content would be here');
  }

  // Scheduled Reports
  async processScheduledReports(): Promise<void> {
    const scheduledReports = await this.reportRepository
      .createQueryBuilder('report')
      .where('report.frequency != :frequency', { frequency: ReportFrequency.ONCE })
      .andWhere('report.status = :status', { status: ReportStatus.COMPLETED })
      .andWhere('report.scheduled_at <= :now', { now: new Date() })
      .getMany();

    for (const report of scheduledReports) {
      try {
        await this.generateReport(report.id);
        
        // Update next scheduled time
        report.scheduled_at = this.calculateNextScheduledTime(report);
        await this.reportRepository.save(report);
      } catch (error) {
        this.logger.error(`Error processing scheduled report ${report.id}:`, error);
      }
    }
  }

  private calculateNextScheduledTime(report: AnalyticsReport): Date {
    const now = new Date();
    
    switch (report.frequency) {
      case ReportFrequency.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      case ReportFrequency.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      case ReportFrequency.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      case ReportFrequency.QUARTERLY:
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      
      case ReportFrequency.YEARLY:
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}

// Helper type for metric results
interface MetricResult {
  metric_name: string;
  value: number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
}
