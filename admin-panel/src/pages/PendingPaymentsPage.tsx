import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sudanPaymentsApi from '../services/sudan-payments-api';
import { Payment, PaymentProvider, PaymentProviderLabels, PaymentStatus } from '../types/billing';
import { format, isValid, parseISO } from 'date-fns';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { PaymentStatusTracker } from '../components/billing/PaymentStatusTracker';

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

export const PendingPaymentsPage: React.FC = () => {
  const [filters, setFilters] = useState({
    provider: '',
    payerName: '',
    referenceId: '',
    startDate: '',
    endDate: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const queryClient = useQueryClient();

  // Fetch pending payments
  const { data: payments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pending-payments', filters],
    queryFn: async () => {
      const cleanFilters: any = {};
      
      // Only add parameters that have values (not empty strings)
      if (filters.provider && filters.provider.trim()) {
        cleanFilters.provider = filters.provider;
      }
      if (filters.payerName && filters.payerName.trim()) {
        cleanFilters.payer_name = filters.payerName;
      }
      if (filters.referenceId && filters.referenceId.trim()) {
        cleanFilters.reference_id = filters.referenceId;
      }
      if (filters.startDate && filters.startDate.trim()) {
        cleanFilters.start_date = filters.startDate;
      }
      if (filters.endDate && filters.endDate.trim()) {
        cleanFilters.end_date = filters.endDate;
      }
      
      // If no filters, pass undefined instead of empty object
      const hasFilters = Object.keys(cleanFilters).length > 0;
      return await sudanPaymentsApi.getPendingPayments(hasFilters ? cleanFilters : undefined);
    },
    refetchInterval: 60000, // Auto-refresh every minute
    retry: false,
  });

  // Confirm payment mutation
  const confirmMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      sudanPaymentsApi.confirmPayment(id, { admin_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowConfirmModal(false);
      setSelectedPayment(null);
      setAdminNotes('');
      alert('✅ Payment confirmed successfully!');
    },
    onError: (error: any) => {
      alert(`❌ Error confirming payment: ${error.response?.data?.message || error.message}`);
    },
  });

  // Reject payment mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      sudanPaymentsApi.rejectPayment(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment'] });
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectReason('');
      alert('✅ Payment rejected successfully.');
    },
    onError: (error: any) => {
      alert(`❌ Error rejecting payment: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleConfirm = () => {
    if (!selectedPayment) return;
    confirmMutation.mutate({ id: selectedPayment.id, notes: adminNotes });
  };

  const handleReject = () => {
    if (!selectedPayment) return;
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    rejectMutation.mutate({ id: selectedPayment.id, reason: rejectReason });
  };

  const getProviderBadge = (provider?: string) => {
    if (!provider) return null;
    
    const colors: Record<string, string> = {
      BankOfKhartoum: 'bg-blue-100 text-blue-800',
      FaisalIslamicBank: 'bg-green-100 text-green-800',
      OmdurmanNationalBank: 'bg-indigo-100 text-indigo-800',
      ZainBede: 'bg-purple-100 text-purple-800',
      Cashi: 'bg-pink-100 text-pink-800',
      CashOnDelivery: 'bg-yellow-100 text-yellow-800',
      CashAtBranch: 'bg-orange-100 text-orange-800',
      Other: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[provider] || colors.Other}`}>
        {PaymentProviderLabels[provider as PaymentProvider] || provider}
      </span>
    );
  };

  // Pagination
  const totalPages = Math.ceil((payments?.length || 0) / pageSize);
  const paginatedPayments = payments?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    const axiosError = error as any;
    const errorMessage = axiosError?.response?.data?.message || axiosError?.message || 'Unknown error';
    const errorDetails = axiosError?.response?.data?.error || '';
    const statusCode = axiosError?.response?.status || '';
    
    console.error('❌ Pending Payments Error:', {
      message: errorMessage,
      details: errorDetails,
      status: statusCode,
      response: axiosError?.response?.data,
    });
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 m-4">
        <p className="text-red-800 font-semibold text-lg">⚠️ Error Loading Pending Payments</p>
        <p className="text-red-700 mt-2">{errorMessage}</p>
        {errorDetails && <p className="text-red-600 text-sm mt-1">Details: {errorDetails}</p>}
        {statusCode && <p className="text-red-600 text-sm">Status Code: {statusCode}</p>}
        <div className="mt-4 space-x-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium"
          >
            Reload Page
          </button>
        </div>
        <p className="text-red-600 text-xs mt-3">💡 Check browser console (F12) for more details</p>
        <p className="text-red-600 text-xs">💡 Make sure you have admin/finance permissions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Pending Payments (Sudan)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review and confirm pending payment submissions
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Pending</dt>
                  <dd className="text-lg font-semibold text-gray-900">{payments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)} SDG
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={filters.provider}
              onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Providers</option>
              {Object.entries(PaymentProviderLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payer Name</label>
            <input
              type="text"
              value={filters.payerName}
              onChange={(e) => setFilters({ ...filters, payerName: e.target.value })}
              placeholder="Search by name"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
            <input
              type="text"
              value={filters.referenceId}
              onChange={(e) => setFilters({ ...filters, referenceId: e.target.value })}
              placeholder="Transaction ID"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
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

      {/* Payments Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium text-gray-900">No pending payments</p>
                    <p className="mt-1 text-sm text-gray-500">All payments have been reviewed.</p>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment: Payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.payment_number}</div>
                      <div className="text-xs text-gray-500 font-mono">{payment.reference_id}</div>
                      {payment.invoice && (
                        <div className="text-xs text-blue-600 mt-1">
                          Invoice: {payment.invoice.invoice_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{payment.payer_name}</div>
                      {payment.wallet_phone && (
                        <div className="text-xs text-gray-500">{payment.wallet_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getProviderBadge(payment.provider)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {payment.amount?.toFixed(2)} SDG
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.payment_date || payment.created_at, 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowConfirmModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 inline-flex items-center"
                        title="Confirm Payment"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRejectModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Reject Payment"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </button>
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

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 py-6 max-h-[90vh] overflow-y-auto">
                <PaymentStatusTracker
                  paymentId={selectedPayment.id}
                  onClose={() => setShowViewModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmModal && selectedPayment && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowConfirmModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirm Payment
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        You are about to confirm this payment. The invoice will be automatically updated.
                      </p>
                      
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Payment Number:</dt>
                            <dd className="font-medium text-gray-900">{selectedPayment.payment_number}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Payer:</dt>
                            <dd className="font-medium text-gray-900">{selectedPayment.payer_name}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Amount:</dt>
                            <dd className="font-semibold text-green-600">{selectedPayment.amount.toFixed(2)} SDG</dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Notes (Optional)
                        </label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={3}
                          placeholder="Add any notes about this confirmation..."
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {confirmMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={confirmMutation.isPending}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowRejectModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reject Payment
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Please provide a clear reason for rejecting this payment. The user will be notified.
                      </p>
                      
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Payment Number:</dt>
                            <dd className="font-medium text-gray-900">{selectedPayment.payment_number}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Payer:</dt>
                            <dd className="font-medium text-gray-900">{selectedPayment.payer_name}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Amount:</dt>
                            <dd className="font-semibold text-gray-900">{selectedPayment.amount.toFixed(2)} SDG</dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={4}
                          required
                          placeholder="e.g., Incorrect transaction ID, Invalid receipt, Amount mismatch..."
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  disabled={rejectMutation.isPending}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
