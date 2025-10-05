import { apiClient } from './api';

export interface AIModel {
  id: string;
  model_name: string;
  description?: string;
  model_type: 'predictive' | 'classification' | 'regression' | 'clustering' | 'nlp' | 'computer_vision' | 'recommendation';
  model_category: 'appointment_prediction' | 'revenue_forecasting' | 'patient_outcome' | 'no_show_prediction' | 'treatment_recommendation' | 'billing_optimization' | 'clinical_insights' | 'patient_engagement';
  status: 'training' | 'trained' | 'deployed' | 'deprecated' | 'failed';
  algorithm: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  created_at: string;
  updated_at: string;
}

export interface AIPrediction {
  id: string;
  model_id: string;
  prediction_type: 'appointment_no_show' | 'revenue_forecast' | 'patient_outcome' | 'treatment_success' | 'billing_risk' | 'patient_engagement' | 'provider_performance' | 'inventory_demand';
  status: 'pending' | 'completed' | 'failed' | 'expired';
  input_data: Record<string, any>;
  prediction_result: Record<string, any>;
  confidence_score?: number;
  probability_score?: number;
  created_at: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  insight_type: 'performance' | 'opportunity' | 'risk' | 'trend' | 'recommendation' | 'anomaly' | 'pattern' | 'forecast';
  category: 'appointment' | 'revenue' | 'patient' | 'provider' | 'clinical' | 'operational' | 'financial' | 'marketing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'reviewed' | 'acted_on' | 'dismissed' | 'archived';
  confidence_score?: number;
  impact_score?: number;
  data_points: Record<string, any>;
  recommendations?: Record<string, any>;
  detected_at?: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  expected_impact: string;
  actions: string[];
}

export interface NoShowPrediction {
  appointment_id: string;
  patient_name: string;
  appointment_time: string;
  no_show_probability: number;
  risk_level: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface RevenueForecast {
  period: 'weekly' | 'monthly' | 'quarterly';
  predicted_revenue: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  growth_rate: number;
  factors: Record<string, number>;
}

export interface PatientOutcomePrediction {
  patient_id: string;
  treatment_plan_id: string;
  success_probability: number;
  estimated_recovery_time: number;
  risk_factors: string[];
  recommendations: string[];
}

class AIAPI {
  // AI Dashboard Overview
  async getAIDashboardOverview(): Promise<{
    model_performance: {
      active_models: number;
      total_predictions: number;
      average_accuracy: number;
      insights_generated: number;
    };
    prediction_trends: {
      no_show_predictions: {
        total: number;
        accuracy: number;
        trend: string;
      };
      revenue_forecasts: {
        total: number;
        accuracy: number;
        trend: string;
      };
      patient_outcomes: {
        total: number;
        accuracy: number;
        trend: string;
      };
    };
    recent_insights: AIInsight[];
    ai_recommendations: AIRecommendation[];
  }> {
    const response = await apiClient.get('/ai/dashboard/overview');
    return response.data;
  }

  // Model Management
  async createModel(modelData: {
    model_name: string;
    description?: string;
    model_type: AIModel['model_type'];
    model_category: AIModel['model_category'];
    algorithm: string;
    model_config: Record<string, any>;
    training_data_config: Record<string, any>;
  }): Promise<AIModel> {
    const response = await apiClient.post('/ai/models', modelData);
    return response.data;
  }

  async getModels(filters: {
    category?: AIModel['model_category'];
    status?: string;
  } = {}): Promise<AIModel[]> {
    const response = await apiClient.get('/ai/models', { params: filters });
    return response.data.models;
  }

  async getModelById(id: string): Promise<AIModel> {
    const response = await apiClient.get(`/ai/models/${id}`);
    return response.data;
  }

  async trainModel(modelId: string, trainingData: {
    features: Record<string, any>[];
    labels: any[];
    metadata?: Record<string, any>;
  }): Promise<AIModel> {
    const response = await apiClient.post(`/ai/models/${modelId}/train`, trainingData);
    return response.data;
  }

  async deployModel(modelId: string): Promise<AIModel> {
    const response = await apiClient.post(`/ai/models/${modelId}/deploy`);
    return response.data;
  }

  async getModelPerformance(modelId: string): Promise<{
    model_id: string;
    current_accuracy: number;
    training_accuracy: number;
    prediction_count: number;
    last_prediction: string;
    performance_trend: string;
  }> {
    const response = await apiClient.get(`/ai/models/${modelId}/performance`);
    return response.data;
  }

  // Predictions
  async makePrediction(predictionRequest: {
    model_id: string;
    input_data: Record<string, any>;
    prediction_type: AIPrediction['prediction_type'];
  }): Promise<AIPrediction> {
    const response = await apiClient.post('/ai/predictions', predictionRequest);
    return response.data;
  }

  async getPredictions(filters: {
    model_id?: string;
    prediction_type?: AIPrediction['prediction_type'];
    status?: string;
    limit?: number;
  } = {}): Promise<AIPrediction[]> {
    const response = await apiClient.get('/ai/predictions', { params: filters });
    return response.data.predictions;
  }

