import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIInsight, InsightType, InsightCategory, InsightPriority, InsightStatus } from './entities/ai-insight.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { MLService } from './ml-service';
import { AnalyticsFilter } from '../analytics/analytics.service';

export interface InsightGenerationConfig {
  tenant_id: string;
  clinic_id?: string;
  categories?: InsightCategory[];
  priority_threshold?: InsightPriority;
  auto_generate?: boolean;
}

export interface InsightData {
  title: string;
  description: string;
  type: InsightType;
  category: InsightCategory;
  priority: InsightPriority;
  confidence_score: number;
  impact_score: number;
  data_points: Record<string, any>;
  recommendations?: Record<string, any>;
  supporting_evidence?: Record<string, any>;
}

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @InjectRepository(AIInsight)
    private aiInsightRepository: Repository<AIInsight>,
    private analyticsService: AnalyticsService,
    private mlService: MLService,
  ) {}

  // Insight Generation
  async generateInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      // Generate insights for each category
      const categories = config.categories || Object.values(InsightCategory);
      
      for (const category of categories) {
        const categoryInsights = await this.generateCategoryInsights(config, category);
        insights.push(...categoryInsights);
      }

      // Save insights to database
      const savedInsights = await this.aiInsightRepository.save(insights);

      this.logger.log(`Generated ${savedInsights.length} insights for tenant ${config.tenant_id}`);
      return savedInsights;

    } catch (error) {
      this.logger.error('Error generating insights:', error);
      throw error;
    }
  }

  private async generateCategoryInsights(
    config: InsightGenerationConfig,
    category: InsightCategory,
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    switch (category) {
      case InsightCategory.APPOINTMENT:
        insights.push(...await this.generateAppointmentInsights(config));
        break;
      case InsightCategory.REVENUE:
        insights.push(...await this.generateRevenueInsights(config));
        break;
      case InsightCategory.PATIENT:
        insights.push(...await this.generatePatientInsights(config));
        break;
      case InsightCategory.PROVIDER:
        insights.push(...await this.generateProviderInsights(config));
        break;
      case InsightCategory.CLINICAL:
        insights.push(...await this.generateClinicalInsights(config));
        break;
      case InsightCategory.OPERATIONAL:
        insights.push(...await this.generateOperationalInsights(config));
        break;
      case InsightCategory.FINANCIAL:
        insights.push(...await this.generateFinancialInsights(config));
        break;
      case InsightCategory.MARKETING:
        insights.push(...await this.generateMarketingInsights(config));
        break;
    }

    return insights;
  }

  // Appointment Insights
  private async generateAppointmentInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const filters: AnalyticsFilter = {
      tenant_id: config.tenant_id,
      clinic_id: config.clinic_id,
    };

    try {
      // Get appointment data
      const appointmentData = await this.analyticsService.getAppointmentsTimeSeries(filters, 'daily');
      const totalAppointments = await this.analyticsService.getTotalAppointments(filters);
      const completedAppointments = await this.analyticsService.getCompletedAppointments(filters);

      // Insight 1: No-show rate analysis
      const noShowRate = this.calculateNoShowRate(appointmentData);
      if (noShowRate > 0.15) { // 15% threshold
        insights.push(this.createInsight({
          tenant_id: config.tenant_id,
          clinic_id: config.clinic_id,
          title: 'High No-Show Rate Detected',
          description: `Your no-show rate is ${(noShowRate * 100).toFixed(1)}%, which is above the recommended 15% threshold. This impacts revenue and scheduling efficiency.`,
          type: InsightType.RISK,
          category: InsightCategory.APPOINTMENT,
          priority: noShowRate > 0.25 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
          confidence_score: 0.85,
          impact_score: noShowRate * 100,
          data_points: {
            no_show_rate: noShowRate,
            total_appointments: totalAppointments.value,
            completed_appointments: completedAppointments.value,
            potential_revenue_loss: this.calculateRevenueLoss(noShowRate, totalAppointments.value),
          },
          recommendations: {
            actions: [
              'Implement automated appointment reminders',
              'Consider requiring deposits for high-risk appointments',
              'Send confirmation texts 24 hours before appointments',
            ],
            timeline: 'Implement within 2 weeks',
            expected_impact: 'Reduce no-show rate by 30-50%',
          },
        }));
      }

      // Insight 2: Appointment volume trends
      const volumeTrend = this.calculateVolumeTrend(appointmentData);
      if (Math.abs(volumeTrend) > 0.1) { // 10% change threshold
        insights.push(this.createInsight({
          tenant_id: config.tenant_id,
          clinic_id: config.clinic_id,
          title: volumeTrend > 0 ? 'Appointment Volume Increasing' : 'Appointment Volume Declining',
          description: `Your appointment volume has ${volumeTrend > 0 ? 'increased' : 'decreased'} by ${Math.abs(volumeTrend * 100).toFixed(1)}% over the past period.`,
          type: volumeTrend > 0 ? InsightType.OPPORTUNITY : InsightType.RISK,
          category: InsightCategory.APPOINTMENT,
          priority: Math.abs(volumeTrend) > 0.2 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
          confidence_score: 0.9,
          impact_score: Math.abs(volumeTrend) * 100,
          data_points: {
            volume_trend: volumeTrend,
            current_volume: appointmentData[appointmentData.length - 1]?.total || 0,
            previous_volume: appointmentData[appointmentData.length - 2]?.total || 0,
          },
          recommendations: volumeTrend < 0 ? {
            actions: [
              'Review marketing and patient acquisition strategies',
              'Implement patient retention programs',
              'Analyze competitor pricing and services',
            ],
            timeline: 'Address within 1 month',
            expected_impact: 'Stabilize or increase appointment volume',
          } : {
            actions: [
              'Consider expanding provider capacity',
              'Optimize scheduling efficiency',
              'Review pricing strategies',
            ],
            timeline: 'Plan within 2 weeks',
            expected_impact: 'Capitalize on growth opportunity',
          },
        }));
      }

    } catch (error) {
      this.logger.error('Error generating appointment insights:', error);
    }

    return insights;
  }

  // Revenue Insights
  private async generateRevenueInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const filters: AnalyticsFilter = {
      tenant_id: config.tenant_id,
      clinic_id: config.clinic_id,
    };

    try {
      const revenueData = await this.analyticsService.getRevenueTimeSeries(filters, 'monthly');
      const totalRevenue = await this.analyticsService.getTotalRevenue(filters);
      const pendingInvoices = await this.analyticsService.getPendingInvoices(filters);

      // Insight 1: Revenue growth analysis
      const revenueGrowth = this.calculateRevenueGrowth(revenueData);
      if (revenueGrowth < -0.05) { // 5% decline threshold
        insights.push(this.createInsight({
          tenant_id: config.tenant_id,
          clinic_id: config.clinic_id,
          title: 'Revenue Decline Detected',
          description: `Your revenue has declined by ${Math.abs(revenueGrowth * 100).toFixed(1)}% compared to the previous period.`,
          type: InsightType.RISK,
          category: InsightCategory.REVENUE,
          priority: revenueGrowth < -0.15 ? InsightPriority.CRITICAL : InsightPriority.HIGH,
          confidence_score: 0.9,
          impact_score: Math.abs(revenueGrowth) * 100,
          data_points: {
            revenue_growth: revenueGrowth,
            current_revenue: totalRevenue.value,
            pending_amount: pendingInvoices.value,
            collection_rate: this.calculateCollectionRate(totalRevenue.value, pendingInvoices.value),
          },
          recommendations: {
            actions: [
              'Review billing and collection processes',
              'Implement payment plans for outstanding balances',
              'Analyze service pricing and mix',
              'Focus on high-value procedures',
            ],
            timeline: 'Address within 1 week',
            expected_impact: 'Improve revenue by 10-20%',
          },
        }));
      }

      // Insight 2: Outstanding balance analysis
      const outstandingRatio = pendingInvoices.value / totalRevenue.value;
      if (outstandingRatio > 0.2) { // 20% threshold
        insights.push(this.createInsight({
          tenant_id: config.tenant_id,
          clinic_id: config.clinic_id,
          title: 'High Outstanding Balance',
          description: `You have ${(outstandingRatio * 100).toFixed(1)}% of your revenue in outstanding balances, which affects cash flow.`,
          type: InsightType.RISK,
          category: InsightCategory.REVENUE,
          priority: outstandingRatio > 0.3 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
          confidence_score: 0.95,
          impact_score: outstandingRatio * 100,
          data_points: {
            outstanding_ratio: outstandingRatio,
            outstanding_amount: pendingInvoices.value,
            total_revenue: totalRevenue.value,
            average_collection_time: this.calculateAverageCollectionTime(),
          },
          recommendations: {
            actions: [
              'Implement automated payment reminders',
              'Offer online payment options',
              'Review insurance claim processing',
              'Consider payment plans for large balances',
            ],
            timeline: 'Implement within 2 weeks',
            expected_impact: 'Reduce outstanding balances by 30%',
          },
        }));
      }

    } catch (error) {
      this.logger.error('Error generating revenue insights:', error);
    }

    return insights;
  }

  // Patient Insights
  private async generatePatientInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const filters: AnalyticsFilter = {
      tenant_id: config.tenant_id,
      clinic_id: config.clinic_id,
    };

    try {
      const totalPatients = await this.analyticsService.getTotalPatients(filters);

      // Insight 1: Patient growth opportunity
      const patientGrowthRate = this.calculatePatientGrowthRate(totalPatients.value);
      if (patientGrowthRate < 0.05) { // 5% growth threshold
        insights.push(this.createInsight({
          tenant_id: config.tenant_id,
          clinic_id: config.clinic_id,
          title: 'Patient Growth Opportunity',
          description: `Your patient base growth is below industry standards. Consider implementing patient acquisition strategies.`,
          type: InsightType.OPPORTUNITY,
          category: InsightCategory.PATIENT,
          priority: InsightPriority.MEDIUM,
          confidence_score: 0.8,
          impact_score: 75,
          data_points: {
            current_patients: totalPatients.value,
            growth_rate: patientGrowthRate,
            market_potential: this.estimateMarketPotential(),
          },
          recommendations: {
            actions: [
              'Launch referral program for existing patients',
              'Improve online presence and reviews',
              'Partner with local businesses for promotions',
              'Implement patient satisfaction surveys',
            ],
            timeline: 'Implement within 1 month',
            expected_impact: 'Increase patient base by 15-25%',
          },
        }));
      }

    } catch (error) {
      this.logger.error('Error generating patient insights:', error);
    }

    return insights;
  }

  // Provider Insights
  private async generateProviderInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const filters: AnalyticsFilter = {
      tenant_id: config.tenant_id,
      clinic_id: config.clinic_id,
    };

    try {
      const providerPerformance = await this.analyticsService.getProviderPerformance(filters);

      // Find underperforming providers
      const underperformers = providerPerformance.filter(p => p.completion_rate < 0.8);
      if (underperformers.length > 0) {
        insights.push(this.createInsight({
          tenant_id: config.tenant_id,
          clinic_id: config.clinic_id,
          title: 'Provider Performance Issues',
          description: `${underperformers.length} provider(s) have completion rates below 80%, affecting overall efficiency.`,
          type: InsightType.RISK,
          category: InsightCategory.PROVIDER,
          priority: underperformers.length > 1 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
          confidence_score: 0.9,
          impact_score: (0.8 - Math.min(...underperformers.map(p => p.completion_rate))) * 100,
          data_points: {
            underperforming_providers: underperformers.length,
            average_completion_rate: underperformers.reduce((sum, p) => sum + p.completion_rate, 0) / underperformers.length,
            total_providers: providerPerformance.length,
          },
          recommendations: {
            actions: [
              'Provide additional training for underperforming providers',
              'Review scheduling and time allocation',
              'Implement performance improvement plans',
              'Consider mentorship programs',
            ],
            timeline: 'Address within 2 weeks',
            expected_impact: 'Improve completion rates by 15-20%',
          },
        }));
      }

    } catch (error) {
      this.logger.error('Error generating provider insights:', error);
    }

    return insights;
  }

  // Clinical Insights
  private async generateClinicalInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      const filters: AnalyticsFilter = {
        tenant_id: config.tenant_id,
        clinic_id: config.clinic_id,
      };

      const clinicalNotes = await this.analyticsService.getTotalClinicalNotes(filters);
      const treatmentPlans = await this.analyticsService.getActiveTreatmentPlans(filters);

      // Insight 1: Treatment plan completion
      const completionRate = this.calculateTreatmentCompletionRate(treatmentPlans.value);
      if (completionRate < 0.7) { // 70% completion threshold
        insights.push(this.createInsight({
          tenant_id: config.tenant_id,
          clinic_id: config.clinic_id,
          title: 'Low Treatment Plan Completion Rate',
          description: `Your treatment plan completion rate is ${(completionRate * 100).toFixed(1)}%, which may indicate patient engagement issues.`,
          type: InsightType.RISK,
          category: InsightCategory.CLINICAL,
          priority: completionRate < 0.5 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
          confidence_score: 0.85,
          impact_score: (0.7 - completionRate) * 100,
          data_points: {
            completion_rate: completionRate,
            active_treatment_plans: treatmentPlans.value,
            clinical_notes: clinicalNotes.value,
          },
          recommendations: {
            actions: [
              'Implement patient education programs',
              'Improve treatment plan communication',
              'Offer flexible payment options',
              'Follow up with patients on incomplete treatments',
            ],
            timeline: 'Implement within 3 weeks',
            expected_impact: 'Increase completion rate by 20-30%',
          },
        }));
      }

    } catch (error) {
      this.logger.error('Error generating clinical insights:', error);
    }

    return insights;
  }

  // Operational Insights
  private async generateOperationalInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Insight 1: Peak hours analysis
    const peakHours = this.analyzePeakHours();
    if (peakHours.efficiency < 0.8) {
      insights.push(this.createInsight({
        tenant_id: config.tenant_id,
        clinic_id: config.clinic_id,
        title: 'Peak Hours Optimization Opportunity',
        description: `Your peak hours utilization efficiency is ${(peakHours.efficiency * 100).toFixed(1)}%. Consider optimizing scheduling.`,
        type: InsightType.OPPORTUNITY,
        category: InsightCategory.OPERATIONAL,
        priority: InsightPriority.MEDIUM,
        confidence_score: 0.8,
        impact_score: (0.8 - peakHours.efficiency) * 100,
        data_points: peakHours,
        recommendations: {
          actions: [
            'Adjust appointment durations during peak hours',
            'Consider extending peak hours',
            'Implement dynamic pricing for peak times',
            'Train staff for peak hour efficiency',
          ],
          timeline: 'Implement within 1 month',
          expected_impact: 'Improve efficiency by 15-25%',
        },
      }));
    }

    return insights;
  }

  // Financial Insights
  private async generateFinancialInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Insight 1: Cost optimization
    const costAnalysis = this.analyzeCosts();
    if (costAnalysis.optimization_potential > 0.15) {
      insights.push(this.createInsight({
        tenant_id: config.tenant_id,
        clinic_id: config.clinic_id,
        title: 'Cost Optimization Opportunity',
        description: `You have potential to reduce operational costs by ${(costAnalysis.optimization_potential * 100).toFixed(1)}%.`,
        type: InsightType.OPPORTUNITY,
        category: InsightCategory.FINANCIAL,
        priority: costAnalysis.optimization_potential > 0.25 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
        confidence_score: 0.75,
        impact_score: costAnalysis.optimization_potential * 100,
        data_points: costAnalysis,
        recommendations: {
          actions: [
            'Review supplier contracts and negotiate better rates',
            'Implement energy-saving measures',
            'Optimize inventory management',
            'Consider outsourcing non-core functions',
          ],
          timeline: 'Implement within 2 months',
          expected_impact: 'Reduce costs by 10-20%',
        },
      }));
    }

    return insights;
  }

  // Marketing Insights
  private async generateMarketingInsights(config: InsightGenerationConfig): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Insight 1: Marketing ROI analysis
    const marketingROI = this.analyzeMarketingROI();
    if (marketingROI.roi < 3.0) { // 3x ROI threshold
      insights.push(this.createInsight({
        tenant_id: config.tenant_id,
        clinic_id: config.clinic_id,
        title: 'Marketing ROI Improvement Needed',
        description: `Your marketing ROI is ${marketingROI.roi.toFixed(1)}x, below the recommended 3x threshold.`,
        type: InsightType.RISK,
        category: InsightCategory.MARKETING,
        priority: marketingROI.roi < 2.0 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
        confidence_score: 0.8,
        impact_score: (3.0 - marketingROI.roi) * 20,
        data_points: marketingROI,
        recommendations: {
          actions: [
            'Focus on high-converting marketing channels',
            'Improve patient referral programs',
            'Enhance online presence and SEO',
            'Implement targeted digital marketing campaigns',
          ],
          timeline: 'Implement within 1 month',
          expected_impact: 'Improve ROI to 3-4x',
        },
      }));
    }

    return insights;
  }

  // Helper methods for calculations
  private calculateNoShowRate(appointmentData: any[]): number {
    if (appointmentData.length === 0) return 0;
    const total = appointmentData.reduce((sum, day) => sum + day.total, 0);
    const noShows = appointmentData.reduce((sum, day) => sum + (day.total - day.completed), 0);
    return total > 0 ? noShows / total : 0;
  }

  private calculateVolumeTrend(appointmentData: any[]): number {
    if (appointmentData.length < 2) return 0;
    const recent = appointmentData.slice(-7).reduce((sum, day) => sum + day.total, 0);
    const previous = appointmentData.slice(-14, -7).reduce((sum, day) => sum + day.total, 0);
    return previous > 0 ? (recent - previous) / previous : 0;
  }

  private calculateRevenueGrowth(revenueData: any[]): number {
    if (revenueData.length < 2) return 0;
    const recent = revenueData[revenueData.length - 1]?.total_revenue || 0;
    const previous = revenueData[revenueData.length - 2]?.total_revenue || 0;
    return previous > 0 ? (recent - previous) / previous : 0;
  }

  private calculateCollectionRate(totalRevenue: number, pendingAmount: number): number {
    return totalRevenue > 0 ? (totalRevenue - pendingAmount) / totalRevenue : 1;
  }

  private calculatePatientGrowthRate(currentPatients: number): number {
    // Simulate growth rate calculation
    return Math.random() * 0.1; // 0-10% growth rate
  }

  private calculateTreatmentCompletionRate(activePlans: number): number {
    // Simulate completion rate calculation
    return 0.6 + Math.random() * 0.3; // 60-90% completion rate
  }

  private calculateRevenueLoss(noShowRate: number, totalAppointments: number): number {
    const avgAppointmentValue = 150; // Average appointment value
    return noShowRate * totalAppointments * avgAppointmentValue;
  }

  private calculateAverageCollectionTime(): number {
    return 30 + Math.random() * 30; // 30-60 days
  }

  private estimateMarketPotential(): number {
    return 1000 + Math.random() * 2000; // 1000-3000 potential patients
  }

  private analyzePeakHours(): any {
    return {
      peak_start: 9,
      peak_end: 17,
      efficiency: 0.7 + Math.random() * 0.2, // 70-90%
      utilization_rate: 0.8 + Math.random() * 0.15, // 80-95%
    };
  }

  private analyzeCosts(): any {
    return {
      total_costs: 50000 + Math.random() * 100000,
      optimization_potential: 0.1 + Math.random() * 0.2, // 10-30%
      top_cost_categories: ['Staff', 'Supplies', 'Equipment', 'Utilities'],
    };
  }

  private analyzeMarketingROI(): any {
    return {
      roi: 2 + Math.random() * 3, // 2-5x ROI
      total_investment: 5000 + Math.random() * 15000,
      total_return: 15000 + Math.random() * 35000,
      top_channels: ['Online', 'Referrals', 'Print', 'Social Media'],
    };
  }

  private createInsight(insightData: InsightData & { tenant_id: string; clinic_id?: string }): AIInsight {
    const insight = this.aiInsightRepository.create({
      ...insightData,
      detected_at: new Date(),
      auto_archive_at: new Date(Date.now() + insightData.priority === InsightPriority.CRITICAL ? 7 : 30 * 24 * 60 * 60 * 1000),
    });

    return insight;
  }

  // Insight Management
  async getInsights(
    tenantId: string,
    filters: {
      category?: InsightCategory;
      priority?: InsightPriority;
      status?: InsightStatus;
      limit?: number;
    } = {},
  ): Promise<AIInsight[]> {
    const query = this.aiInsightRepository
      .createQueryBuilder('insight')
      .where('insight.tenant_id = :tenant_id', { tenant_id: tenantId });

    if (filters.category) {
      query.andWhere('insight.category = :category', { category: filters.category });
    }

    if (filters.priority) {
      query.andWhere('insight.priority = :priority', { priority: filters.priority });
    }

    if (filters.status) {
      query.andWhere('insight.status = :status', { status: filters.status });
    }

    return await query
      .orderBy('insight.priority', 'DESC')
      .addOrderBy('insight.created_at', 'DESC')
      .limit(filters.limit || 50)
      .getMany();
  }

  async updateInsightStatus(
    insightId: string,
    status: InsightStatus,
    reviewNotes?: string,
    reviewerId?: string,
  ): Promise<AIInsight> {
    const insight = await this.aiInsightRepository.findOne({
      where: { id: insightId },
    });

    if (!insight) {
      throw new Error('Insight not found');
    }

    insight.status = status;
    insight.reviewed_at = new Date();
    insight.reviewed_by = reviewerId;
    insight.review_notes = reviewNotes;

    return await this.aiInsightRepository.save(insight);
  }

  async archiveOldInsights(): Promise<number> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const result = await this.aiInsightRepository
      .createQueryBuilder()
      .update(AIInsight)
      .set({ status: InsightStatus.ARCHIVED })
      .where('auto_archive_at < :cutoffDate', { cutoffDate })
      .andWhere('status != :archived', { archived: InsightStatus.ARCHIVED })
      .execute();

    return result.affected || 0;
  }
}
