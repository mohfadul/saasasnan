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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../tenants/tenant.guard';
import { MLService, TrainingData, PredictionRequest } from './ml-service';
import { InsightsService, InsightGenerationConfig } from './insights.service';
import { AIModel, ModelType, ModelCategory } from './entities/ai-model.entity';
import { AIPrediction, PredictionType } from './entities/ai-prediction.entity';
import { AIInsight, InsightCategory, InsightPriority } from './entities/ai-insight.entity';

@Controller('ai')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AIController {
  constructor(
    private readonly mlService: MLService,
    private readonly insightsService: InsightsService,
  ) {}

  // Model Management
  @Post('models')
  async createModel(
    @Request() req: any,
    @Body() modelData: {
      model_name: string;
      description?: string;
      model_type: ModelType;
      model_category: ModelCategory;
      algorithm: string;
      model_config: Record<string, any>;
      training_data_config: Record<string, any>;
    },
  ) {
    return await this.mlService.createModel(req.user.tenant_id, modelData);
  }

  @Get('models')
  async getModels(
    @Request() req: any,
    @Query('category') category?: ModelCategory,
    @Query('status') status?: string,
  ) {
    // Implementation would fetch models for the tenant
    return { models: [] };
  }

  @Get('models/:id')
  async getModelById(@Param('id') id: string, @Request() req: any) {
    // Implementation would fetch specific model
    return { id, message: 'Model details' };
  }

  @Post('models/:id/train')
  async trainModel(
    @Param('id') id: string,
    @Request() req: any,
    @Body() trainingData: TrainingData,
  ) {
    return await this.mlService.trainModel(id, trainingData);
  }

  @Post('models/:id/deploy')
  async deployModel(@Param('id') id: string, @Request() req: any) {
    return await this.mlService.deployModel(id);
  }

  @Get('models/:id/performance')
  async getModelPerformance(@Param('id') id: string, @Request() req: any) {
    return await this.mlService.getModelPerformance(id);
  }

  // Predictions
  @Post('predictions')
  async makePrediction(
    @Request() req: any,
    @Body() predictionRequest: PredictionRequest,
  ) {
    return await this.mlService.makePrediction(predictionRequest);
  }

  @Get('predictions')
  async getPredictions(
    @Request() req: any,
    @Query('model_id') modelId?: string,
    @Query('prediction_type') predictionType?: PredictionType,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
  ) {
    // Implementation would fetch predictions for the tenant
    return { predictions: [] };
  }

  @Get('predictions/:id')
  async getPredictionById(@Param('id') id: string, @Request() req: any) {
    // Implementation would fetch specific prediction
    return { id, message: 'Prediction details' };
  }

  // Insights
  @Post('insights/generate')
  async generateInsights(
    @Request() req: any,
    @Body() config: {
      categories?: InsightCategory[];
      priority_threshold?: InsightPriority;
      auto_generate?: boolean;
    },
  ) {
    const insightConfig: InsightGenerationConfig = {
      tenant_id: req.user.tenant_id,
      clinic_id: req.user.clinic_id,
      ...config,
    };

    return await this.insightsService.generateInsights(insightConfig);
  }

  @Get('insights')
  async getInsights(
    @Request() req: any,
    @Query('category') category?: InsightCategory,
    @Query('priority') priority?: InsightPriority,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
  ) {
    return await this.insightsService.getInsights(req.user.tenant_id, {
      category,
      priority,
      status: status as any,
      limit,
    });
  }

  @Get('insights/:id')
  async getInsightById(@Param('id') id: string, @Request() req: any) {
    // Implementation would fetch specific insight
    return { id, message: 'Insight details' };
  }

  @Put('insights/:id/status')
  async updateInsightStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateData: {
      status: string;
      review_notes?: string;
    },
  ) {
    return await this.insightsService.updateInsightStatus(
      id,
      updateData.status as any,
      updateData.review_notes,
      req.user.id,
    );
  }

  // AI Dashboard Analytics
  @Get('dashboard/overview')
  async getAIDashboardOverview(@Request() req: any) {
    const filters = {
      tenant_id: req.user.tenant_id,
      clinic_id: req.user.clinic_id,
    };

    // Get recent insights
    const recentInsights = await this.insightsService.getInsights(req.user.tenant_id, {
      limit: 10,
    });

    // Get model performance summary
    const modelPerformance = {
      active_models: 5,
      total_predictions: 1250,
      average_accuracy: 0.87,
      insights_generated: recentInsights.length,
    };

    // Get prediction trends
    const predictionTrends = {
      no_show_predictions: {
        total: 450,
        accuracy: 0.85,
        trend: 'improving',
      },
      revenue_forecasts: {
        total: 120,
        accuracy: 0.92,
        trend: 'stable',
      },
      patient_outcomes: {
        total: 680,
        accuracy: 0.88,
        trend: 'improving',
      },
    };

    return {
      model_performance: modelPerformance,
      prediction_trends: predictionTrends,
      recent_insights: recentInsights,
      ai_recommendations: this.generateAIRecommendations(recentInsights),
    };
  }

  // Predictive Analytics Endpoints
  @Get('predictions/no-show-risk')
  async getNoShowRiskPredictions(
    @Request() req: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    // Implementation would get no-show risk predictions for upcoming appointments
    return {
      high_risk_appointments: [
        {
          appointment_id: '1',
          patient_name: 'John Doe',
          appointment_time: '2024-01-15T10:00:00Z',
          no_show_probability: 0.35,
          risk_level: 'high',
          recommendations: ['Send reminder call', 'Require confirmation'],
        },
      ],
      total_appointments: 45,
      high_risk_count: 8,
      medium_risk_count: 12,
      low_risk_count: 25,
    };
  }

  @Get('predictions/revenue-forecast')
  async getRevenueForecast(
    @Request() req: any,
    @Query('period') period: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
  ) {
    // Implementation would get revenue forecasts
    const forecast = {
      period: period,
      predicted_revenue: 125000,
      confidence_interval: {
        lower: 115000,
        upper: 135000,
      },
      growth_rate: 0.12,
      factors: {
        appointment_volume: 0.4,
        seasonal_trends: 0.3,
        pricing_changes: 0.2,
        market_conditions: 0.1,
      },
    };

    return forecast;
  }

  @Get('predictions/patient-outcomes')
  async getPatientOutcomePredictions(
    @Request() req: any,
    @Query('treatment_type') treatmentType?: string,
  ) {
    // Implementation would get patient outcome predictions
    return {
      treatment_type: treatmentType || 'all',
      success_predictions: [
        {
          patient_id: '1',
          treatment_plan_id: '1',
          success_probability: 0.92,
          estimated_recovery_time: 45,
          risk_factors: ['Age'],
          recommendations: ['Regular follow-ups'],
        },
      ],
      average_success_rate: 0.87,
      total_predictions: 150,
    };
  }

  // AI Recommendations
  @Get('recommendations')
  async getAIRecommendations(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
  ) {
    const recommendations = [
      {
        id: '1',
        title: 'Optimize Appointment Scheduling',
        description: 'Based on no-show predictions, consider implementing dynamic scheduling',
        category: 'operational',
        priority: 'high',
        confidence: 0.89,
        expected_impact: 'Reduce no-show rate by 25%',
        actions: [
          'Implement appointment reminders',
          'Adjust scheduling for high-risk patients',
          'Offer flexible time slots',
        ],
      },
      {
        id: '2',
        title: 'Revenue Optimization Strategy',
        description: 'Revenue forecast indicates opportunity for 15% growth',
        category: 'financial',
        priority: 'medium',
        confidence: 0.82,
        expected_impact: 'Increase revenue by $18,750/month',
        actions: [
          'Focus on high-value procedures',
          'Implement dynamic pricing',
          'Improve collection rates',
        ],
      },
    ];

    return {
      recommendations: recommendations.filter(r => 
        !category || r.category === category
      ).filter(r => 
        !priority || r.priority === priority
      ),
      total_count: recommendations.length,
    };
  }

  // AI Automation
  @Get('automation/rules')
  async getAutomationRules(@Request() req: any) {
    return {
      active_rules: [
        {
          id: '1',
          name: 'No-Show Prevention',
          type: 'appointment',
          trigger: 'appointment_scheduled',
          action: 'send_reminder',
          status: 'active',
          success_rate: 0.85,
        },
        {
          id: '2',
          name: 'Payment Follow-up',
          type: 'billing',
          trigger: 'invoice_overdue',
          action: 'send_payment_reminder',
          status: 'active',
          success_rate: 0.72,
        },
      ],
      total_rules: 8,
      active_count: 6,
    };
  }

  @Post('automation/rules')
  async createAutomationRule(
    @Request() req: any,
    @Body() ruleData: {
      name: string;
      type: string;
      trigger: string;
      action: string;
      conditions?: Record<string, any>;
    },
  ) {
    // Implementation would create automation rule
    return {
      id: 'new-rule-id',
      ...ruleData,
      status: 'active',
      created_at: new Date(),
    };
  }

  // AI Model Training
  @Post('training/data-collection')
  async collectTrainingData(
    @Request() req: any,
    @Body() collectionConfig: {
      model_category: ModelCategory;
      date_range: {
        start_date: string;
        end_date: string;
      };
    },
  ) {
    const trainingData = await this.mlService.collectTrainingData(
      req.user.tenant_id,
      collectionConfig.model_category,
      {
        start_date: new Date(collectionConfig.date_range.start_date),
        end_date: new Date(collectionConfig.date_range.end_date),
      },
    );

    return {
      model_category: collectionConfig.model_category,
      samples_collected: trainingData.features.length,
      data_quality_score: this.calculateDataQuality(trainingData),
      recommendations: this.getDataCollectionRecommendations(trainingData),
    };
  }

  // Utility methods
  private generateAIRecommendations(insights: AIInsight[]): any[] {
    const recommendations = [];

    if (insights.some(i => i.category === InsightCategory.APPOINTMENT && i.priority === InsightPriority.HIGH)) {
      recommendations.push({
        title: 'Optimize Appointment Management',
        description: 'High priority appointment insights detected. Consider implementing AI-driven scheduling optimization.',
        priority: 'high',
        category: 'operational',
      });
    }

    if (insights.some(i => i.category === InsightCategory.REVENUE && i.priority === InsightPriority.HIGH)) {
      recommendations.push({
        title: 'Revenue Optimization',
        description: 'Revenue insights suggest optimization opportunities. Consider implementing predictive billing strategies.',
        priority: 'high',
        category: 'financial',
      });
    }

    return recommendations;
  }

  private calculateDataQuality(trainingData: TrainingData): number {
    // Simulate data quality calculation
    return 0.85 + Math.random() * 0.1; // 85-95% quality
  }

  private getDataCollectionRecommendations(trainingData: TrainingData): string[] {
    const recommendations = [];

    if (trainingData.features.length < 100) {
      recommendations.push('Collect more training data for better model accuracy');
    }

    if (trainingData.features.length > 0) {
      const featureCount = Object.keys(trainingData.features[0]).length;
      if (featureCount < 5) {
        recommendations.push('Consider adding more features for comprehensive predictions');
      }
    }

    return recommendations;
  }
}
