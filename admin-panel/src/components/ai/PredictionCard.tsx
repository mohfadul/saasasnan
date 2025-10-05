import React from 'react';
import { AIPrediction } from '../../services/ai-api';

interface PredictionCardProps {
  prediction: AIPrediction;
  showDetails?: boolean;
  onViewDetails?: () => void;
}

const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  showDetails = false,
  onViewDetails,
}) => {
  const getPredictionTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment_no_show':
        return '📅';
      case 'revenue_forecast':
        return '💰';
      case 'patient_outcome':
        return '🏥';
      case 'treatment_success':
        return '✅';
      case 'billing_risk':
        return '⚠️';
      case 'patient_engagement':
        return '💬';
      case 'provider_performance':
        return '👨‍⚕️';
      case 'inventory_demand':
        return '📦';
      default:
        return '🔮';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'expired':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatPredictionResult = (result: Record<string, any>, type: string) => {
    switch (type) {
      case 'appointment_no_show':
        return {
          primary: `No-show probability: ${(result.no_show_probability * 100).toFixed(1)}%`,
          secondary: `Risk level: ${result.risk_level}`,
          value: result.no_show_probability,
        };
      case 'revenue_forecast':
        return {
          primary: `Predicted revenue: $${result.predicted_revenue?.toLocaleString()}`,
          secondary: `Growth rate: ${(result.growth_rate * 100).toFixed(1)}%`,
          value: result.predicted_revenue,
        };
      case 'patient_outcome':
        return {
          primary: `Success probability: ${(result.success_probability * 100).toFixed(1)}%`,
          secondary: `Recovery time: ${result.estimated_recovery_time} days`,
          value: result.success_probability,
        };
      case 'treatment_success':
        return {
          primary: `Recommended: ${result.recommended_treatment}`,
          secondary: `Success rate: ${(result.success_rate * 100).toFixed(1)}%`,
          value: result.success_rate,
        };
      default:
        return {
          primary: 'Prediction completed',
          secondary: 'View details for more information',
          value: 0,
        };
    }
  };

  const predictionDisplay = formatPredictionResult(prediction.prediction_result, prediction.prediction_type);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getPredictionTypeIcon(prediction.prediction_type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {prediction.prediction_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <p className="text-sm text-gray-500">
              Model ID: {prediction.model_id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(prediction.status)}`}>
          {prediction.status}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-1">
          {predictionDisplay.primary}
        </p>
        <p className="text-sm text-gray-500">
          {predictionDisplay.secondary}
        </p>
      </div>

      {prediction.confidence_score && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Confidence</span>
            <span className="text-sm text-gray-500">
              {(prediction.confidence_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${prediction.confidence_score * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Input Data</h4>
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <pre>{JSON.stringify(prediction.input_data, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-gray-500">
          {new Date(prediction.created_at).toLocaleDateString()}
        </span>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
