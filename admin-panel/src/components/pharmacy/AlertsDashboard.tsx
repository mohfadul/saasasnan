import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyDashboardApi } from '../../services/pharmacy-api';
import { DrugInventory } from '../../types/pharmacy';
import { formatCurrency } from '../../utils/currency.utils';
import { formatDate } from '../../utils/date.utils';

export const AlertsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expiring' | 'low_stock' | 'out_of_stock'>('expiring');

  const { data: expiringDrugs } = useQuery({
    queryKey: ['pharmacy-expiring-drugs'],
    queryFn: () => pharmacyDashboardApi.getExpiringDrugs(30),
  });

  const { data: lowStockDrugs } = useQuery({
    queryKey: ['pharmacy-low-stock'],
    queryFn: () => pharmacyDashboardApi.getLowStockDrugs(),
  });

  const { data: outOfStockDrugs } = useQuery({
    queryKey: ['pharmacy-out-of-stock'],
    queryFn: () => pharmacyDashboardApi.getOutOfStockDrugs(),
  });

  const getDaysToExpiry = (expiryDate: string) => {
    return Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'text-red-700 bg-red-50';
    if (days <= 7) return 'text-red-600 bg-red-50';
    if (days <= 15) return 'text-orange-600 bg-orange-50';
    if (days <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-900">Expiring Soon (30 days)</p>
              <p className="text-2xl font-bold text-orange-700">{expiringDrugs?.length || 0}</p>
            </div>
            <svg className="h-10 w-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-700">{lowStockDrugs?.length || 0}</p>
            </div>
            <svg className="h-10 w-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Out of Stock</p>
              <p className="text-2xl font-bold text-red-700">{outOfStockDrugs?.length || 0}</p>
            </div>
            <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('expiring')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expiring'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Expiring Soon ({expiringDrugs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('low_stock')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'low_stock'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Low Stock ({lowStockDrugs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('out_of_stock')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'out_of_stock'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Out of Stock ({outOfStockDrugs?.length || 0})
          </button>
        </nav>
      </div>

      {/* Alert Lists */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {activeTab === 'expiring' && (
          <div className="divide-y divide-gray-200">
            {expiringDrugs && expiringDrugs.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No drugs expiring in the next 30 days
              </div>
            ) : (
              expiringDrugs?.map((item: DrugInventory) => {
                const daysToExpiry = getDaysToExpiry(item.expiry_date);
                return (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.drug?.name}</h4>
                        <p className="text-sm text-gray-500">
                          Batch: {item.batch_id} • Qty: {item.quantity} • Price: {formatCurrency(item.batch_selling_price)}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getExpiryColor(daysToExpiry)}`}>
                          {daysToExpiry < 0 ? 'Expired' : `${daysToExpiry} days`}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{formatDate(item.expiry_date)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'low_stock' && (
          <div className="divide-y divide-gray-200">
            {lowStockDrugs && lowStockDrugs.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No low stock items
              </div>
            ) : (
              lowStockDrugs?.map((item: DrugInventory) => (
                <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.drug?.name}</h4>
                      <p className="text-sm text-gray-500">
                        Batch: {item.batch_id} • Min Stock: {item.minimum_stock}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold text-yellow-600">{item.quantity}</div>
                      <p className="text-xs text-gray-500">units left</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'out_of_stock' && (
          <div className="divide-y divide-gray-200">
            {outOfStockDrugs && outOfStockDrugs.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No out of stock items
              </div>
            ) : (
              outOfStockDrugs?.map((item: DrugInventory) => (
                <div key={item.id} className="px-6 py-4 hover:bg-gray-50 bg-red-25">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.drug?.name}</h4>
                      <p className="text-sm text-gray-500">
                        Batch: {item.batch_id} • Last Price: {formatCurrency(item.batch_selling_price)}
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        OUT OF STOCK
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