  async getPredictionById(id: string): Promise<AIPrediction> {
    const response = await apiClient.get(`/ai/predictions/${id}`);
    return response.data;
  }

  // Predictive Analytics
  async getNoShowRiskPredictions(filters: {
    start_date?: string;
    end_date?: string;
  } = {}): Promise<{
    high_risk_appointments: NoShowPrediction[];
    total_appointments: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
  }> {
    const response = await apiClient.get('/ai/predictions/no-show-risk', { params: filters });
    return response.data;
  }

  async getRevenueForecast(period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'): Promise<RevenueForecast> {
    const response = await apiClient.get('/ai/predictions/revenue-forecast', {
      params: { period },
    });
    return response.data;
  }

  async getPatientOutcomePredictions(treatmentType?: string): Promise<{
    treatment_type: string;
    success_predictions: PatientOutcomePrediction[];
    average_success_rate: number;
    total_predictions: number;
  }> {
    const response = await apiClient.get('/ai/predictions/patient-outcomes', {
      params: { treatment_type: treatmentType },
    });
    return response.data;
  }

  // Insights
  async generateInsights(config: {
    categories?: AIInsight['category'][];
    priority_threshold?: AIInsight['priority'];
    auto_generate?: boolean;
  } = {}): Promise<AIInsight[]> {
    const response = await apiClient.post('/ai/insights/generate', config);
    return response.data;
  }

  async getInsights(filters: {
    category?: AIInsight['category'];
    priority?: AIInsight['priority'];
    status?: string;
    limit?: number;
  } = {}): Promise<AIInsight[]> {
    const response = await apiClient.get('/ai/insights', { params: filters });
    return response.data;
  }

  async getInsightById(id: string): Promise<AIInsight> {
    const response = await apiClient.get(`/ai/insights/${id}`);
    return response.data;
  }

  async updateInsightStatus(id: string, updateData: {
    status: string;
    review_notes?: string;
  }): Promise<AIInsight> {
    const response = await apiClient.put(`/ai/insights/${id}/status`, updateData);
    return response.data;
  }

  // AI Recommendations
  async getAIRecommendations(filters: {
    category?: string;
    priority?: string;
  } = {}): Promise<{
    recommendations: AIRecommendation[];
    total_count: number;
  }> {
    const response = await apiClient.get('/ai/recommendations', { params: filters });
    return response.data;
  }

  // Automation
  async getAutomationRules(): Promise<{
    active_rules: Array<{
      id: string;
      name: string;
      type: string;
      trigger: string;
      action: string;
      status: string;
      success_rate: number;
    }>;
    total_rules: number;
    active_count: number;
  }> {
    const response = await apiClient.get('/ai/automation/rules');
    return response.data;
  }

  async createAutomationRule(ruleData: {
    name: string;
    type: string;
    trigger: string;
    action: string;
    conditions?: Record<string, any>;
  }): Promise<{
    id: string;
    name: string;
    type: string;
    trigger: string;
    action: string;
    status: string;
    created_at: string;
  }> {
    const response = await apiClient.post('/ai/automation/rules', ruleData);
    return response.data;
  }

  // Training Data Collection
  async collectTrainingData(collectionConfig: {
    model_category: AIModel['model_category'];
    date_range: {
      start_date: string;
      end_date: string;
    };
  }): Promise<{
    model_category: string;
    samples_collected: number;
    data_quality_score: number;
    recommendations: string[];
  }> {
    const response = await apiClient.post('/ai/training/data-collection', collectionConfig);
    return response.data;
  }

  // Utility methods
  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
  }

  formatProbability(probability: number): string {
    return `${(probability * 100).toFixed(1)}%`;
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getInsightTypeIcon(type: string): string {
    switch (type) {
      case 'risk':
        return '⚠️';
      case 'opportunity':
        return '💡';
      case 'performance':
        return '📊';
      case 'trend':
        return '📈';
      case 'recommendation':
        return '💭';
      case 'anomaly':
        return '🔍';
      case 'pattern':
        return '🔗';
      case 'forecast':
        return '🔮';
      default:
        return 'ℹ️';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'appointment':
        return '📅';
      case 'revenue':
        return '💰';
      case 'patient':
        return '👥';
      case 'provider':
        return '👨‍⚕️';
      case 'clinical':
        return '🏥';
      case 'operational':
        return '⚙️';
      case 'financial':
        return '💳';
      case 'marketing':
        return '📢';
      default:
        return '📋';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'new':
        return 'text-blue-600 bg-blue-100';
      case 'reviewed':
        return 'text-purple-600 bg-purple-100';
      case 'acted_on':
        return 'text-green-600 bg-green-100';
      case 'dismissed':
        return 'text-gray-600 bg-gray-100';
      case 'archived':
        return 'text-gray-500 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  formatImpactScore(score: number): string {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  }

  formatTrend(trend: string): string {
    switch (trend) {
      case 'improving':
        return '↗️ Improving';
      case 'declining':
        return '↘️ Declining';
      case 'stable':
        return '→ Stable';
      default:
        return '→ Stable';
    }
  }
}

export const aiAPI = new AIAPI();
export default aiAPI;
