import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIModel, ModelType, ModelCategory, ModelStatus } from './entities/ai-model.entity';
import { AIPrediction, PredictionType, PredictionStatus } from './entities/ai-prediction.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { Patient } from '../patients/entities/patient.entity';

export interface TrainingData {
  features: Record<string, any>[];
  labels: any[];
  metadata?: Record<string, any>;
}

export interface PredictionRequest {
  model_id: string;
  input_data: Record<string, any>;
  prediction_type: PredictionType;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  feature_importance: Record<string, number>;
}

@Injectable()
export class MLService {
  private readonly logger = new Logger(MLService.name);

  constructor(
    @InjectRepository(AIModel)
    private aiModelRepository: Repository<AIModel>,
    @InjectRepository(AIPrediction)
    private aiPredictionRepository: Repository<AIPrediction>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    private analyticsService: AnalyticsService,
  ) {}

  // Model Management
  async createModel(
    tenantId: string,
    modelData: {
      model_name: string;
      description?: string;
      model_type: ModelType;
      model_category: ModelCategory;
      algorithm: string;
      model_config: Record<string, any>;
      training_data_config: Record<string, any>;
    },
  ): Promise<AIModel> {
    const model = this.aiModelRepository.create({
      tenant_id: tenantId,
      ...modelData,
      status: ModelStatus.TRAINING,
    });

    return await this.aiModelRepository.save(model);
  }

  async trainModel(modelId: string, trainingData: TrainingData): Promise<AIModel> {
    const model = await this.aiModelRepository.findOne({
      where: { id: modelId },
    });

    if (!model) {
      throw new Error('Model not found');
    }

    try {
      model.status = ModelStatus.TRAINING;
      await this.aiModelRepository.save(model);

      // Simulate model training (in production, this would call actual ML libraries)
      const metrics = await this.performModelTraining(model, trainingData);

      model.status = ModelStatus.TRAINED;
      model.accuracy = metrics.accuracy;
      model.precision = metrics.precision;
      model.recall = metrics.recall;
      model.f1_score = metrics.f1_score;
      model.feature_importance = metrics.feature_importance;
      model.training_samples = trainingData.features.length;
      model.last_trained_at = new Date();
      model.next_retrain_at = new Date(Date.now() + model.retrain_frequency * 24 * 60 * 60 * 1000);

      return await this.aiModelRepository.save(model);
    } catch (error) {
      model.status = ModelStatus.FAILED;
      await this.aiModelRepository.save(model);
      throw error;
    }
  }

  private async performModelTraining(model: AIModel, trainingData: TrainingData): Promise<ModelMetrics> {
    // Simulate training process (in production, this would use scikit-learn, TensorFlow, etc.)
    this.logger.log(`Training model ${model.model_name} with ${trainingData.features.length} samples`);

    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate metrics calculation
    const metrics: ModelMetrics = {
      accuracy: 0.85 + Math.random() * 0.1, // 0.85-0.95
      precision: 0.80 + Math.random() * 0.15, // 0.80-0.95
      recall: 0.82 + Math.random() * 0.13, // 0.82-0.95
      f1_score: 0.81 + Math.random() * 0.14, // 0.81-0.95
      feature_importance: this.calculateFeatureImportance(trainingData.features[0] || {}),
    };

    return metrics;
  }

  private calculateFeatureImportance(sampleFeatures: Record<string, any>): Record<string, number> {
    const importance: Record<string, number> = {};
    const features = Object.keys(sampleFeatures);
    
    features.forEach(feature => {
      importance[feature] = Math.random(); // Simulate feature importance
    });

    // Normalize to sum to 1
    const sum = Object.values(importance).reduce((a, b) => a + b, 0);
    Object.keys(importance).forEach(key => {
      importance[key] = importance[key] / sum;
    });

    return importance;
  }

