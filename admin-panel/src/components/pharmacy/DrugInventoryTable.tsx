import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyInventoryApi } from '../../services/pharmacy-api';
import { DrugInventory } from '../../types/pharmacy';
import { DrugInventoryForm } from './DrugInventoryForm';
import { formatCurrency } from '../../utils/currency.utils';
import { formatDate } from '../../utils/date.utils';

export const DrugInventoryTable: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DrugInventory | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['pharmacy-inventory'],
    queryFn: () => pharmacyInventoryApi.getInventory(),
  });

  const deleteMutation = useMutation({
    mutationFn: pharmacyInventoryApi.deleteInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-dashboard'] });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getStatusBadge = (item: DrugInventory) => {
    const daysToExpiry = Math.floor(
      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (item.quantity === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Out of Stock</span>;
    }
    if (item.quantity <= item.minimum_stock) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
    }
    if (daysToExpiry <= 30 && daysToExpiry >= 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Expiring Soon</span>;
    }
    if (daysToExpiry < 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Available</span>;
  };

  const filteredInventory = inventory?.filter((item: DrugInventory) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'low_stock') return item.quantity <= item.minimum_stock && item.quantity > 0;
    if (statusFilter === 'out_of_stock') return item.quantity === 0;
    if (statusFilter === 'expiring') {
      const days = Math.floor((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    }
    if (statusFilter === 'expired') return new Date(item.expiry_date) < new Date();
    return true;
  });

  if (isLoading) return <div className="text-center py-4">Loading inventory...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">Error loading inventory</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Items</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="expiring">Expiring Soon (30 days)</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Drug
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory && filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No inventory items found. Add your first drug to get started.
                </td>
              </tr>
            ) : (
              filteredInventory?.map((item: DrugInventory) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.drug?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{item.drug?.generic_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.batch_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.quantity}</div>
                    <div className="text-sm text-gray-500">Min: {item.minimum_stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.batch_selling_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      new Date(item.expiry_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-900'
                    }`}>
                      {formatDate(item.expiry_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => { setSelectedItem(item); setIsFormOpen(true); }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <DrugInventoryForm
          item={selectedItem}
          onClose={() => { setIsFormOpen(false); setSelectedItem(undefined); }}
        />
      )}
    </div>
  );
};

