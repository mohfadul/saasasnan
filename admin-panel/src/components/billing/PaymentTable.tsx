import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../../services/billing-api';
import { Payment } from '../../types/billing';
import { PlusIcon, EyeIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format, isValid, parseISO } from 'date-fns';

// Helper function to safely format dates
const formatDate = (date: any, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsedDate)) return 'N/A';
    return format(parsedDate, formatStr);
  } catch (error) {
    return 'N/A';
  }
};

interface PaymentTableProps {
  invoiceId?: string;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({ invoiceId }) => {
  const [filters, setFilters] = useState({
    paymentMethod: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const queryClient = useQueryClient();

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['payments', invoiceId, filters],
    queryFn: async () => {
      try {
        const cleanFilters: Record<string, string> = {};
        
        if (invoiceId && invoiceId.trim()) cleanFilters.invoiceId = invoiceId.trim();
        if (filters.paymentMethod && filters.paymentMethod.trim()) cleanFilters.paymentMethod = filters.paymentMethod.trim();
        if (filters.status && filters.status.trim()) cleanFilters.status = filters.status.trim();
        if (filters.startDate && filters.startDate.trim()) cleanFilters.startDate = filters.startDate.trim();
        if (filters.endDate && filters.endDate.trim()) cleanFilters.endDate = filters.endDate.trim();
        
        const hasFilters = Object.keys(cleanFilters).length > 0;
        return await billingApi.payments.getAll(hasFilters ? cleanFilters : undefined);
      } catch (err: any) {
        console.error('❌ Payment fetch error:', err);
        throw err;
      }
    },
    retry: false,
  });

  const refundPaymentMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
      billingApi.payments.refund(id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Payment refunded successfully!');
    },
    onError: (error: any) => {
      alert(`Error refunding payment: ${error.response?.data?.message || error.message}`);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: billingApi.payments.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Payment deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Error deleting payment: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleRefundPayment = (payment: Payment) => {
    const maxAmount = payment.amount;
    const amount = prompt(`Enter refund amount (max: $${maxAmount?.toFixed(2)}):`);
    const reason = prompt('Enter refund reason:');
    
    if (amount && reason && parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount) {
      refundPaymentMutation.mutate({
        id: payment.id,
        amount: parseFloat(amount),
        reason,
      });
    } else if (amount) {
      alert('Invalid refund amount!');
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      deletePaymentMutation.mutate(paymentId);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      confirmed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-200 text-gray-600',
      processing: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMethodBadgeColor = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      bank_transfer: 'bg-indigo-100 text-indigo-800',
      check: 'bg-yellow-100 text-yellow-800',
      insurance: 'bg-purple-100 text-purple-800',
      online: 'bg-cyan-100 text-cyan-800',
      mobile_wallet: 'bg-pink-100 text-pink-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  // Pagination
  const totalPages = Math.ceil((payments?.length || 0) / pageSize);
  const paginatedPayments = payments?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    const axiosError = error as any;
    const errorMessage = axiosError?.response?.data?.message || error.message;
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 m-4">
        <p className="text-red-800 font-semibold text-lg">⚠️ Error Loading Payments</p>
        <p className="text-red-700 mt-2">{errorMessage}</p>
        <div className="mt-4 space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Refresh Page
          </button>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['payments'] })}
            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar with Record Payment Button */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Showing {paginatedPayments.length} of {payments?.length || 0} payments
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Record Payment form coming soon! Database schema is ready.')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="insurance">Insurance</option>
              <option value="online">Online</option>
              <option value="mobile_wallet">Mobile Wallet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="confirmed">Confirmed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-900">No payments found</p>
                    <p className="mt-1 text-sm text-gray-500">Start by recording your first payment.</p>
                    <button
                      onClick={() => alert('Record Payment form coming soon!')}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Record Payment
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment: Payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.payment_number || `PAY-${payment.id.substring(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.invoice?.invoice_number || payment.invoice_id?.substring(0, 8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${payment.amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodBadgeColor(payment.payment_method)}`}>
                        {payment.payment_method.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(payment.payment_status || payment.status || 'pending')}`}>
                        {(payment.payment_status || payment.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="View Payment"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {(payment.payment_status === 'completed' || payment.payment_status === 'confirmed') && (
                        <button
                          onClick={() => handleRefundPayment(payment)}
                          className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                          title="Refund Payment"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Refund
                        </button>
                      )}
                      {payment.payment_status === 'pending' && (
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          title="Delete Payment"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, payments.length)}</span> of{' '}
                  <span className="font-medium">{payments.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(totalPages, 10))].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === idx + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Payment Modal */}
      {showViewModal && selectedPayment && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowViewModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Payment Details</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedPayment.payment_number || `PAY-${selectedPayment.id.substring(0, 8)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-3xl">&times;</span>
                  </button>
                </div>

                {/* Payment Info Grid */}
                <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Payment Date</p>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedPayment.payment_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Amount</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">${selectedPayment.amount?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Method</p>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodBadgeColor(selectedPayment.payment_method)}`}>
                      {selectedPayment.payment_method.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedPayment.payment_status || selectedPayment.status || 'pending')}`}>
                      {(selectedPayment.payment_status || selectedPayment.status || 'pending').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Transaction Details */}
                {selectedPayment.transaction_id && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Transaction ID</p>
                    <p className="text-sm text-gray-900 font-mono mt-1">{selectedPayment.transaction_id}</p>
                  </div>
                )}

                {/* Processing Fee */}
                {selectedPayment.processing_fee && selectedPayment.processing_fee > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Processing Fee</p>
                    <p className="text-sm text-gray-900 mt-1">${selectedPayment.processing_fee.toFixed(2)}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedPayment.notes && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Notes:</h5>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedPayment.notes}</p>
                  </div>
                )}

                {/* Sudan Payment Fields */}
                {selectedPayment.provider && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-900 mb-3">Sudan Payment Information</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">Provider:</span>
                        <span className="ml-2 text-blue-900">{selectedPayment.provider}</span>
                      </div>
                      {selectedPayment.reference_id && (
                        <div>
                          <span className="text-blue-700 font-medium">Reference ID:</span>
                          <span className="ml-2 text-blue-900 font-mono">{selectedPayment.reference_id}</span>
                        </div>
                      )}
                      {selectedPayment.payer_name && (
                        <div>
                          <span className="text-blue-700 font-medium">Payer Name:</span>
                          <span className="ml-2 text-blue-900">{selectedPayment.payer_name}</span>
                        </div>
                      )}
                      {selectedPayment.wallet_phone && (
                        <div>
                          <span className="text-blue-700 font-medium">Wallet Phone:</span>
                          <span className="ml-2 text-blue-900">{selectedPayment.wallet_phone}</span>
                        </div>
                      )}
                    </div>
                    {selectedPayment.receipt_url && (
                      <div className="mt-3">
                        <a
                          href={selectedPayment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          📄 View Receipt
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-200">
                {(selectedPayment.payment_status === 'completed' || selectedPayment.payment_status === 'confirmed') && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleRefundPayment(selectedPayment);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Process Refund
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
