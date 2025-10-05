import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CpuChipIcon,
  LightBulbIcon,
  ChartBarIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import aiAPI, { AIInsight, AIPrediction } from '../services/ai-api';
import InsightCard from '../components/ai/InsightCard';
import PredictionCard from '../components/ai/PredictionCard';
import AnalyticsChart, { transformTimeSeriesData } from '../components/analytics/AnalyticsChart';

const AIPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'predictions' | 'models' | 'automation'>('overview');
  const [selectedInsightCategory, setSelectedInsightCategory] = useState<string>('all');

  // Fetch AI dashboard overview
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['ai-dashboard-overview'],
    queryFn: () => aiAPI.getAIDashboardOverview(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch insights
  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['ai-insights', selectedInsightCategory],
    queryFn: () => aiAPI.getInsights({
      category: selectedInsightCategory === 'all' ? undefined : selectedInsightCategory as any,
      limit: 20,
    }),
  });

  // Fetch predictions
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ['ai-predictions'],
    queryFn: () => aiAPI.getPredictions({ limit: 10 }),
  });

  // Fetch no-show predictions
  const { data: noShowPredictions, isLoading: noShowLoading } = useQuery({
    queryKey: ['ai-no-show-predictions'],
    queryFn: () => aiAPI.getNoShowRiskPredictions(),
  });

  // Fetch revenue forecast
  const { data: revenueForecast, isLoading: revenueLoading } = useQuery({
    queryKey: ['ai-revenue-forecast'],
    queryFn: () => aiAPI.getRevenueForecast('monthly'),
  });

  const handleInsightAction = async (insightId: string, action: 'reviewed' | 'acted_on' | 'dismissed', notes?: string) => {
    try {
      await aiAPI.updateInsightStatus(insightId, { status: action, review_notes: notes });
      // Refetch insights after update
      window.location.reload();
    } catch (error) {
      console.error('Error updating insight status:', error);
    }
  };

  const generateInsights = async () => {
    try {
      await aiAPI.generateInsights();
      // Refetch insights after generation
      window.location.reload();
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'insights', name: 'Insights', icon: LightBulbIcon },
    { id: 'predictions', name: 'Predictions', icon: CpuChipIcon },
    { id: 'models', name: 'Models', icon: CogIcon },
    { id: 'automation', name: 'Automation', icon: PlayIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Intelligence Center</h1>
              <p className="text-sm text-gray-600">
                Leverage AI-powered insights and predictions to optimize your practice
              </p>
            </div>
            <button
              onClick={generateInsights}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LightBulbIcon className="h-4 w-4 mr-2" />
              Generate Insights
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CpuChipIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Models</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.model_performance.active_models}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Predictions</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.model_performance.total_predictions.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Accuracy</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(dashboardData.model_performance.average_accuracy * 100).toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <LightBulbIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Insights Generated</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.model_performance.insights_generated}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prediction Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">No-Show Predictions</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Predictions</span>
                  <span className="text-sm font-medium">{dashboardData.prediction_trends.no_show_predictions.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accuracy</span>
                  <span className="text-sm font-medium">
                    {(dashboardData.prediction_trends.no_show_predictions.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trend</span>
                  <span className="text-sm font-medium">
                    {aiAPI.formatTrend(dashboardData.prediction_trends.no_show_predictions.trend)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Forecasts</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Forecasts</span>
                  <span className="text-sm font-medium">{dashboardData.prediction_trends.revenue_forecasts.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accuracy</span>
                  <span className="text-sm font-medium">
                    {(dashboardData.prediction_trends.revenue_forecasts.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trend</span>
                  <span className="text-sm font-medium">
                    {aiAPI.formatTrend(dashboardData.prediction_trends.revenue_forecasts.trend)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Outcomes</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Predictions</span>
                  <span className="text-sm font-medium">{dashboardData.prediction_trends.patient_outcomes.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accuracy</span>
                  <span className="text-sm font-medium">
                    {(dashboardData.prediction_trends.patient_outcomes.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trend</span>
                  <span className="text-sm font-medium">
                    {aiAPI.formatTrend(dashboardData.prediction_trends.patient_outcomes.trend)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Insights */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent AI Insights</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dashboardData.recent_insights.slice(0, 4).map((insight: AIInsight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onUpdateStatus={(status, notes) => handleInsightAction(insight.id, status as any, notes)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.ai_recommendations.map((recommendation: any) => (
                  <div key={recommendation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{recommendation.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                        <div className="mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${aiAPI.getPriorityColor(recommendation.priority)}`}>
                            {recommendation.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {aiAPI.formatConfidence(recommendation.confidence)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Filter Controls */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
              <select
                value={selectedInsightCategory}
                onChange={(e) => setSelectedInsightCategory(e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                <option value="appointment">Appointments</option>
                <option value="revenue">Revenue</option>
                <option value="patient">Patients</option>
                <option value="provider">Providers</option>
                <option value="clinical">Clinical</option>
                <option value="operational">Operational</option>
                <option value="financial">Financial</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>

          {/* Insights Grid */}
          {insightsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insightsData?.map((insight: AIInsight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onUpdateStatus={(status, notes) => handleInsightAction(insight.id, status as any, notes)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* No-Show Risk Predictions */}
          {noShowPredictions && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">No-Show Risk Predictions</h3>
                <p className="text-sm text-gray-600">Upcoming appointments with high no-show risk</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{noShowPredictions.high_risk_count}</div>
                    <div className="text-sm text-gray-600">High Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{noShowPredictions.medium_risk_count}</div>
                    <div className="text-sm text-gray-600">Medium Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{noShowPredictions.low_risk_count}</div>
                    <div className="text-sm text-gray-600">Low Risk</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Forecast */}
          {revenueForecast && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Revenue Forecast</h3>
                <p className="text-sm text-gray-600">AI-predicted revenue for next month</p>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-green-600">
                    ${revenueForecast.predicted_revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {aiAPI.formatConfidence(revenueForecast.confidence_interval.upper / revenueForecast.predicted_revenue)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      ${revenueForecast.confidence_interval.lower.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Lower Bound</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      ${revenueForecast.confidence_interval.upper.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Upper Bound</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {(revenueForecast.growth_rate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Growth Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Predictions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Predictions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {predictionsData?.map((prediction: AIPrediction) => (
                  <PredictionCard key={prediction.id} prediction={prediction} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Models</h3>
          <p className="text-gray-600">Model management interface coming soon...</p>
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Automation</h3>
          <p className="text-gray-600">Automation rules management interface coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default AIPage;