  // Prediction Services
  async makePrediction(predictionRequest: PredictionRequest): Promise<AIPrediction> {
    const model = await this.aiModelRepository.findOne({
      where: { id: predictionRequest.model_id },
    });

    if (!model || model.status !== ModelStatus.DEPLOYED) {
      throw new Error('Model not available for predictions');
    }

    const prediction = this.aiPredictionRepository.create({
      model_id: predictionRequest.model_id,
      tenant_id: model.tenant_id,
      prediction_type: predictionRequest.prediction_type,
      input_data: predictionRequest.input_data,
      status: PredictionStatus.PENDING,
    });

    try {
      // Simulate prediction process
      const predictionResult = await this.performPrediction(model, predictionRequest.input_data);
      
      prediction.status = PredictionStatus.COMPLETED;
      prediction.prediction_result = predictionResult.result;
      prediction.confidence_score = predictionResult.confidence;
      prediction.probability_score = predictionResult.probability;
      prediction.feature_contributions = predictionResult.feature_contributions;
      prediction.explanation = predictionResult.explanation;
      prediction.expires_at = new Date(Date.now() + prediction.expiry_days * 24 * 60 * 60 * 1000);

      return await this.aiPredictionRepository.save(prediction);
    } catch (error) {
      prediction.status = PredictionStatus.FAILED;
      prediction.error_message = error.message;
      await this.aiPredictionRepository.save(prediction);
      throw error;
    }
  }

  private async performPrediction(model: AIModel, inputData: Record<string, any>): Promise<any> {
    // Simulate prediction process (in production, this would load and run the actual model)
    this.logger.log(`Making prediction with model ${model.model_name}`);

    // Simulate prediction time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate prediction based on model category
    switch (model.model_category) {
      case ModelCategory.NO_SHOW_PREDICTION:
        return this.predictNoShow(inputData);
      case ModelCategory.REVENUE_FORECASTING:
        return this.predictRevenue(inputData);
      case ModelCategory.PATIENT_OUTCOME:
        return this.predictPatientOutcome(inputData);
      case ModelCategory.TREATMENT_RECOMMENDATION:
        return this.predictTreatmentRecommendation(inputData);
      default:
        return this.generateGenericPrediction(inputData);
    }
  }

  private predictNoShow(inputData: Record<string, any>): any {
    const probability = 0.1 + Math.random() * 0.3; // 10-40% no-show probability
    const confidence = 0.7 + Math.random() * 0.25; // 70-95% confidence

    return {
      result: {
        no_show_probability: probability,
        predicted_outcome: probability > 0.25 ? 'likely_no_show' : 'likely_attendance',
        risk_level: probability > 0.3 ? 'high' : probability > 0.2 ? 'medium' : 'low',
      },
      confidence: confidence,
      probability: probability,
      feature_contributions: {
        appointment_history: Math.random() * 0.3,
        patient_age: Math.random() * 0.2,
        appointment_type: Math.random() * 0.25,
        time_slot: Math.random() * 0.15,
        weather: Math.random() * 0.1,
      },
      explanation: {
        primary_factor: 'Previous no-show history',
        secondary_factors: ['Patient age', 'Appointment type'],
        recommendation: probability > 0.25 ? 'Send reminder' : 'Standard confirmation',
      },
    };
  }

  private predictRevenue(inputData: Record<string, any>): any {
    const baseRevenue = 50000 + Math.random() * 100000; // $50k-$150k
    const confidence = 0.8 + Math.random() * 0.15; // 80-95% confidence

    return {
      result: {
        predicted_revenue: baseRevenue,
        confidence_interval: {
          lower: baseRevenue * 0.85,
          upper: baseRevenue * 1.15,
        },
        growth_rate: -0.05 + Math.random() * 0.2, // -5% to +15%
        seasonal_factor: Math.random() * 0.3 - 0.15, // -15% to +15%
      },
      confidence: confidence,
      probability: confidence,
      feature_contributions: {
        historical_revenue: Math.random() * 0.4,
        appointment_volume: Math.random() * 0.3,
        seasonal_trends: Math.random() * 0.2,
        market_conditions: Math.random() * 0.1,
      },
      explanation: {
        primary_factor: 'Historical revenue trends',
        secondary_factors: ['Appointment volume', 'Seasonal patterns'],
        recommendation: 'Monitor appointment booking trends',
      },
    };
  }

