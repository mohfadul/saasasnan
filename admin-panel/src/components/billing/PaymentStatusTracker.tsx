import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import sudanPaymentsApi from '../../services/sudan-payments-api';
import {
  Payment,
  PaymentAuditLog,
  PaymentProvider,
  PaymentProviderLabels,
  PaymentStatus,
} from '../../types/billing';
import { format } from 'date-fns';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentIcon,
  ArrowPathIcon,
  PrinterIcon,
  UserIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface PaymentStatusTrackerProps {
  paymentId: string;
  onClose?: () => void;
}

export const PaymentStatusTracker: React.FC<PaymentStatusTrackerProps> = ({
  paymentId,
  onClose,
}) => {
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Fetch payment details
  const { data: payment, isLoading, refetch } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => sudanPaymentsApi.getPayment(paymentId),
    enabled: !!paymentId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch audit log
  const { data: auditLog = [] } = useQuery({
    queryKey: ['payment-audit-log', paymentId],
    queryFn: () => sudanPaymentsApi.getPaymentAuditLog(paymentId),
    enabled: showAuditLog && !!paymentId,
  });

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      [PaymentStatus.PENDING]: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        label: 'Pending Review',
        icon: ClockIcon,
      },
      [PaymentStatus.CONFIRMED]: {
        color: 'bg-green-100 text-green-800 border-green-300',
        label: 'Confirmed',
        icon: CheckCircleIcon,
      },
      [PaymentStatus.REJECTED]: {
        color: 'bg-red-100 text-red-800 border-red-300',
        label: 'Rejected',
        icon: XCircleIcon,
      },
      [PaymentStatus.PROCESSING]: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        label: 'Processing',
        icon: ArrowPathIcon,
      },
      [PaymentStatus.COMPLETED]: {
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        label: 'Completed',
        icon: CheckCircleIcon,
      },
    };

    const config = statusConfig[status] || statusConfig[PaymentStatus.PENDING];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="h-5 w-5 mr-2" />
        {config.label}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <XCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Not Found</h3>
        <p className="text-gray-600">Unable to load payment details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Status</h2>
            <p className="text-sm text-gray-500 mt-1">
              Payment #{payment.payment_number}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center py-4">
          {getStatusBadge(payment.payment_status || payment.status)}
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Payment Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.payment_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Provider</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {PaymentProviderLabels[payment.provider as PaymentProvider] || payment.provider}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Reference ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{payment.reference_id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Payer Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.payer_name}</dd>
          </div>
          {payment.wallet_phone && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Wallet Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{payment.wallet_phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Amount</dt>
            <dd className="mt-1 text-sm text-gray-900 font-semibold">
              <BanknotesIcon className="h-4 w-4 inline mr-1" />
              {payment.amount.toFixed(2)} SDG
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {format(new Date(payment.payment_date || payment.created_at), 'MMMM dd, yyyy HH:mm')}
            </dd>
          </div>
          {payment.invoice && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Invoice</dt>
              <dd className="mt-1 text-sm text-gray-900">{payment.invoice.invoice_number}</dd>
            </div>
          )}
        </dl>

        {payment.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <dt className="text-sm font-medium text-gray-500 mb-2">Notes</dt>
            <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{payment.notes}</dd>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Timeline</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {/* Payment Created */}
            <li>
              <div className="relative pb-8">
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                ></span>
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                      <DocumentIcon className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        Payment submitted by <span className="font-medium">{payment.payer_name}</span>
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      {format(new Date(payment.created_at), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </li>

            {/* Payment Reviewed */}
            {payment.reviewed_at && (
              <li>
                <div className="relative pb-8">
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full ${
                          payment.payment_status === PaymentStatus.CONFIRMED || payment.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        } flex items-center justify-center ring-8 ring-white`}
                      >
                        {payment.payment_status === PaymentStatus.CONFIRMED || payment.status === 'completed' ? (
                          <CheckCircleIcon className="h-5 w-5 text-white" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-white" />
                        )}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          Payment {payment.payment_status === PaymentStatus.CONFIRMED || payment.status === 'completed' ? 'confirmed' : 'rejected'} by admin
                        </p>
                        {payment.admin_notes && (
                          <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {payment.admin_notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {format(new Date(payment.reviewed_at), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )}

            {/* Pending Status */}
            {!payment.reviewed_at && (
              <li>
                <div className="relative pb-8">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                        <ClockIcon className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <p className="text-sm text-gray-900">Waiting for admin review...</p>
                      <p className="mt-1 text-xs text-gray-500">
                        You'll be notified when the payment is reviewed
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Receipt */}
      {payment.receipt_url && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Receipt</h3>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <img
              src={payment.receipt_url}
              alt="Payment Receipt"
              className="w-full h-auto"
            />
          </div>
          <div className="mt-3">
            <a
              href={payment.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900 hover:underline"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Download Receipt
            </a>
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Audit Log</h3>
          <button
            type="button"
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="text-sm text-blue-600 hover:text-blue-900 hover:underline"
          >
            {showAuditLog ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showAuditLog && (
          <div className="mt-4">
            {auditLog.length === 0 ? (
              <p className="text-sm text-gray-500">No audit log entries available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Performed By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status Change
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date/Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLog.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {log.performed_by_user?.first_name || 'System'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {log.previous_status && log.new_status
                            ? `${log.previous_status} → ${log.new_status}`
                            : log.new_status || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

