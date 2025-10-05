import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag, FeatureFlagType, FeatureFlagStatus, FeatureFlagRolloutStrategy } from './entities/feature-flag.entity';
import { FeatureFlagEvaluation, EvaluationContext } from './entities/feature-flag-evaluation.entity';

export interface FeatureFlagEvaluationRequest {
  tenant_id: string;
  feature_key: string;
  context_type: EvaluationContext;
  context_id: string;
  context_data?: Record<string, any>;
  default_value?: any;
}

export interface FeatureFlagEvaluationResult {
  feature_key: string;
  value: any;
  variant?: string;
  is_targeted: boolean;
  rollout_percentage: number;
  evaluation_context: Record<string, any>;
}

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly evaluationCache = new Map<string, FeatureFlagEvaluationResult>();

  constructor(
    @InjectRepository(FeatureFlag)
    private featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(FeatureFlagEvaluation)
    private evaluationRepository: Repository<FeatureFlagEvaluation>,
  ) {}

  // Feature Flag Management
  async createFeatureFlag(
    tenantId: string,
    flagData: {
      key: string;
      name: string;
      description?: string;
      type: FeatureFlagType;
      default_value: any;
      rollout_strategy: FeatureFlagRolloutStrategy;
      rollout_config: Record<string, any>;
      targeting_rules?: Record<string, any>;
      variants?: Record<string, any>;
      is_experiment?: boolean;
      experiment_config?: Record<string, any>;
    },
  ): Promise<FeatureFlag> {
    const flag = this.featureFlagRepository.create({
      tenant_id: tenantId,
      ...flagData,
      status: FeatureFlagStatus.DRAFT,
    });

    return await this.featureFlagRepository.save(flag);
  }

  async updateFeatureFlag(
    flagId: string,
    tenantId: string,
    updateData: Partial<FeatureFlag>,
  ): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findOne({
      where: { id: flagId, tenant_id: tenantId },
    });

    if (!flag) {
      throw new Error('Feature flag not found');
    }

    Object.assign(flag, updateData);
    return await this.featureFlagRepository.save(flag);
  }

  async activateFeatureFlag(flagId: string, tenantId: string): Promise<FeatureFlag> {
    return await this.updateFeatureFlag(flagId, tenantId, {
      status: FeatureFlagStatus.ACTIVE,
    });
  }

  async deactivateFeatureFlag(flagId: string, tenantId: string): Promise<FeatureFlag> {
    return await this.updateFeatureFlag(flagId, tenantId, {
      status: FeatureFlagStatus.INACTIVE,
    });
  }

  // Feature Flag Evaluation
  async evaluateFeatureFlag(request: FeatureFlagEvaluationRequest): Promise<FeatureFlagEvaluationResult> {
    const cacheKey = `${request.tenant_id}:${request.feature_key}:${request.context_type}:${request.context_id}`;
    
    // Check cache first
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!;
    }

    try {
      // Get feature flag
      const flag = await this.featureFlagRepository.findOne({
        where: {
          key: request.feature_key,
          tenant_id: request.tenant_id,
          status: FeatureFlagStatus.ACTIVE,
        },
      });

      if (!flag) {
        return {
          feature_key: request.feature_key,
          value: request.default_value || this.getDefaultValueForType(flag?.type || FeatureFlagType.BOOLEAN),
          is_targeted: false,
          rollout_percentage: 0,
          evaluation_context: request.context_data || {},
        };
      }

      // Check if flag is within date range
      if (flag.start_date && new Date() < flag.start_date) {
        return this.createEvaluationResult(flag, request, false, 0);
      }

      if (flag.end_date && new Date() > flag.end_date) {
        return this.createEvaluationResult(flag, request, false, 0);
      }

      // Evaluate targeting rules
      const targetingResult = await this.evaluateTargetingRules(flag, request);
      if (targetingResult.is_targeted) {
        const result = this.createEvaluationResult(flag, request, true, 100, targetingResult.variant);
        await this.saveEvaluation(flag, request, result);
        this.evaluationCache.set(cacheKey, result);
        return result;
      }

      // Evaluate rollout strategy
      const rolloutResult = await this.evaluateRolloutStrategy(flag, request);
      const result = this.createEvaluationResult(flag, request, false, rolloutResult.percentage, rolloutResult.variant);
      
      await this.saveEvaluation(flag, request, result);
      this.evaluationCache.set(cacheKey, result);
      return result;

    } catch (error) {
      this.logger.error('Error evaluating feature flag:', error);
      return {
        feature_key: request.feature_key,
        value: request.default_value || false,
        is_targeted: false,
        rollout_percentage: 0,
        evaluation_context: request.context_data || {},
      };
    }
  }

  private async evaluateTargetingRules(
    flag: FeatureFlag,
    request: FeatureFlagEvaluationRequest,
  ): Promise<{ is_targeted: boolean; variant?: string }> {
    if (!flag.targeting_rules) {
      return { is_targeted: false };
    }

    const rules = flag.targeting_rules;
    let isTargeted = false;
    let matchedVariant = null;

    // User-based targeting
    if (rules.users && request.context_type === EvaluationContext.USER) {
      const userId = request.context_id;
      if (rules.users.includes(userId)) {
        isTargeted = true;
        matchedVariant = rules.variant || 'targeted';
      }
    }

    // Attribute-based targeting
    if (rules.attributes && request.context_data) {
      const contextData = request.context_data;
      let matchesAll = true;

      for (const [key, value] of Object.entries(rules.attributes)) {
        if (contextData[key] !== value) {
          matchesAll = false;
          break;
        }
      }

      if (matchesAll) {
        isTargeted = true;
        matchedVariant = rules.variant || 'targeted';
      }
    }

    // Percentage-based targeting
    if (rules.percentage && !isTargeted) {
      const hash = this.hashContextId(request.context_id + request.feature_key);
      const percentage = hash % 100;
      if (percentage < rules.percentage) {
        isTargeted = true;
        matchedVariant = rules.variant || 'percentage';
      }
    }

    return { is_targeted: isTargeted, variant: matchedVariant };
  }

  private async evaluateRolloutStrategy(
    flag: FeatureFlag,
    request: FeatureFlagEvaluationRequest,
  ): Promise<{ percentage: number; variant?: string }> {
    const config = flag.rollout_config;
    let percentage = 0;
    let variant = null;

    switch (flag.rollout_strategy) {
      case FeatureFlagRolloutStrategy.IMMEDIATE:
        percentage = 100;
        break;

      case FeatureFlagRolloutStrategy.PERCENTAGE:
        percentage = config.percentage || 0;
        break;

      case FeatureFlagRolloutStrategy.GRADUAL:
        percentage = this.calculateGradualRollout(config);
        break;

      case FeatureFlagRolloutStrategy.A_B_TEST:
        const abTestResult = await this.evaluateABTest(flag, request);
        percentage = abTestResult.percentage;
        variant = abTestResult.variant;
        break;
    }

    // Check if user falls within rollout percentage
    const hash = this.hashContextId(request.context_id + request.feature_key);
    const userPercentage = hash % 100;
    const isInRollout = userPercentage < percentage;

    return {
      percentage: isInRollout ? percentage : 0,
      variant: isInRollout ? variant : null,
    };
  }

  private calculateGradualRollout(config: Record<string, any>): number {
    const startDate = new Date(config.start_date || Date.now());
    const endDate = new Date(config.end_date || Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default
    const now = new Date();

    if (now < startDate) return 0;
    if (now > endDate) return config.max_percentage || 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = elapsed / totalDuration;

    return Math.min(progress * (config.max_percentage || 100), config.max_percentage || 100);
  }

  private async evaluateABTest(
    flag: FeatureFlag,
    request: FeatureFlagEvaluationRequest,
  ): Promise<{ percentage: number; variant?: string }> {
    // This would integrate with the AB testing service
    // For now, return a simple variant assignment
    const hash = this.hashContextId(request.context_id);
    const variants = Object.keys(flag.variants || {});
    
    if (variants.length === 0) {
      return { percentage: 100, variant: 'control' };
    }

    const variantIndex = hash % variants.length;
    const selectedVariant = variants[variantIndex];

    return {
      percentage: 100,
      variant: selectedVariant,
    };
  }

  private createEvaluationResult(
    flag: FeatureFlag,
    request: FeatureFlagEvaluationRequest,
    isTargeted: boolean,
    rolloutPercentage: number,
    variant?: string,
  ): FeatureFlagEvaluationResult {
    let value = flag.default_value;

    // Apply variant value if specified
    if (variant && flag.variants && flag.variants[variant]) {
      value = flag.variants[variant];
    }

    return {
      feature_key: flag.key,
      value,
      variant,
      is_targeted: isTargeted,
      rollout_percentage: rolloutPercentage,
      evaluation_context: request.context_data || {},
    };
  }

  private async saveEvaluation(
    flag: FeatureFlag,
    request: FeatureFlagEvaluationRequest,
    result: FeatureFlagEvaluationResult,
  ): Promise<void> {
    try {
      const evaluation = this.evaluationRepository.create({
        feature_flag_id: flag.id,
        context_type: request.context_type,
        context_id: request.context_id,
        evaluated_value: result.value,
        variant: result.variant,
        rollout_percentage: result.rollout_percentage,
        is_targeted: result.is_targeted,
        evaluation_context: request.context_data,
        evaluated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      await this.evaluationRepository.save(evaluation);

      // Update flag metrics
      await this.updateFlagMetrics(flag.id);

    } catch (error) {
      this.logger.error('Error saving feature flag evaluation:', error);
    }
  }

  private async updateFlagMetrics(flagId: string): Promise<void> {
    await this.featureFlagRepository
      .createQueryBuilder()
      .update(FeatureFlag)
      .set({
        evaluation_count: () => 'evaluation_count + 1',
        positive_evaluations: () => `positive_evaluations + CASE WHEN ${flagId} IN (
          SELECT feature_flag_id FROM feature_flag_evaluations 
          WHERE feature_flag_id = :flagId AND evaluated_value = true
        ) THEN 1 ELSE 0 END`,
      })
      .where('id = :flagId', { flagId })
      .execute();
  }

  // Utility Methods
  private hashContextId(contextId: string): number {
    let hash = 0;
    for (let i = 0; i < contextId.length; i++) {
      const char = contextId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getDefaultValueForType(type: FeatureFlagType): any {
    switch (type) {
      case FeatureFlagType.BOOLEAN:
        return false;
      case FeatureFlagType.STRING:
        return '';
      case FeatureFlagType.NUMBER:
        return 0;
      case FeatureFlagType.JSON:
        return {};
      default:
        return false;
    }
  }

  // Bulk Evaluation
  async evaluateMultipleFlags(
    tenantId: string,
    requests: Omit<FeatureFlagEvaluationRequest, 'tenant_id'>[],
  ): Promise<Record<string, FeatureFlagEvaluationResult>> {
    const results: Record<string, FeatureFlagEvaluationResult> = {};

    for (const request of requests) {
      const result = await this.evaluateFeatureFlag({
        ...request,
        tenant_id: tenantId,
      });
      results[request.feature_key] = result;
    }

    return results;
  }

  // Cache Management
  clearCache(): void {
    this.evaluationCache.clear();
  }

  clearCacheForTenant(tenantId: string): void {
    for (const [key] of this.evaluationCache) {
      if (key.startsWith(`${tenantId}:`)) {
        this.evaluationCache.delete(key);
      }
    }
  }

  // Analytics
  async getFlagAnalytics(flagId: string, tenantId: string): Promise<any> {
    const flag = await this.featureFlagRepository.findOne({
      where: { id: flagId, tenant_id: tenantId },
    });

    if (!flag) {
      throw new Error('Feature flag not found');
    }

    const evaluations = await this.evaluationRepository
      .createQueryBuilder('evaluation')
      .where('evaluation.feature_flag_id = :flagId', { flagId })
      .andWhere('evaluation.evaluated_at >= :since', { 
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      })
      .getMany();

    const totalEvaluations = evaluations.length;
    const positiveEvaluations = evaluations.filter(e => e.evaluated_value === true).length;
    const targetedEvaluations = evaluations.filter(e => e.is_targeted).length;

    return {
      flag_id: flagId,
      total_evaluations: totalEvaluations,
      positive_evaluations: positiveEvaluations,
      positive_rate: totalEvaluations > 0 ? (positiveEvaluations / totalEvaluations) : 0,
      targeted_evaluations: targetedEvaluations,
      targeted_rate: totalEvaluations > 0 ? (targetedEvaluations / totalEvaluations) : 0,
      variants: this.getVariantStats(evaluations),
      daily_stats: this.getDailyStats(evaluations),
    };
  }

  private getVariantStats(evaluations: FeatureFlagEvaluation[]): Record<string, any> {
    const variantStats: Record<string, { count: number; positive_count: number }> = {};

    for (const evaluation of evaluations) {
      const variant = evaluation.variant || 'default';
      if (!variantStats[variant]) {
        variantStats[variant] = { count: 0, positive_count: 0 };
      }
      variantStats[variant].count++;
      if (evaluation.evaluated_value === true) {
        variantStats[variant].positive_count++;
      }
    }

    return Object.entries(variantStats).reduce((acc, [variant, stats]) => {
      acc[variant] = {
        ...stats,
        positive_rate: stats.count > 0 ? stats.positive_count / stats.count : 0,
      };
      return acc;
    }, {} as Record<string, any>);
  }

  private getDailyStats(evaluations: FeatureFlagEvaluation[]): Record<string, number> {
    const dailyStats: Record<string, number> = {};

    for (const evaluation of evaluations) {
      const date = evaluation.evaluated_at.toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    }

    return dailyStats;
  }
}
