import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../../services/billing-api';
import { Invoice } from '../../types/billing';
import { PlusIcon, EyeIcon, PaperAirplaneIcon, CheckCircleIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency, notifySuccess, notifyError, confirmAction, cleanFilters, getStatusBadgeColor } from '../../lib/utils';

interface InvoiceTableProps {
  clinicId?: string;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ clinicId }) => {
  const [filters, setFilters] = useState({
    status: '',
    customerType: '',
    startDate: '',
    endDate: '',
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['invoices', clinicId, filters],
    queryFn: async () => {
      const params = cleanFilters({
        clinicId,
        ...filters,
      });
      return await billingApi.invoices.getAll(params);
    },
    retry: false,
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: billingApi.invoices.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      notifySuccess('Invoice sent successfully!');
    },
    onError: (error: any) => {
      notifyError(`Error sending invoice: ${error.response?.data?.message || error.message}`);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: billingApi.invoices.markPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      notifySuccess('Invoice marked as paid successfully!');
    },
    onError: (error: any) => {
      notifyError(`Error marking invoice as paid: ${error.response?.data?.message || error.message}`);
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: billingApi.invoices.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      notifySuccess('Invoice deleted successfully!');
    },
    onError: (error: any) => {
      notifyError(`Error deleting invoice: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSendInvoice = useCallback((invoiceId: string) => {
    if (confirmAction('Send this invoice to the customer?')) {
      sendInvoiceMutation.mutate(invoiceId);
    }
  }, [sendInvoiceMutation]);

  const handleMarkPaid = useCallback((invoiceId: string) => {
    if (confirmAction('Mark this invoice as paid?')) {
      markPaidMutation.mutate(invoiceId);
    }
  }, [markPaidMutation]);

  const handleDeleteInvoice = useCallback((invoiceId: string) => {
    if (confirmAction('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      deleteInvoiceMutation.mutate(invoiceId);
    }
  }, [deleteInvoiceMutation]);

  // Memoize computed values for performance
  const totalPages = useMemo(() => Math.ceil((invoices?.length || 0) / pageSize), [invoices?.length, pageSize]);
  
  const paginatedInvoices = useMemo(() => 
    invoices?.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    ) || [],
    [invoices, currentPage, pageSize]
  );

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
        <p className="text-red-800 font-semibold text-lg">⚠️ Error Loading Invoices</p>
        <p className="text-red-700 mt-2">{errorMessage}</p>
        <div className="mt-4 space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Refresh Page
          </button>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium"
          >
            Retry
          </button>
        </div>
        <p className="text-red-600 text-xs mt-3">💡 Check browser console (F12) for more details</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar with Create Invoice Button */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Showing {paginatedInvoices.length} of {invoices?.length || 0} invoices
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Create Invoice form coming soon! Database schema is ready.')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
            <select
              value={filters.customerType}
              onChange={(e) => setFilters({ ...filters, customerType: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="patient">Patient</option>
              <option value="insurance">Insurance</option>
              <option value="third_party">Third Party</option>
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

      {/* Invoice Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
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
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium text-gray-900">No invoices found</p>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
                    <button
                      onClick={() => alert('Create Invoice form coming soon!')}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Create Invoice
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice: Invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number || `INV-${invoice.id.substring(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.customer_info?.name || invoice.customer_info?.firstName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${invoice.total_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.balance_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(invoice.status, 'invoice')}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="View Invoice"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleSendInvoice(invoice.id)}
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                          title="Send Invoice"
                        >
                          <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                          Send
                        </button>
                      )}
                      {(invoice.status === 'sent' || (invoice.status as any) === 'partially_paid' || invoice.status === 'overdue') && (
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                          title="Mark as Paid"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Mark Paid
                        </button>
                      )}
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          title="Delete Invoice"
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
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, invoices.length)}</span> of{' '}
                  <span className="font-medium">{invoices.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowViewModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Invoice Details</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedInvoice.invoice_number || `INV-${selectedInvoice.id.substring(0, 8)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-3xl">&times;</span>
                  </button>
                </div>

                {/* Invoice Info Grid */}
                <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Invoice Date</p>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedInvoice.invoice_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Due Date</p>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedInvoice.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedInvoice.status, 'invoice')}`}>
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Customer Type</p>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedInvoice.customer_type || 'N/A'}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedInvoice.customer_info?.name || selectedInvoice.customer_info?.firstName || 'N/A'}
                    </p>
                    {selectedInvoice.customer_info?.email && (
                      <p className="text-sm text-gray-600 mt-1">📧 {selectedInvoice.customer_info.email}</p>
                    )}
                    {selectedInvoice.customer_info?.phone && (
                      <p className="text-sm text-gray-600 mt-1">📞 {selectedInvoice.customer_info.phone}</p>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Line Items</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                          selectedInvoice.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.description || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-600">{item.quantity || 1}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">${item.unit_price?.toFixed(2) || '0.00'}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">${item.total_price?.toFixed(2) || '0.00'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-sm text-center text-gray-500">
                              No line items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium text-gray-900">${selectedInvoice.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      {selectedInvoice.tax_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium text-gray-900">${selectedInvoice.tax_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}
                      {selectedInvoice.discount_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-green-600">-${selectedInvoice.discount_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-gray-900">${selectedInvoice.total_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Paid:</span>
                        <span className="font-medium text-green-600">${selectedInvoice.paid_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
                        <span className="text-gray-900">Balance Due:</span>
                        <span className="text-blue-600">${selectedInvoice.balance_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Notes:</h5>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-200">
                {selectedInvoice.status === 'draft' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleSendInvoice(selectedInvoice.id);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Send Invoice
                  </button>
                )}
                {(selectedInvoice.status === 'sent' || (selectedInvoice.status as any) === 'partially_paid' || selectedInvoice.status === 'overdue') && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleMarkPaid(selectedInvoice.id);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Mark as Paid
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
