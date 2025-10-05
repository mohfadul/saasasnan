import React from 'react';
import { MetricResult } from '../../services/analytics-api';

interface MetricCardProps {
  metric: MetricResult;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  icon,
  color = 'blue',
  onClick,
}) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200';
      case 'purple':
        return 'bg-purple-50 border-purple-200';
      case 'indigo':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div
      className={`p-6 rounded-lg border-2 ${getColorClasses(color)} transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {metric.metric_name}
          </p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatValue(metric.value, metric.unit)}
          </p>
          
          {metric.growth_rate !== undefined && metric.previous_value !== undefined && (
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)} {Math.abs(metric.growth_rate).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                vs previous period
              </span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="flex-shrink-0 ml-4">
            {icon}
          </div>
        )}
      </div>
      
      {metric.breakdown && Object.keys(metric.breakdown).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(metric.breakdown).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {typeof value === 'number' ? formatValue(value) : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
