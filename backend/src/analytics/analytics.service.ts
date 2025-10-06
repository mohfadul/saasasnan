import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsMetric, MetricType, MetricCategory } from './entities/analytics-metric.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { Payment } from '../billing/entities/payment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { ClinicalNote } from '../clinical/entities/clinical-note.entity';
import { TreatmentPlan } from '../clinical/entities/treatment-plan.entity';
import { CacheService } from '../common/services/cache.service';

export interface AnalyticsFilter {
  tenant_id: string;
  clinic_id?: string;
  start_date?: Date;
  end_date?: Date;
  provider_id?: string;
  patient_id?: string;
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

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsMetric)
    private analyticsMetricRepository: Repository<AnalyticsMetric>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ClinicalNote)
    private clinicalNoteRepository: Repository<ClinicalNote>,
    @InjectRepository(TreatmentPlan)
    private treatmentPlanRepository: Repository<TreatmentPlan>,
    private cacheService: CacheService,
  ) {}

  // Dashboard Overview Metrics
  async getDashboardOverview(filters: AnalyticsFilter): Promise<Record<string, MetricResult>> {
    const cacheKey = CacheService.getDashboardKey(filters.tenant_id, filters);
    
    // Try to get from cache first
    const cachedMetrics = await this.cacheService.get<Record<string, MetricResult>>(cacheKey);
    if (cachedMetrics) {
      return cachedMetrics;
    }

    const metrics: Record<string, MetricResult> = {};

    // Parallel execution for better performance
    const [
      totalAppointments,
      totalRevenue,
      totalPatients,
      activeProviders,
      completedAppointments,
      pendingInvoices,
      totalClinicalNotes,
      activeTreatmentPlans,
    ] = await Promise.all([
      this.getTotalAppointments(filters),
      this.getTotalRevenue(filters),
      this.getTotalPatients(filters),
      this.getActiveProviders(filters),
      this.getCompletedAppointments(filters),
      this.getPendingInvoices(filters),
      this.getTotalClinicalNotes(filters),
      this.getActiveTreatmentPlans(filters),
    ]);

    metrics.total_appointments = totalAppointments;
    metrics.total_revenue = totalRevenue;
    metrics.total_patients = totalPatients;
    metrics.active_providers = activeProviders;
    metrics.completed_appointments = completedAppointments;
    metrics.pending_invoices = pendingInvoices;
    metrics.total_clinical_notes = totalClinicalNotes;
    metrics.active_treatment_plans = activeTreatmentPlans;

    // Cache the result for 5 minutes
    await this.cacheService.set(cacheKey, metrics, 300);

    return metrics;
  }

  // Appointment Analytics
  async getTotalAppointments(filters: AnalyticsFilter): Promise<MetricResult> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.tenant_id = :tenant_id', { tenant_id: filters.tenant_id });

    if (filters.clinic_id) {
      query.andWhere('appointment.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    if (filters.start_date && filters.end_date) {
      query.andWhere('appointment.start_time BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    const currentCount = await query.getCount();

    // Get previous period for comparison
    const previousFilters = { ...filters };
    if (filters.start_date && filters.end_date) {
      const periodLength = filters.end_date.getTime() - filters.start_date.getTime();
      previousFilters.end_date = new Date(filters.start_date.getTime() - 1);
      previousFilters.start_date = new Date(previousFilters.end_date.getTime() - periodLength);
    }

    const previousCount = await this.getTotalAppointments(previousFilters);
    const growthRate = this.calculateGrowthRate(currentCount, previousCount.value);

    return {
      metric_name: 'Total Appointments',
      value: currentCount,
      previous_value: previousCount.value,
      growth_rate: growthRate,
      trend: this.getTrend(growthRate),
    };
  }

  async getCompletedAppointments(filters: AnalyticsFilter): Promise<MetricResult> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.tenant_id = :tenant_id', { tenant_id: filters.tenant_id })
      .andWhere('appointment.status = :status', { status: 'completed' });

    if (filters.clinic_id) {
      query.andWhere('appointment.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    if (filters.start_date && filters.end_date) {
      query.andWhere('appointment.start_time BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    const count = await query.getCount();

    return {
      metric_name: 'Completed Appointments',
      value: count,
      trend: 'stable',
    };
  }

  // Revenue Analytics
  async getTotalRevenue(filters: AnalyticsFilter): Promise<MetricResult> {
    const query = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenant_id = :tenant_id', { tenant_id: filters.tenant_id })
      .andWhere('invoice.status = :status', { status: 'paid' });

    if (filters.clinic_id) {
      query.andWhere('invoice.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    if (filters.start_date && filters.end_date) {
      query.andWhere('invoice.invoice_date BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    const result = await query
      .select('SUM(invoice.total_amount)', 'total')
      .getRawOne();

    const totalRevenue = parseFloat(result.total) || 0;

    return {
      metric_name: 'Total Revenue',
      value: totalRevenue,
      unit: 'USD',
      trend: 'stable',
    };
  }

  async getPendingInvoices(filters: AnalyticsFilter): Promise<MetricResult> {
    const query = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenant_id = :tenant_id', { tenant_id: filters.tenant_id })
      .andWhere('invoice.status IN (:...statuses)', { 
        statuses: ['sent', 'overdue'] 
      });

    if (filters.clinic_id) {
      query.andWhere('invoice.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    const result = await query
      .select('SUM(invoice.amount_due)', 'total')
      .getRawOne();

    const pendingAmount = parseFloat(result.total) || 0;

    return {
      metric_name: 'Pending Invoices',
      value: pendingAmount,
      unit: 'USD',
      trend: 'stable',
    };
  }

  // Patient Analytics
  async getTotalPatients(filters: AnalyticsFilter): Promise<MetricResult> {
    const query = this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.tenant_id = :tenant_id', { tenant_id: filters.tenant_id })
      .andWhere('patient.deleted_at IS NULL');

    if (filters.clinic_id) {
      query.andWhere('patient.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    const count = await query.getCount();

    return {
      metric_name: 'Total Patients',
      value: count,
      trend: 'stable',
    };
  }

  // Provider Analytics
  async getActiveProviders(filters: AnalyticsFilter): Promise<MetricResult> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.tenant_id = :tenant_id', { tenant_id: filters.tenant_id })
      .andWhere('user.role IN (:...roles)', { 
        roles: ['dentist', 'clinic_admin'] 
      });

    const count = await query.getCount();

    return {
      metric_name: 'Active Providers',
      value: count,
      trend: 'stable',
    };
  }

  // Clinical Analytics
  async getTotalClinicalNotes(filters: AnalyticsFilter): Promise<MetricResult> {
    const query = this.clinicalNoteRepository
      .createQueryBuilder('note')
      .where('note.tenant_id = :tenant_id', { tenant_id: filters.tenant_id })
      .andWhere('note.deleted_at IS NULL');

    if (filters.clinic_id) {
      query.andWhere('note.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    if (filters.start_date && filters.end_date) {
      query.andWhere('note.created_at BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    const count = await query.getCount();

    return {
      metric_name: 'Clinical Notes',
      value: count,
      trend: 'stable',
    };
  }

  async getActiveTreatmentPlans(filters: AnalyticsFilter): Promise<MetricResult> {
    const query = this.treatmentPlanRepository
      .createQueryBuilder('plan')
      .where('plan.tenant_id = :tenant_id', { tenant_id: filters.tenant_id })
      .andWhere('plan.status IN (:...statuses)', { 
        statuses: ['accepted', 'in_progress'] 
      })
      .andWhere('plan.deleted_at IS NULL');

    if (filters.clinic_id) {
      query.andWhere('plan.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    const count = await query.getCount();

    return {
      metric_name: 'Active Treatment Plans',
      value: count,
      trend: 'stable',
    };
  }

  // Time Series Analytics
  async getAppointmentsTimeSeries(filters: AnalyticsFilter, period: 'daily' | 'weekly' | 'monthly'): Promise<any[]> {
    const dateFormat = this.getDateFormat(period);
    
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .select(`DATE_TRUNC('${period}', appointment.start_time)`, 'period')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COUNT(CASE WHEN appointment.status = \'completed\' THEN 1 END)', 'completed')
      .where('appointment.tenant_id = :tenant_id', { tenant_id: filters.tenant_id });

    if (filters.clinic_id) {
      query.andWhere('appointment.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    if (filters.start_date && filters.end_date) {
      query.andWhere('appointment.start_time BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    const results = await query
      .groupBy(`DATE_TRUNC('${period}', appointment.start_time)`)
      .orderBy(`DATE_TRUNC('${period}', appointment.start_time)`, 'ASC')
      .getRawMany();

    return results.map(result => ({
      period: result.period,
      total: parseInt(result.count),
      completed: parseInt(result.completed),
      completion_rate: parseFloat(result.completed) / parseFloat(result.count) * 100,
    }));
  }

  async getRevenueTimeSeries(filters: AnalyticsFilter, period: 'daily' | 'weekly' | 'monthly'): Promise<any[]> {
    const query = this.invoiceRepository
      .createQueryBuilder('invoice')
      .select(`DATE_TRUNC('${period}', invoice.invoice_date)`, 'period')
      .addSelect('SUM(invoice.total_amount)', 'total_revenue')
      .addSelect('COUNT(*)', 'invoice_count')
      .where('invoice.tenant_id = :tenant_id', { tenant_id: filters.tenant_id })
      .andWhere('invoice.status = :status', { status: 'paid' });

    if (filters.clinic_id) {
      query.andWhere('invoice.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    if (filters.start_date && filters.end_date) {
      query.andWhere('invoice.invoice_date BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    const results = await query
      .groupBy(`DATE_TRUNC('${period}', invoice.invoice_date)`)
      .orderBy(`DATE_TRUNC('${period}', invoice.invoice_date)`, 'ASC')
      .getRawMany();

    return results.map(result => ({
      period: result.period,
      total_revenue: parseFloat(result.total_revenue) || 0,
      invoice_count: parseInt(result.invoice_count),
    }));
  }

  // Provider Performance Analytics
  async getProviderPerformance(filters: AnalyticsFilter): Promise<any[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.provider', 'provider')
      .select('provider.id', 'provider_id')
      .addSelect('provider.email', 'provider_email')
      .addSelect('COUNT(*)', 'total_appointments')
      .addSelect('COUNT(CASE WHEN appointment.status = \'completed\' THEN 1 END)', 'completed_appointments')
      .addSelect('AVG(EXTRACT(EPOCH FROM (appointment.end_time - appointment.start_time))/60)', 'avg_duration')
      .where('appointment.tenant_id = :tenant_id', { tenant_id: filters.tenant_id });

    if (filters.clinic_id) {
      query.andWhere('appointment.clinic_id = :clinic_id', { clinic_id: filters.clinic_id });
    }

    if (filters.start_date && filters.end_date) {
      query.andWhere('appointment.start_time BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    const results = await query
      .groupBy('provider.id, provider.email')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    return results.map(result => ({
      provider_id: result.provider_id,
      provider_email: result.provider_email,
      total_appointments: parseInt(result.total_appointments),
      completed_appointments: parseInt(result.completed_appointments),
      completion_rate: parseFloat(result.completed_appointments) / parseFloat(result.total_appointments) * 100,
      avg_duration: parseFloat(result.avg_duration) || 0,
    }));
  }

  // Utility Methods
  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private getTrend(growthRate: number): 'up' | 'down' | 'stable' {
    if (growthRate > 5) return 'up';
    if (growthRate < -5) return 'down';
    return 'stable';
  }

  private getDateFormat(period: string): string {
    switch (period) {
      case 'daily':
        return 'YYYY-MM-DD';
      case 'weekly':
        return 'YYYY-"W"WW';
      case 'monthly':
        return 'YYYY-MM';
      default:
        return 'YYYY-MM-DD';
    }
  }

  // Cache and Store Metrics
  async storeMetric(
    tenantId: string,
    metricType: MetricType,
    metricCategory: MetricCategory,
    metricName: string,
    metricData: Record<string, any>,
    numericValue?: number,
    unit?: string,
  ): Promise<AnalyticsMetric> {
    const metric = this.analyticsMetricRepository.create({
      tenant_id: tenantId,
      metric_type: metricType,
      metric_category: metricCategory,
      metric_name: metricName,
      metric_description: `${metricName} for ${metricCategory}`,
      metric_data: metricData,
      numeric_value: numericValue,
      unit: unit,
      metric_date: new Date(),
      calculated_at: new Date(),
    });

    return await this.analyticsMetricRepository.save(metric);
  }

  async getStoredMetrics(
    tenantId: string,
    metricType?: MetricType,
    metricCategory?: MetricCategory,
    limit: number = 100,
  ): Promise<AnalyticsMetric[]> {
    const query = this.analyticsMetricRepository
      .createQueryBuilder('metric')
      .where('metric.tenant_id = :tenant_id', { tenant_id: tenantId });

    if (metricType) {
      query.andWhere('metric.metric_type = :metric_type', { metric_type: metricType });
    }

    if (metricCategory) {
      query.andWhere('metric.metric_category = :metric_category', { metric_category: metricCategory });
    }

    return await query
      .orderBy('metric.calculated_at', 'DESC')
      .limit(limit)
      .getMany();
  }
}
