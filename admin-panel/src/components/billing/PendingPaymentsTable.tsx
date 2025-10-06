import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sudanPaymentsApi from '../../services/sudan-payments-api';
import {
  Payment,
  PaymentProvider,
  PaymentProviderLabels,
  PaymentStatus,
} from '../../types/billing';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentIcon,
  ClockIcon,
  BanknotesIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export const PendingPaymentsTable: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch pending payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pending-payments', providerFilter],
    queryFn: () => sudanPaymentsApi.getPendingPayments({
      provider: providerFilter === 'all' ? undefined : providerFilter,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      sudanPaymentsApi.confirmPayment(id, { admin_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      setShowConfirmModal(false);
      setSelectedPayment(null);
      setAdminNotes('');
      alert('Payment confirmed successfully!');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to confirm payment');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      sudanPaymentsApi.rejectPayment(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectReason('');
      alert('Payment rejected successfully!');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to reject payment');
    },
  });

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.payer_name?.toLowerCase().includes(searchLower) ||
      payment.reference_id?.toLowerCase().includes(searchLower) ||
      payment.payment_number.toLowerCase().includes(searchLower)
    );
  });

  const handleConfirm = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowConfirmModal(true);
    setError(null);
  };

  const handleReject = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRejectModal(true);
    setError(null);
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const submitConfirm = () => {
    if (selectedPayment) {
      confirmMutation.mutate({ id: selectedPayment.id, notes: adminNotes });
    }
  };

  const submitReject = () => {
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    if (selectedPayment) {
      rejectMutation.mutate({ id: selectedPayment.id, reason: rejectReason });
    }
  };

  const getProviderBadgeClass = (provider?: string) => {
    if (!provider) return 'bg-gray-100 text-gray-800';
    const providerType = provider.includes('Bank') ? 'bank' : 
                        provider.includes('Zain') || provider.includes('Cashi') ? 'wallet' : 'cash';
    switch (providerType) {
      case 'bank':
        return 'bg-blue-100 text-blue-800';
      case 'wallet':
        return 'bg-green-100 text-green-800';
      case 'cash':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Pending Payments Review
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manually review and approve payments from Sudan providers
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <span className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600">
            <ClockIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {filteredPayments.length} Pending
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by payer, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center space-x-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Providers</option>
              {Object.entries(PaymentProviderLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending payments</h3>
            <p className="mt-1 text-sm text-gray-500">All payments have been reviewed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.payment_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Ref: {payment.reference_id}
                        </div>
                        {payment.invoice?.invoice_number && (
                          <div className="text-xs text-gray-400">
                            Invoice: {payment.invoice.invoice_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProviderBadgeClass(
                          payment.provider
                        )}`}
                      >
                        {PaymentProviderLabels[payment.provider as PaymentProvider] || payment.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.payer_name}
                        </div>
                        {payment.wallet_phone && (
                          <div className="text-sm text-gray-500">{payment.wallet_phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BanknotesIcon className="h-5 w-5 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          ${payment.amount.toFixed(2)} SDG
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.receipt_url ? (
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(payment)}
                          className="text-blue-600 hover:text-blue-900 hover:underline text-sm"
                        >
                          <DocumentIcon className="h-5 w-5 inline mr-1" />
                          View
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        type="button"
                        onClick={() => handleConfirm(payment)}
                        disabled={confirmMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(payment)}
                        disabled={rejectMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && selectedPayment && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowConfirmModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirm Payment
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to confirm this payment?
                      </p>
                      <div className="mt-4 bg-gray-50 p-4 rounded-md">
                        <div className="text-sm space-y-2">
                          <p><strong>Payer:</strong> {selectedPayment.payer_name}</p>
                          <p><strong>Amount:</strong> ${selectedPayment.amount.toFixed(2)} SDG</p>
                          <p><strong>Reference:</strong> {selectedPayment.reference_id}</p>
                          <p><strong>Provider:</strong> {PaymentProviderLabels[selectedPayment.provider as PaymentProvider]}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700">
                          Admin Notes (Optional)
                        </label>
                        <textarea
                          id="admin-notes"
                          rows={3}
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add any notes about verification..."
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        />
                      </div>
                      {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={submitConfirm}
                  disabled={confirmMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {confirmMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowRejectModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reject Payment
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please provide a reason for rejecting this payment.
                      </p>
                      <div className="mt-4 bg-gray-50 p-4 rounded-md">
                        <div className="text-sm space-y-2">
                          <p><strong>Payer:</strong> {selectedPayment.payer_name}</p>
                          <p><strong>Amount:</strong> ${selectedPayment.amount.toFixed(2)} SDG</p>
                          <p><strong>Reference:</strong> {selectedPayment.reference_id}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700">
                          Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="reject-reason"
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => {
                            setRejectReason(e.target.value);
                            setError(null);
                          }}
                          placeholder="e.g., Transaction reference does not match bank records"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          required
                        />
                      </div>
                      {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={submitReject}
                  disabled={rejectMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && selectedPayment.receipt_url && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowReceiptModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Payment Receipt
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-2">
                  <img
                    src={selectedPayment.receipt_url}
                    alt="Payment Receipt"
                    className="w-full h-auto rounded-lg border border-gray-300"
                  />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <p><strong>Payment:</strong> {selectedPayment.payment_number}</p>
                  <p><strong>Reference:</strong> {selectedPayment.reference_id}</p>
                  <p>
                    <a
                      href={selectedPayment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 hover:underline"
                    >
                      Open in new tab →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

