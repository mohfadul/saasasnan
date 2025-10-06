import React from 'react';
import { AIInsight } from '../../services/ai-api';

interface InsightCardProps {
  insight: AIInsight;
  onUpdateStatus?: (status: string, notes?: string) => void;
  onDismiss?: () => void;
  onAct?: () => void;
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onUpdateStatus,
  onDismiss,
  onAct,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-800 bg-red-100';
      case 'high':
        return 'text-orange-800 bg-orange-100';
      case 'medium':
        return 'text-yellow-800 bg-yellow-100';
      case 'low':
        return 'text-green-800 bg-green-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-blue-800 bg-blue-100';
      case 'reviewed':
        return 'text-purple-800 bg-purple-100';
      case 'acted_on':
        return 'text-green-800 bg-green-100';
      case 'dismissed':
        return 'text-gray-800 bg-gray-100';
      case 'archived':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getInsightTypeIcon = (type: string) => {
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
  };

  const getCategoryIcon = (category: string) => {
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
  };

  const formatImpactScore = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getPriorityColor(insight.priority)} transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getInsightTypeIcon(insight.insight_type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {insight.title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-600">
                {getCategoryIcon(insight.category)} {insight.category}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-sm text-gray-600">
                {getInsightTypeIcon(insight.insight_type)} {insight.insight_type}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadgeColor(insight.priority)}`}>
            {insight.priority.toUpperCase()}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(insight.status)}`}>
            {insight.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4">
        {insight.description}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {insight.confidence_score && (
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Confidence</span>
              <span className="text-sm text-gray-500">
                {(insight.confidence_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${insight.confidence_score * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {insight.impact_score && (
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Impact</span>
              <span className="text-sm text-gray-500">
                {formatImpactScore(insight.impact_score)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${insight.impact_score}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Key Data Points */}
      {insight.data_points && Object.keys(insight.data_points).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Metrics</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(insight.data_points).slice(0, 4).map(([key, value]) => (
              <div key={key} className="bg-white rounded p-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {typeof value === 'number' 
                    ? value.toLocaleString() 
                    : typeof value === 'string' 
                    ? value 
                    : JSON.stringify(value)
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insight.recommendations && insight.recommendations.actions && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {insight.recommendations.actions.slice(0, 3).map((action: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {action}
              </li>
            ))}
          </ul>
          {insight.recommendations.expected_impact && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Expected Impact:</strong> {insight.recommendations.expected_impact}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {insight.status === 'new' && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            {onAct && (
              <button
                onClick={onAct}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
              >
                Take Action
              </button>
            )}
            {onUpdateStatus && (
              <button
                onClick={() => onUpdateStatus('reviewed')}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              >
                Mark Reviewed
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {insight.detected_at 
              ? new Date(insight.detected_at).toLocaleDateString()
              : new Date(insight.created_at).toLocaleDateString()
            }
          </span>
        </div>
      )}

      {/* Review Notes */}
      {insight.status === 'reviewed' && (insight as any).review_notes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Review Notes</h4>
          <p className="text-sm text-gray-600">{(insight as any).review_notes}</p>
        </div>
      )}
    </div>
  );
};

export default InsightCard;
