import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, productsApi } from '../../services/marketplace-api';

interface InventoryFormProps {
  clinicId: string;
  inventory?: any; // For editing existing inventory
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ 
  clinicId, 
  inventory, 
  onSuccess, 
  onCancel 
}) => {
  const queryClient = useQueryClient();
  const isEditMode = !!inventory;

  const [formData, setFormData] = useState({
    productId: inventory?.product?.id || '',
    clinicId: clinicId,
    location: inventory?.location || '',
    minimumStock: inventory?.minimumStock || 10,
    maximumStock: inventory?.maximumStock || 100,
    reorderPoint: inventory?.reorderPoint || 20,
    currentStock: inventory?.currentStock || 0,
    expiryDate: inventory?.expiryDate ? inventory.expiryDate.split('T')[0] : '',
    batchNumber: inventory?.batchNumber || '',
    notes: inventory?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  // Fetch products for dropdown
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts({}),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.createInventoryItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Error creating inventory:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setApiError(`Error: ${errorMessage}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      inventoryApi.updateInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Error updating inventory:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setApiError(`Error: ${errorMessage}`);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productId) {
      newErrors.productId = 'Product is required';
    }

    if (!formData.location || formData.location.trim() === '') {
      newErrors.location = 'Location is required';
    }

    if (formData.minimumStock < 0) {
      newErrors.minimumStock = 'Minimum stock cannot be negative';
    }

    if (formData.maximumStock <= formData.minimumStock) {
      newErrors.maximumStock = 'Maximum stock must be greater than minimum stock';
    }

    if (formData.reorderPoint < formData.minimumStock) {
      newErrors.reorderPoint = 'Reorder point should be at least minimum stock';
    }

    if (!isEditMode && formData.currentStock < 0) {
      newErrors.currentStock = 'Current stock cannot be negative';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Stock') || name === 'reorderPoint' ? Number(value) : value
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const submitData = {
      ...formData,
      productId: formData.productId,
      clinicId: formData.clinicId,
      location: formData.location.trim(),
      expiryDate: formData.expiryDate || undefined,
      batchNumber: formData.batchNumber || undefined,
      notes: formData.notes || undefined,
    };

    console.log('Submitting inventory data:', submitData);

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: inventory.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
    } catch (error: any) {
      console.error('Error submitting inventory:', error);
    }
  };

  const selectedProduct = products.find((p: any) => p.id === formData.productId);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Selection */}
            <div className="md:col-span-2">
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                disabled={isEditMode || loadingProducts}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">Select a product...</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
              {errors.productId && (
                <p className="mt-1 text-sm text-red-600">{errors.productId}</p>
              )}
              {selectedProduct && (
                <p className="mt-1 text-sm text-gray-500">
                  Selling Price: ${selectedProduct.sellingPrice} | Cost: ${selectedProduct.costPrice}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Storage Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Shelf A-1, Room 5"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Current Stock (only for new items) */}
            {!isEditMode && (
              <div>
                <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700">
                  Initial Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="currentStock"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.currentStock && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentStock}</p>
                )}
              </div>
            )}

            {/* Minimum Stock */}
            <div>
              <label htmlFor="minimumStock" className="block text-sm font-medium text-gray-700">
                Minimum Stock Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="minimumStock"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.minimumStock && (
                <p className="mt-1 text-sm text-red-600">{errors.minimumStock}</p>
              )}
            </div>

            {/* Maximum Stock */}
            <div>
              <label htmlFor="maximumStock" className="block text-sm font-medium text-gray-700">
                Maximum Stock Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="maximumStock"
                name="maximumStock"
                value={formData.maximumStock}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.maximumStock && (
                <p className="mt-1 text-sm text-red-600">{errors.maximumStock}</p>
              )}
            </div>

            {/* Reorder Point */}
            <div>
              <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700">
                Reorder Point <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="reorderPoint"
                name="reorderPoint"
                value={formData.reorderPoint}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.reorderPoint && (
                <p className="mt-1 text-sm text-red-600">{errors.reorderPoint}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Alert when stock falls below this level
              </p>
            </div>

            {/* Expiry Date */}
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Batch Number */}
            <div>
              <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700">
                Batch/Lot Number
              </label>
              <input
                type="text"
                id="batchNumber"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="e.g., BATCH-2024-001"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional notes about this inventory item..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditMode
                ? (updateMutation.isPending ? 'Updating...' : 'Update Inventory')
                : (createMutation.isPending ? 'Creating...' : 'Create Inventory')
              }
            </button>
          </div>

          {/* Error message */}
          {(createMutation.isError || updateMutation.isError || apiError) && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Error {isEditMode ? 'updating' : 'creating'} inventory:
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

