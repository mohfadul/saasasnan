import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../services/marketplace-api';

interface InventoryAdjustFormProps {
  inventory: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InventoryAdjustForm: React.FC<InventoryAdjustFormProps> = ({ 
  inventory, 
  onSuccess, 
  onCancel 
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    adjustment: 0,
    reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  const adjustMutation = useMutation({
    mutationFn: ({ id, adjustment, reason }: { id: string; adjustment: number; reason: string }) =>
      inventoryApi.adjustInventory(id, adjustment, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Error adjusting inventory:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setApiError(`Error: ${errorMessage}`);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.adjustment === 0) {
      newErrors.adjustment = 'Adjustment amount cannot be zero';
    }

    const newStock = inventory.currentStock + formData.adjustment;
    if (newStock < 0) {
      newErrors.adjustment = `Cannot reduce stock below zero (current: ${inventory.currentStock}, adjustment: ${formData.adjustment})`;
    }

    if (!formData.reason || formData.reason.trim() === '') {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'adjustment' ? Number(value) : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleQuickAdjust = (amount: number, reason: string) => {
    setFormData({
      adjustment: amount,
      reason: reason,
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    console.log('Adjusting inventory:', {
      id: inventory.id,
      adjustment: formData.adjustment,
      reason: formData.reason.trim(),
    });

    try {
      await adjustMutation.mutateAsync({
        id: inventory.id,
        adjustment: formData.adjustment,
        reason: formData.reason.trim(),
      });
    } catch (error: any) {
      console.error('Error adjusting inventory:', error);
    }
  };

  const newStockLevel = inventory.currentStock + formData.adjustment;
  const isLowStock = newStockLevel <= inventory.minimumStock;
  const isHighStock = newStockLevel >= inventory.maximumStock;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Adjust Inventory Stock
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Item Info */}
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm font-medium text-gray-900">
              {inventory.product?.name || 'Unknown Product'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              SKU: {inventory.product?.sku || 'N/A'} | Location: {inventory.location || 'N/A'}
            </p>
          </div>

          {/* Stock Levels */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Stock</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.currentStock}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Reserved</p>
              <p className="text-2xl font-bold text-gray-600">{inventory.reservedStock || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Min / Max</p>
              <p className="text-lg font-semibold text-gray-900">
                {inventory.minimumStock} / {inventory.maximumStock}
              </p>
            </div>
          </div>

          {/* Quick Adjustment Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Adjustments
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAdjust(-10, 'Manual count correction (-10)')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(-1, 'Manual count correction (-1)')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(1, 'Restocking (+1)')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(10, 'Restocking (+10)')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                +10
              </button>
            </div>
          </div>

          {/* Adjustment Amount */}
          <div>
            <label htmlFor="adjustment" className="block text-sm font-medium text-gray-700">
              Adjustment Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="adjustment"
              name="adjustment"
              value={formData.adjustment}
              onChange={handleChange}
              placeholder="e.g., +50 or -25"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.adjustment && (
              <p className="mt-1 text-sm text-red-600">{errors.adjustment}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Use positive numbers to add stock, negative to reduce stock
            </p>
          </div>

          {/* New Stock Level Preview */}
          {formData.adjustment !== 0 && (
            <div className={`p-4 rounded-md ${
              isLowStock ? 'bg-red-50' : isHighStock ? 'bg-yellow-50' : 'bg-green-50'
            }`}>
              <p className="text-sm font-medium text-gray-700">New Stock Level:</p>
              <p className={`text-3xl font-bold ${
                isLowStock ? 'text-red-700' : isHighStock ? 'text-yellow-700' : 'text-green-700'
              }`}>
                {newStockLevel}
              </p>
              {isLowStock && (
                <p className="mt-1 text-sm text-red-600">
                  ⚠️ Warning: Below minimum stock level ({inventory.minimumStock})
                </p>
              )}
              {isHighStock && (
                <p className="mt-1 text-sm text-yellow-600">
                  ⚠️ Warning: Above maximum stock level ({inventory.maximumStock})
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason for Adjustment <span className="text-red-500">*</span>
            </label>
            <select
              id="reasonSelect"
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'custom') {
                  setFormData(prev => ({ ...prev, reason: '' }));
                } else if (value) {
                  setFormData(prev => ({ ...prev, reason: value }));
                }
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a reason...</option>
              <option value="Received new stock">Received new stock</option>
              <option value="Stock count correction">Stock count correction</option>
              <option value="Damaged items removed">Damaged items removed</option>
              <option value="Expired items removed">Expired items removed</option>
              <option value="Used in treatment">Used in treatment</option>
              <option value="Sample provided">Sample provided</option>
              <option value="Theft or loss">Theft or loss</option>
              <option value="Transfer to another location">Transfer to another location</option>
              <option value="custom">Custom reason...</option>
            </select>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Enter reason for stock adjustment..."
              className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          {/* Submit and Cancel buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adjustMutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
            </button>
          </div>

          {/* Error message */}
          {(adjustMutation.isError || apiError) && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Error adjusting inventory:
              </p>
              <p className="text-sm text-red-700">
                {apiError || 'Unknown error. Please check the console for details.'}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

