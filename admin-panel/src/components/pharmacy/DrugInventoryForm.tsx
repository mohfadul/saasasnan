import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyInventoryApi } from '../../services/pharmacy-api';
import { DrugInventory } from '../../types/pharmacy';

interface DrugInventoryFormProps {
  item?: DrugInventory;
  onClose: () => void;
}

export const DrugInventoryForm: React.FC<DrugInventoryFormProps> = ({ item, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    drugId: '',
    clinicId: '',
    quantity: 0,
    batchId: '',
    expiryDate: '',
    manufactureDate: '',
    batchCostPrice: 0,
    batchSellingPrice: 0,
    shelfLocation: '',
    binNumber: '',
    minimumStock: 10,
    reorderLevel: 20,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        drugId: item.drug_id,
        clinicId: item.clinic_id,
        quantity: item.quantity,
        batchId: item.batch_id,
        expiryDate: item.expiry_date.split('T')[0],
        manufactureDate: item.manufacture_date?.split('T')[0] || '',
        batchCostPrice: item.batch_cost_price,
        batchSellingPrice: item.batch_selling_price,
        shelfLocation: item.shelf_location || '',
        binNumber: item.bin_number || '',
        minimumStock: item.minimum_stock,
        reorderLevel: item.reorder_level,
      });
    }
  }, [item]);

  const createMutation = useMutation({
    mutationFn: pharmacyInventoryApi.createInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-dashboard'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {item ? 'Edit Inventory' : 'Add Drug to Inventory'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Batch ID *</label>
              <input
                type="text"
                required
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Manufacture Date</label>
              <input
                type="date"
                value={formData.manufactureDate}
                onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cost Price *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.batchCostPrice}
                onChange={(e) => setFormData({ ...formData, batchCostPrice: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Selling Price *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.batchSellingPrice}
                onChange={(e) => setFormData({ ...formData, batchSellingPrice: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Shelf Location</label>
              <input
                type="text"
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bin Number</label>
              <input
                type="text"
                value={formData.binNumber}
                onChange={(e) => setFormData({ ...formData, binNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Stock</label>
              <input
                type="number"
                min="0"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
              <input
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving...' : item ? 'Update' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

