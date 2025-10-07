import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BeakerIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  TruckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { pharmacyDashboardApi } from '../services/pharmacy-api';
import { DrugInventoryTable } from '../components/pharmacy/DrugInventoryTable';
import { POSWindow } from '../components/pharmacy/POSWindow';
import { PrescriptionTable } from '../components/pharmacy/PrescriptionTable';
import { PharmacySupplierTable } from '../components/pharmacy/PharmacySupplierTable';
import { AlertsDashboard } from '../components/pharmacy/AlertsDashboard';

export const PharmacyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'pos' | 'prescriptions' | 'suppliers' | 'alerts'>('inventory');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['pharmacy-dashboard'],
    queryFn: () => pharmacyDashboardApi.getDashboard(),
    refetchInterval: 30000,
  });

  const tabs = [
    { id: 'inventory', name: 'Drug Inventory', icon: BeakerIcon, count: dashboard?.inventory?.totalStock || 0 },
    { id: 'pos', name: 'Point of Sale', icon: ShoppingCartIcon, count: 0 },
    { id: 'prescriptions', name: 'Prescriptions', icon: DocumentTextIcon, count: dashboard?.prescriptions?.pending || 0 },
    { id: 'suppliers', name: 'Suppliers', icon: TruckIcon, count: 0 },
    { id: 'alerts', name: 'Alerts', icon: ExclamationTriangleIcon, count: (dashboard?.inventory?.expiringSoon || 0) + (dashboard?.inventory?.lowStockItems || 0) },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Pharmacy Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage drug inventory, sales, prescriptions, and suppliers
          </p>
        </div>
      </div>

      {/* Dashboard Stats */}
      {!isLoading && dashboard && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BeakerIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Stock</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboard.inventory.totalStock}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">${dashboard.sales.todayRevenue.toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboard.inventory.lowStockItems}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Prescriptions</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboard.prescriptions.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon
                className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {tab.name}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'inventory' && <DrugInventoryTable />}
        {activeTab === 'pos' && <POSWindow />}
        {activeTab === 'prescriptions' && <PrescriptionTable />}
        {activeTab === 'suppliers' && <PharmacySupplierTable />}
        {activeTab === 'alerts' && <AlertsDashboard />}
      </div>
    </div>
  );
};