  private predictPatientOutcome(inputData: Record<string, any>): any {
    const successProbability = 0.7 + Math.random() * 0.25; // 70-95% success
    const confidence = 0.75 + Math.random() * 0.2; // 75-95% confidence

    return {
      result: {
        success_probability: successProbability,
        predicted_outcome: successProbability > 0.8 ? 'excellent' : 
                          successProbability > 0.7 ? 'good' : 
                          successProbability > 0.6 ? 'moderate' : 'poor',
        risk_factors: ['Age', 'Medical history', 'Treatment compliance'],
        estimated_recovery_time: Math.floor(30 + Math.random() * 90), // 30-120 days
      },
      confidence: confidence,
      probability: successProbability,
      feature_contributions: {
        patient_age: Math.random() * 0.25,
        medical_history: Math.random() * 0.3,
        treatment_compliance: Math.random() * 0.2,
        provider_experience: Math.random() * 0.15,
        treatment_complexity: Math.random() * 0.1,
      },
      explanation: {
        primary_factor: 'Patient medical history',
        secondary_factors: ['Age', 'Treatment compliance'],
        recommendation: 'Consider additional monitoring',
      },
    };
  }

  private predictTreatmentRecommendation(inputData: Record<string, any>): any {
    const treatments = ['Routine cleaning', 'Filling', 'Root canal', 'Crown', 'Extraction'];
    const recommendedTreatment = treatments[Math.floor(Math.random() * treatments.length)];
    const confidence = 0.8 + Math.random() * 0.15; // 80-95% confidence

    return {
      result: {
        recommended_treatment: recommendedTreatment,
        urgency_level: Math.random() > 0.5 ? 'high' : 'medium',
        estimated_cost: Math.floor(100 + Math.random() * 2000), // $100-$2100
        success_rate: 0.75 + Math.random() * 0.2, // 75-95%
        alternative_treatments: treatments.filter(t => t !== recommendedTreatment).slice(0, 2),
      },
      confidence: confidence,
      probability: confidence,
      feature_contributions: {
        symptoms: Math.random() * 0.35,
        x_ray_results: Math.random() * 0.25,
        patient_age: Math.random() * 0.2,
        medical_history: Math.random() * 0.15,
        budget_constraints: Math.random() * 0.05,
      },
      explanation: {
        primary_factor: 'Current symptoms and condition',
        secondary_factors: ['X-ray results', 'Patient age'],
        recommendation: 'Schedule treatment within recommended timeframe',
      },
    };
  }

  private generateGenericPrediction(inputData: Record<string, any>): any {
    return {
      result: {
        predicted_value: Math.random() * 100,
        confidence_level: 'medium',
      },
      confidence: 0.7 + Math.random() * 0.2,
      probability: 0.7 + Math.random() * 0.2,
      feature_contributions: {},
      explanation: {
        primary_factor: 'Data patterns',
        recommendation: 'Monitor trends',
      },
    };
  }

  // Data Collection for Training
  async collectTrainingData(
    tenantId: string,
    modelCategory: ModelCategory,
    dateRange: { start_date: Date; end_date: Date },
  ): Promise<TrainingData> {
    switch (modelCategory) {
      case ModelCategory.NO_SHOW_PREDICTION:
        return await this.collectNoShowTrainingData(tenantId, dateRange);
      case ModelCategory.REVENUE_FORECASTING:
        return await this.collectRevenueTrainingData(tenantId, dateRange);
      case ModelCategory.PATIENT_OUTCOME:
        return await this.collectPatientOutcomeTrainingData(tenantId, dateRange);
      default:
        return { features: [], labels: [] };
    }
  }

  private async collectNoShowTrainingData(
    tenantId: string,
    dateRange: { start_date: Date; end_date: Date },
  ): Promise<TrainingData> {
    const appointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.patient', 'patient')
      .where('appointment.tenant_id = :tenant_id', { tenant_id: tenantId })
      .andWhere('appointment.start_time BETWEEN :start_date AND :end_date', {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      })
      .getMany();

    const features = appointments.map(appointment => ({
      patient_age: this.calculatePatientAge(appointment.patient),
      appointment_type: appointment.appointment_type,
      time_slot: appointment.start_time.getHours(),
      day_of_week: appointment.start_time.getDay(),
      is_weekend: appointment.start_time.getDay() >= 6,
      appointment_duration: this.getAppointmentDuration(appointment),
      previous_no_shows: Math.floor(Math.random() * 5), // Simulate
      booking_lead_time: this.getBookingLeadTime(appointment),
    }));

    const labels = appointments.map(appointment => 
      appointment.status === 'no_show' ? 1 : 0
    );

    return { features, labels };
  }

