import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyInventoryApi, pharmacySalesApi } from '../../services/pharmacy-api';
import { DrugInventory, CartItem } from '../../types/pharmacy';
import { formatCurrency } from '../../utils/currency.utils';

export const POSWindow: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_wallet'>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const queryClient = useQueryClient();

  const { data: inventory } = useQuery({
    queryKey: ['pharmacy-inventory'],
    queryFn: () => pharmacyInventoryApi.getInventory(),
  });

  const createSaleMutation = useMutation({
    mutationFn: pharmacySalesApi.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-sales'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-dashboard'] });
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaidAmount(0);
      alert('Sale completed successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.message || 'Failed to complete sale'}`);
    },
  });

  const addToCart = (item: DrugInventory) => {
    const existing = cart.find(c => c.inventoryId === item.id);
    if (existing) {
      if (existing.quantity < existing.availableStock) {
        setCart(cart.map(c =>
          c.inventoryId === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        ));
      } else {
        alert('Cannot add more than available stock');
      }
    } else {
      if (item.quantity > 0) {
        const newItem: CartItem = {
          inventoryId: item.id,
          drug: item.drug!,
          batchId: item.batch_id,
          quantity: 1,
          unitPrice: item.batch_selling_price,
          availableStock: item.quantity,
          discount: 0,
        };
        setCart([...cart, newItem]);
      } else {
        alert('Item out of stock');
      }
    }
  };

  const updateQuantity = (inventoryId: string, newQuantity: number) => {
    const item = cart.find(c => c.inventoryId === inventoryId);
    if (item && newQuantity > 0 && newQuantity <= item.availableStock) {
      setCart(cart.map(c =>
        c.inventoryId === inventoryId ? { ...c, quantity: newQuantity } : c
      ));
    }
  };

  const removeFromCart = (inventoryId: string) => {
    setCart(cart.filter(c => c.inventoryId !== inventoryId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * 0.1; // 10% tax
  const discountAmount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const total = subtotal + taxAmount - discountAmount;
  const balance = total - paidAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    if (paidAmount < total) {
      alert('Paid amount is less than total');
      return;
    }

    const saleData = {
      clinicId: '', // You should get this from user context
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      items: cart.map(item => ({
        drugId: item.drug.id,
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
      })),
      paymentMethod,
      paidAmount,
    };

    await createSaleMutation.mutateAsync(saleData);
  };

  const filteredInventory = inventory?.filter((item: DrugInventory) => {
    if (!searchQuery) return false;
    const search = searchQuery.toLowerCase();
    return (
      item.drug?.name.toLowerCase().includes(search) ||
      item.drug?.generic_name?.toLowerCase().includes(search) ||
      item.batch_id.toLowerCase().includes(search)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Side - Product Search & Cart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search */}
        <div className="bg-white shadow rounded-lg p-4">
          <input
            type="text"
            placeholder="Search drugs by name, generic name, or batch ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {searchQuery && filteredInventory && filteredInventory.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
              {filteredInventory.map((item: DrugInventory) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.drug?.name}</div>
                      <div className="text-xs text-gray-500">{item.drug?.generic_name} • Batch: {item.batch_id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(item.batch_selling_price)}</div>
                      <div className="text-xs text-gray-500">Stock: {item.quantity}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Cart ({cart.length} items)</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {cart.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Cart is empty. Search and add drugs to start a sale.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.inventoryId} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.drug.name}</h4>
                      <p className="text-xs text-gray-500">Batch: {item.batchId} • Stock: {item.availableStock}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.inventoryId, item.quantity - 1)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.availableStock}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.inventoryId, parseInt(e.target.value))}
                          className="w-16 text-center border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-600">× {formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.inventoryId)}
                        className="mt-1 text-xs text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Checkout */}
      <div className="space-y-6">
        {/* Customer Info */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            <input
              type="tel"
              placeholder="Phone Number (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (10%):</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-lg">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_wallet">Mobile Wallet</option>
            </select>
          </div>

          {/* Paid Amount */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Change */}
          {paidAmount > total && (
            <div className="mt-3 p-3 bg-green-50 rounded-md">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-green-800">Change:</span>
                <span className="font-bold text-green-900">{formatCurrency(paidAmount - total)}</span>
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || paidAmount < total || createSaleMutation.isPending}
            className="mt-4 w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createSaleMutation.isPending ? 'Processing...' : `Complete Sale ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

