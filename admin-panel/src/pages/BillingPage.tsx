import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../services/billing-api';
import { InvoiceTable } from '../components/billing/InvoiceTable';
import { PaymentTable } from '../components/billing/PaymentTable';
import { InsuranceProviderTable } from '../components/billing/InsuranceProviderTable';
import { CurrencyDollarIcon, DocumentTextIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments' | 'insurance'>('invoices');

  const { data: billingOverview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['billing-overview'],
    queryFn: billingApi.getOverview,
    enabled: activeTab === 'overview',
    retry: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const renderOverview = () => {
    if (overviewLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (overviewError) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">⚠️ Overview statistics are temporarily unavailable.</p>
          <p className="text-yellow-600 text-sm mt-2">You can still access Invoices, Payments, and Insurance tabs.</p>
        </div>
      );
    }

    if (!billingOverview) {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Overview</h3>
          <p className="text-gray-500">No billing data available yet. Start by creating invoices and recording payments.</p>
        </div>
      );
    }

    const { summary } = billingOverview;

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-semibold text-gray-900">{formatCurrency(summary?.totalRevenue || 0)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Outstanding</dt>
                    <dd className="text-lg font-semibold text-gray-900">{formatCurrency(summary?.outstandingAmount || 0)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCardIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Payments Received</dt>
                    <dd className="text-lg font-semibold text-gray-900">{formatCurrency(summary?.totalPayments || 0)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Invoices */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue Invoices</dt>
                    <dd className="text-lg font-semibold text-gray-900">{summary?.overdueCount || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Rate */}
        {summary?.collectionRate !== undefined && (
          <div className="bg-white shadow rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Collection Rate</h4>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full"
                    style={{ width: `${Math.min(100, Number(summary.collectionRate) || 0)}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-lg font-semibold text-gray-900">{summary.collectionRate}%</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
            { key: 'overview', label: 'Overview', icon: CurrencyDollarIcon },
            { key: 'invoices', label: 'Invoices', icon: DocumentTextIcon },
            { key: 'payments', label: 'Payments', icon: CreditCardIcon },
            { key: 'insurance', label: 'Insurance', icon: ShieldCheckIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon
                className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === tab.key ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
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
