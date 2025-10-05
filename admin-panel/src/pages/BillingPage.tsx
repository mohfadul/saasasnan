import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../services/billing-api';
import { InvoiceTable } from '../components/billing/InvoiceTable';
import { PaymentTable } from '../components/billing/PaymentTable';
import { InsuranceProviderTable } from '../components/billing/InsuranceProviderTable';
import { BillingStats } from '../types/billing';

export const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments' | 'insurance'>('overview');

  const { data: billingOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['billing-overview'],
    queryFn: billingApi.getOverview,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderOverview = () => {
    if (overviewLoading) return <div>Loading billing overview...</div>;
    if (!billingOverview) return <div>No billing data available</div>;

    const { invoices, payments, insurance, summary } = billingOverview;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalRevenue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Outstanding Amount</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.outstandingAmount)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Collection Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.collectionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue Invoices</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.overdueCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Stats */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Statistics</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Current invoice status breakdown</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Invoices</dt>
                  <dd className="mt-1 text-sm text-gray-900">{invoices.totalInvoices}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Average Value</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatCurrency(invoices.averageInvoiceValue)}</dd>
                </div>
                {Object.entries(invoices.statusStats).map(([status, count]) => (
                  <div key={status}>
                    <dt className="text-sm font-medium text-gray-500 capitalize">{status}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{count}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Payment Stats */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Statistics</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Payment method breakdown</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Payments</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payments.totalPayments}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Average Payment</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatCurrency(payments.averagePaymentAmount)}</dd>
                </div>
                {Object.entries(payments.methodBreakdown).map(([method, data]) => (
                  <div key={method}>
                    <dt className="text-sm font-medium text-gray-500 capitalize">{method.replace('_', ' ')}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{data.count} ({formatCurrency(data.amount)})</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Insurance Stats */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Insurance Statistics</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Insurance provider overview</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Providers</dt>
                  <dd className="mt-1 text-sm text-gray-900">{insurance.totalProviders}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Active Providers</dt>
                  <dd className="mt-1 text-sm text-gray-900">{insurance.activeProviders}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Patient Insurances</dt>
                  <dd className="mt-1 text-sm text-gray-900">{insurance.totalPatientInsurances}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Primary Insurances</dt>
                  <dd className="mt-1 text-sm text-gray-900">{insurance.primaryInsurances}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expired Insurances</dt>
                  <dd className="mt-1 text-sm text-gray-900">{insurance.expiredInsurances}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Billing & Payments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage invoices, payments, and insurance providers
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'invoices', label: 'Invoices' },
            { key: 'payments', label: 'Payments' },
            { key: 'insurance', label: 'Insurance' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'invoices' && <InvoiceTable />}
        {activeTab === 'payments' && <PaymentTable />}
        {activeTab === 'insurance' && <InsuranceProviderTable />}
      </div>
    </div>
  );
};
