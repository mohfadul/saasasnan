import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ABTest, ABTestStatus, ABTestType, ABTestTrafficSplit } from './entities/ab-test.entity';
import { ABTestParticipant, ParticipantStatus } from './entities/ab-test-participant.entity';

export interface ABTestCreationRequest {
  tenant_id: string;
  name: string;
  description?: string;
  test_type: ABTestType;
  variants: Record<string, any>;
  traffic_allocation?: Record<string, number>;
  success_metrics: Record<string, any>;
  targeting_rules?: Record<string, any>;
  significance_level?: number;
  minimum_sample_size?: number;
  maximum_duration_days?: number;
  auto_stop_on_significance?: boolean;
  auto_apply_winner?: boolean;
}

export interface ParticipantAssignmentRequest {
  ab_test_id: string;
  user_id: string;
  session_id?: string;
  device_id?: string;
  user_attributes?: Record<string, any>;
  device_info?: Record<string, any>;
}

export interface ConversionEvent {
  ab_test_id: string;
  user_id: string;
  event_type: string;
  event_data?: Record<string, any>;
  timestamp?: Date;
}

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);

  constructor(
    @InjectRepository(ABTest)
    private abTestRepository: Repository<ABTest>,
    @InjectRepository(ABTestParticipant)
    private participantRepository: Repository<ABTestParticipant>,
  ) {}

  // AB Test Management
  async createABTest(request: ABTestCreationRequest): Promise<ABTest> {
    // Validate variants
    this.validateVariants(request.variants);

    // Set default traffic allocation if not provided
    const trafficAllocation = request.traffic_allocation || this.generateEqualTrafficAllocation(request.variants);

    // Validate traffic allocation
    this.validateTrafficAllocation(trafficAllocation, request.variants);

    const abTest = this.abTestRepository.create({
      ...request,
      traffic_allocation: trafficAllocation,
      status: ABTestStatus.DRAFT,
      results: {
        total_participants: 0,
        variant_stats: {},
        is_statistically_significant: false,
        test_duration_days: 0,
      },
    });

    return await this.abTestRepository.save(abTest);
  }

  async startABTest(abTestId: string, tenantId: string): Promise<ABTest> {
    const abTest = await this.abTestRepository.findOne({
      where: { id: abTestId, tenant_id: tenantId },
    });

    if (!abTest) {
      throw new Error('AB test not found');
    }

    if (abTest.status !== ABTestStatus.DRAFT) {
      throw new Error('AB test can only be started from draft status');
    }

    abTest.status = ABTestStatus.RUNNING;
    abTest.start_date = new Date();

    if (abTest.maximum_duration_days) {
      abTest.planned_end_date = new Date(Date.now() + abTest.maximum_duration_days * 24 * 60 * 60 * 1000);
    }

    return await this.abTestRepository.save(abTest);
  }

  async stopABTest(abTestId: string, tenantId: string): Promise<ABTest> {
    const abTest = await this.abTestRepository.findOne({
      where: { id: abTestId, tenant_id: tenantId },
    });

    if (!abTest) {
      throw new Error('AB test not found');
    }

    abTest.status = ABTestStatus.COMPLETED;
    abTest.end_date = new Date();

    // Calculate final results
    await this.calculateTestResults(abTest);

    return await this.abTestRepository.save(abTest);
  }

  // Participant Assignment
  async assignParticipant(request: ParticipantAssignmentRequest): Promise<ABTestParticipant> {
    // Check if user is already assigned
    const existingParticipant = await this.participantRepository.findOne({
      where: {
        ab_test_id: request.ab_test_id,
        user_id: request.user_id,
      },
    });

    if (existingParticipant) {
      return existingParticipant;
    }

    // Get AB test details
    const abTest = await this.abTestRepository.findOne({
      where: { id: request.ab_test_id },
    });

    if (!abTest) {
      throw new Error('AB test not found');
    }

    if (abTest.status !== ABTestStatus.RUNNING) {
      throw new Error('AB test is not running');
    }

    // Check targeting rules
    if (abTest.targeting_rules && !this.matchesTargetingRules(abTest.targeting_rules, request)) {
      throw new Error('User does not match targeting rules');
    }

    // Assign variant
    const variant = this.assignVariant(abTest, request.user_id);

    // Create participant record
    const participant = this.participantRepository.create({
      ab_test_id: request.ab_test_id,
      user_id: request.user_id,
      variant,
      assigned_at: new Date(),
      session_id: request.session_id,
      device_id: request.device_id,
      user_attributes: request.user_attributes,
      device_info: request.device_info,
    });

    return await this.participantRepository.save(participant);
  }

  private assignVariant(abTest: ABTest, userId: string): string {
    const variants = Object.keys(abTest.variants);
    const trafficAllocation = abTest.traffic_allocation;

    // Generate consistent hash for user
    const hash = this.hashUserId(userId + abTest.id);
    const hashValue = hash % 100;

    let cumulativePercentage = 0;
    for (const variant of variants) {
      const percentage = trafficAllocation[variant] || 0;
      cumulativePercentage += percentage;

      if (hashValue < cumulativePercentage) {
        return variant;
      }
    }

    // Fallback to first variant if no match
    return variants[0] || 'control';
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private matchesTargetingRules(targetingRules: Record<string, any>, request: ParticipantAssignmentRequest): boolean {
    // Implement targeting rule matching logic
    // This could include user attributes, device info, geographic location, etc.
    
    if (targetingRules.user_attributes) {
      const userAttrs = request.user_attributes || {};
      for (const [key, value] of Object.entries(targetingRules.user_attributes)) {
        if (userAttrs[key] !== value) {
          return false;
        }
      }
    }

    if (targetingRules.device_info) {
      const deviceInfo = request.device_info || {};
      for (const [key, value] of Object.entries(targetingRules.device_info)) {
        if (deviceInfo[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  // Conversion Tracking
  async trackConversion(event: ConversionEvent): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: {
        ab_test_id: event.ab_test_id,
        user_id: event.user_id,
      },
    });

    if (!participant) {
      this.logger.warn(`No participant found for user ${event.user_id} in test ${event.ab_test_id}`);
      return;
    }

    if (participant.status !== ParticipantStatus.ACTIVE) {
      return; // Already converted or dropped
    }

    // Update participant status
    participant.status = ParticipantStatus.CONVERTED;
    participant.converted_at = event.timestamp || new Date();
    participant.conversion_data = event.event_data;

    await this.participantRepository.save(participant);

    // Check if we should auto-stop the test
    const abTest = await this.abTestRepository.findOne({
      where: { id: event.ab_test_id },
    });

    if (abTest?.auto_stop_on_significance) {
      await this.checkAndStopIfSignificant(abTest);
    }
  }

  private async checkAndStopIfSignificant(abTest: ABTest): Promise<void> {
    await this.calculateTestResults(abTest);

    if (abTest.results.is_statistically_significant && abTest.results.winner) {
      this.logger.log(`AB test ${abTest.id} reached statistical significance. Winner: ${abTest.results.winner}`);
      
      abTest.status = ABTestStatus.COMPLETED;
      abTest.end_date = new Date();
      await this.abTestRepository.save(abTest);

      // Auto-apply winner if configured
      if (abTest.auto_apply_winner) {
        await this.applyWinner(abTest);
      }
    }
  }

  private async calculateTestResults(abTest: ABTest): Promise<void> {
    const participants = await this.participantRepository.find({
      where: { ab_test_id: abTest.id },
    });

    const variants = Object.keys(abTest.variants);
    const variantStats: Record<string, any> = {};

    // Initialize variant stats
    for (const variant of variants) {
      variantStats[variant] = {
        participants: 0,
        conversions: 0,
        conversion_rate: 0,
        confidence_interval: [0, 0],
        is_winner: false,
        statistical_significance: 0,
      };
    }

    // Calculate stats for each variant
    for (const variant of variants) {
      const variantParticipants = participants.filter(p => p.variant === variant);
      const conversions = variantParticipants.filter(p => p.status === ParticipantStatus.CONVERTED);

      const participantCount = variantParticipants.length;
      const conversionCount = conversions.length;
      const conversionRate = participantCount > 0 ? conversionCount / participantCount : 0;

      // Calculate confidence interval (simplified)
      const confidenceInterval = this.calculateConfidenceInterval(conversionRate, participantCount);

      variantStats[variant] = {
        participants: participantCount,
        conversions: conversionCount,
        conversion_rate: conversionRate,
        confidence_interval: confidenceInterval,
        is_winner: false,
        statistical_significance: 0,
      };
    }

    // Determine winner and statistical significance
    const sortedVariants = variants.sort((a, b) => 
      variantStats[b].conversion_rate - variantStats[a].conversion_rate
    );

    const winner = sortedVariants[0];
    variantStats[winner].is_winner = true;

    // Calculate statistical significance (simplified chi-square test)
    const isSignificant = this.calculateStatisticalSignificance(variantStats, variants);
    
    // Calculate test duration
    const testDuration = abTest.start_date ? 
      Math.floor((new Date().getTime() - abTest.start_date.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    abTest.results = {
      total_participants: participants.length,
      variant_stats: variantStats,
      winner,
      is_statistically_significant: isSignificant,
      test_duration_days: testDuration,
    };
  }

  private calculateConfidenceInterval(conversionRate: number, sampleSize: number): [number, number] {
    if (sampleSize === 0) return [0, 0];

    const z = 1.96; // 95% confidence interval
    const margin = z * Math.sqrt((conversionRate * (1 - conversionRate)) / sampleSize);

    return [
      Math.max(0, conversionRate - margin),
      Math.min(1, conversionRate + margin),
    ];
  }

  private calculateStatisticalSignificance(variantStats: Record<string, any>, variants: string[]): boolean {
    // Simplified statistical significance calculation
    // In a real implementation, you would use proper statistical tests like chi-square or t-test
    
    if (variants.length < 2) return false;

    const conversionRates = variants.map(v => variantStats[v].conversion_rate);
    const maxRate = Math.max(...conversionRates);
    const minRate = Math.min(...conversionRates);

    // Simple heuristic: if the difference is large enough and we have enough participants
    const totalParticipants = variants.reduce((sum, v) => sum + variantStats[v].participants, 0);
    const rateDifference = maxRate - minRate;

    return totalParticipants > 100 && rateDifference > 0.05; // 5% minimum difference
  }

  private async applyWinner(abTest: ABTest): Promise<void> {
    // This would integrate with the feature flag service to apply the winning variant
    this.logger.log(`Applying winner ${abTest.results.winner} for AB test ${abTest.id}`);
    
    // Implementation would depend on how the AB test is integrated with feature flags
    // For example, update a feature flag with the winning variant value
  }

  // Analytics and Reporting
  async getABTestResults(abTestId: string, tenantId: string): Promise<ABTest> {
    const abTest = await this.abTestRepository.findOne({
      where: { id: abTestId, tenant_id: tenantId },
    });

    if (!abTest) {
      throw new Error('AB test not found');
    }

    await this.calculateTestResults(abTest);
    return abTest;
  }

  async getABTestsByTenant(tenantId: string, status?: ABTestStatus): Promise<ABTest[]> {
    const query = this.abTestRepository
      .createQueryBuilder('abTest')
      .where('abTest.tenant_id = :tenantId', { tenantId })
      .orderBy('abTest.created_at', 'DESC');

    if (status) {
      query.andWhere('abTest.status = :status', { status });
    }

    return await query.getMany();
  }

  async getParticipantStats(abTestId: string): Promise<any> {
    const participants = await this.participantRepository.find({
      where: { ab_test_id: abTestId },
    });

    const stats = {
      total_participants: participants.length,
      active_participants: participants.filter(p => p.status === ParticipantStatus.ACTIVE).length,
      converted_participants: participants.filter(p => p.status === ParticipantStatus.CONVERTED).length,
      dropped_participants: participants.filter(p => p.status === ParticipantStatus.DROPPED).length,
      variant_distribution: {},
    };

    // Calculate variant distribution
    const variants = [...new Set(participants.map(p => p.variant))];
    for (const variant of variants) {
      stats.variant_distribution[variant] = participants.filter(p => p.variant === variant).length;
    }

    return stats;
  }

  // Utility Methods
  private validateVariants(variants: Record<string, any>): void {
    if (!variants || Object.keys(variants).length === 0) {
      throw new Error('At least one variant must be provided');
    }

    if (!variants.control && !variants.Control && !variants.CONTROL) {
      throw new Error('A control variant must be provided');
    }
  }

  private generateEqualTrafficAllocation(variants: Record<string, any>): Record<string, number> {
    const variantNames = Object.keys(variants);
    const percentage = 100 / variantNames.length;

    return variantNames.reduce((allocation, variant) => {
      allocation[variant] = percentage;
      return allocation;
    }, {} as Record<string, number>);
  }

  private validateTrafficAllocation(
    allocation: Record<string, number>,
    variants: Record<string, any>,
  ): void {
    const variantNames = Object.keys(variants);
    const allocationKeys = Object.keys(allocation);

    // Check if all variants have allocation
    for (const variant of variantNames) {
      if (!(variant in allocation)) {
        throw new Error(`Traffic allocation missing for variant: ${variant}`);
      }
    }

    // Check if allocation sums to 100
    const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Traffic allocation must sum to 100%, got ${total}%`);
    }

    // Check if all values are positive
    for (const [variant, value] of Object.entries(allocation)) {
      if (value < 0 || value > 100) {
        throw new Error(`Invalid traffic allocation for ${variant}: ${value}%`);
      }
    }
  }

  // Cleanup and Maintenance
  async cleanupExpiredTests(): Promise<number> {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

    const result = await this.abTestRepository
      .createQueryBuilder()
      .update(ABTest)
      .set({ status: ABTestStatus.COMPLETED })
      .where('status = :status', { status: ABTestStatus.COMPLETED })
      .andWhere('end_date < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