  private async collectRevenueTrainingData(
    tenantId: string,
    dateRange: { start_date: Date; end_date: Date },
  ): Promise<TrainingData> {
    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenant_id = :tenant_id', { tenant_id: tenantId })
      .andWhere('invoice.invoice_date BETWEEN :start_date AND :end_date', {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      })
      .getMany();

    const features = invoices.map(invoice => ({
      month: invoice.invoice_date.getMonth(),
      day_of_month: invoice.invoice_date.getDate(),
      is_weekend: invoice.invoice_date.getDay() >= 6,
      invoice_amount: invoice.total_amount,
      payment_status: invoice.status,
      patient_count: Math.floor(Math.random() * 100), // Simulate
    }));

    const labels = invoices.map(invoice => invoice.total_amount);

    return { features, labels };
  }

  private async collectPatientOutcomeTrainingData(
    tenantId: string,
    dateRange: { start_date: Date; end_date: Date },
  ): Promise<TrainingData> {
    // Simulate patient outcome data collection
    const features = [];
    const labels = [];

    for (let i = 0; i < 100; i++) {
      features.push({
        patient_age: 18 + Math.random() * 60,
        treatment_type: ['cleaning', 'filling', 'extraction', 'crown'][Math.floor(Math.random() * 4)],
        treatment_duration: 30 + Math.random() * 120,
        provider_experience: 1 + Math.random() * 20,
        patient_compliance: Math.random(),
      });

      labels.push(Math.random() > 0.3 ? 1 : 0); // 70% success rate
    }

    return { features, labels };
  }

  // Helper methods
  private calculatePatientAge(patient: any): number {
    if (!patient || !patient.date_of_birth) return 35; // Default age
    const today = new Date();
    const birthDate = new Date(patient.date_of_birth);
    return today.getFullYear() - birthDate.getFullYear();
  }

  private getAppointmentDuration(appointment: any): number {
    if (!appointment.start_time || !appointment.end_time) return 60;
    return (new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60);
  }

  private getBookingLeadTime(appointment: any): number {
    if (!appointment.created_at || !appointment.start_time) return 24;
    return (new Date(appointment.start_time).getTime() - new Date(appointment.created_at).getTime()) / (1000 * 60 * 60);
  }

  // Model Deployment
  async deployModel(modelId: string): Promise<AIModel> {
    const model = await this.aiModelRepository.findOne({
      where: { id: modelId },
    });

    if (!model || model.status !== ModelStatus.TRAINED) {
      throw new Error('Model must be trained before deployment');
    }

    model.status = ModelStatus.DEPLOYED;
    model.last_deployed_at = new Date();
    model.is_production = true;

    return await this.aiModelRepository.save(model);
  }

  // Model Monitoring
  async getModelPerformance(modelId: string): Promise<any> {
    const model = await this.aiModelRepository.findOne({
      where: { id: modelId },
    });

    if (!model) {
      throw new Error('Model not found');
    }

    // Get recent predictions and their accuracy
    const recentPredictions = await this.aiPredictionRepository
      .createQueryBuilder('prediction')
      .where('prediction.model_id = :model_id', { model_id: modelId })
      .andWhere('prediction.is_validated = true')
      .orderBy('prediction.created_at', 'DESC')
      .limit(100)
      .getMany();

    const avgAccuracy = recentPredictions.length > 0 
      ? recentPredictions.reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / recentPredictions.length
      : 0;

    return {
      model_id: modelId,
      current_accuracy: avgAccuracy,
      training_accuracy: model.accuracy,
      prediction_count: recentPredictions.length,
      last_prediction: recentPredictions[0]?.created_at,
      performance_trend: this.calculatePerformanceTrend(recentPredictions),
    };
  }

  private calculatePerformanceTrend(predictions: AIPrediction[]): string {
    if (predictions.length < 2) return 'stable';
    
    const recent = predictions.slice(0, 10).reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / 10;
    const older = predictions.slice(10, 20).reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / 10;
    
    if (recent > older + 0.05) return 'improving';
    if (recent < older - 0.05) return 'declining';
    return 'stable';
  }
}
