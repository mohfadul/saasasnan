import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import analyticsAPI, { AnalyticsFilter } from '../services/analytics-api';
import MetricCard from '../components/analytics/MetricCard';
import AnalyticsChart, { transformTimeSeriesData, transformRevenueData } from '../components/analytics/AnalyticsChart';

const AnalyticsPage: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFilter>({
    period: 'daily',
  });

  // Fetch dashboard overview data
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', filters],
    queryFn: () => analyticsAPI.getDashboardOverview(filters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch appointment analytics
  const { data: appointmentData, isLoading: appointmentLoading } = useQuery({
    queryKey: ['analytics-appointments', filters],
    queryFn: () => analyticsAPI.getAppointmentAnalytics(filters),
  });

  // Fetch revenue analytics
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics-revenue', filters],
    queryFn: () => analyticsAPI.getRevenueAnalytics(filters),
  });

  // Fetch provider performance
  const { data: providerData, isLoading: providerLoading } = useQuery({
    queryKey: ['analytics-providers', filters],
    queryFn: () => analyticsAPI.getProviderPerformance(filters),
  });

  const handleFilterChange = (newFilters: Partial<AnalyticsFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (filters.period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 12 * 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 12);
        break;
    }
    
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    const dateRange = getDateRange();
    handleFilterChange(dateRange);
  }, [filters.period]);

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">
                Comprehensive insights into your practice performance
              </p>
            </div>
            
            {/* Filter Controls */}
            <div className="flex items-center space-x-4">
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange({ period: e.target.value as any })}
                className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="daily">Last 30 Days</option>
                <option value="weekly">Last 12 Weeks</option>
                <option value="monthly">Last 12 Months</option>
              </select>
              
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange({ start_date: e.target.value })}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange({ end_date: e.target.value })}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            metric={overviewData.total_appointments}
            icon={<CalendarIcon className="h-8 w-8 text-blue-600" />}
            color="blue"
          />
          <MetricCard
            metric={overviewData.total_revenue}
            icon={<CurrencyDollarIcon className="h-8 w-8 text-green-600" />}
            color="green"
          />
          <MetricCard
            metric={overviewData.total_patients}
            icon={<UsersIcon className="h-8 w-8 text-purple-600" />}
            color="purple"
          />
          <MetricCard
            metric={overviewData.active_providers}
            icon={<UserGroupIcon className="h-8 w-8 text-indigo-600" />}
            color="indigo"
          />
        </div>
      )}

      {/* Secondary Metrics */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            metric={overviewData.completed_appointments}
            icon={<ClockIcon className="h-8 w-8 text-emerald-600" />}
            color="green"
          />
          <MetricCard
            metric={overviewData.pending_invoices}
            icon={<CurrencyDollarIcon className="h-8 w-8 text-red-600" />}
            color="red"
          />
          <MetricCard
            metric={overviewData.total_clinical_notes}
            icon={<DocumentTextIcon className="h-8 w-8 text-yellow-600" />}
            color="yellow"
          />
          <MetricCard
            metric={overviewData.active_treatment_plans}
            icon={<ClipboardDocumentListIcon className="h-8 w-8 text-orange-600" />}
            color="yellow"
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        {appointmentData && (
          <AnalyticsChart
            type="line"
            data={transformTimeSeriesData(appointmentData.timeseries)}
            title="Appointments Trend"
            height={300}
          />
        )}

        {/* Revenue Trend */}
        {revenueData && (
          <AnalyticsChart
            type="bar"
            data={transformRevenueData(revenueData.timeseries)}
            title="Revenue Trend"
            height={300}
          />
        )}
      </div>

      {/* Provider Performance Table */}
      {providerData && providerData.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Provider Performance</h3>
            <p className="text-sm text-gray-600">Performance metrics for each provider</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Appointments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Duration (min)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {providerData.map((provider) => (
                  <tr key={provider.provider_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {provider.provider_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.total_appointments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.completed_appointments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        provider.completion_rate >= 90 
                          ? 'bg-green-100 text-green-800'
                          : provider.completion_rate >= 80
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.completion_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.avg_duration.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Create Dashboard
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Generate Report
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
