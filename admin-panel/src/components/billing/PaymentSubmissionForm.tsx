import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import sudanPaymentsApi from '../../services/sudan-payments-api';
import { invoicesApi } from '../../services/billing-api';
import {
  PaymentProvider,
  PaymentProviderLabels,
  PaymentProviderTypes,
  Invoice,
} from '../../types/billing';
import {
  BanknotesIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface PaymentSubmissionFormProps {
  invoiceId: string;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

export const PaymentSubmissionForm: React.FC<PaymentSubmissionFormProps> = ({
  invoiceId,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  
  // Form state
  const [provider, setProvider] = useState<PaymentProvider | ''>('');
  const [referenceId, setReferenceId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch invoice details
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoicesApi.getInvoice(invoiceId),
    enabled: !!invoiceId,
  });

  // Submit payment mutation
  const submitMutation = useMutation({
    mutationFn: sudanPaymentsApi.createPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      setSuccessMessage(`Payment submitted successfully! Payment ID: ${data.payment_number}`);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(data.id);
        }
      }, 2000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to submit payment');
    },
  });

  // Validation helpers
  const getProviderInstructions = (): string => {
    if (!provider) return '';
    
    const instructions: Record<PaymentProvider, string> = {
      [PaymentProvider.BANK_OF_KHARTOUM]: 
        'Transfer to Account: 1234567890 | Swift: BOKKSDKH | Reference format: BOK + 10-15 digits',
      [PaymentProvider.FAISAL_ISLAMIC_BANK]:
        'Transfer to Account: 0987654321 | Swift: FIBSSDKH | Reference format: FIB + 10-15 digits',
      [PaymentProvider.OMDURMAN_NATIONAL_BANK]:
        'Transfer to Account: 1122334455 | Reference format: ONB + 10-15 digits',
      [PaymentProvider.ZAIN_BEDE]:
        'Send to: +249123456789 | Enter wallet transaction ID (10-15 digits) | Provide your wallet phone',
      [PaymentProvider.CASHI]:
        'Pay at any Cashi agent | Enter agent code and transaction ID (CASHI + 8-12 digits) | Provide your wallet phone',
      [PaymentProvider.CASH_ON_DELIVERY]:
        'Pay cash when you receive your order | No reference needed',
      [PaymentProvider.CASH_AT_BRANCH]:
        'Pay cash at our branch location | No reference needed',
      [PaymentProvider.OTHER]:
        'Contact support for payment instructions',
    };

    return instructions[provider] || '';
  };

  const isWalletProvider = (): boolean => {
    if (!provider) return false;
    return PaymentProviderTypes[provider] === 'wallet';
  };

  const isReceiptRequired = (): boolean => {
    if (!provider || !amount) return false;
    
    const thresholds: Record<PaymentProvider, number | null> = {
      [PaymentProvider.BANK_OF_KHARTOUM]: 5000,
      [PaymentProvider.FAISAL_ISLAMIC_BANK]: 5000,
      [PaymentProvider.OMDURMAN_NATIONAL_BANK]: 5000,
      [PaymentProvider.ZAIN_BEDE]: 3000,
      [PaymentProvider.CASHI]: 3000,
      [PaymentProvider.CASH_ON_DELIVERY]: null,
      [PaymentProvider.CASH_AT_BRANCH]: null,
      [PaymentProvider.OTHER]: 1000,
    };

    const threshold = thresholds[provider];
    return threshold !== null && amount >= threshold;
  };

  const validateForm = (): boolean => {
    setError(null);

    if (!provider) {
      setError('Please select a payment provider');
      return false;
    }

    if (!referenceId && provider !== PaymentProvider.CASH_ON_DELIVERY && provider !== PaymentProvider.CASH_AT_BRANCH) {
      setError('Please enter the transaction reference ID');
      return false;
    }

    if (!payerName.trim()) {
      setError('Please enter payer name');
      return false;
    }

    if (isWalletProvider() && !walletPhone) {
      setError('Wallet phone number is required for mobile wallet payments');
      return false;
    }

    if (isWalletProvider() && walletPhone && !/^\+2499[0-9]{8}$/.test(walletPhone)) {
      setError('Invalid Sudan phone number. Format: +2499XXXXXXXX');
      return false;
    }

    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount');
      return false;
    }

    if (invoice && amount > invoice.balance_amount) {
      setError(`Payment amount cannot exceed invoice balance (${invoice.balance_amount.toFixed(2)} SDG)`);
      return false;
    }

    if (isReceiptRequired() && !receiptUrl) {
      setError('Receipt upload is required for payments above the threshold amount');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    submitMutation.mutate({
      invoice_id: invoiceId,
      provider: provider as PaymentProvider,
      reference_id: referenceId,
      payer_name: payerName,
      wallet_phone: walletPhone || undefined,
      amount,
      receipt_url: receiptUrl || undefined,
      notes: notes || undefined,
    });
  };

  // Group providers by type
  const providersByType = {
    banks: [
      PaymentProvider.BANK_OF_KHARTOUM,
      PaymentProvider.FAISAL_ISLAMIC_BANK,
      PaymentProvider.OMDURMAN_NATIONAL_BANK,
    ],
    wallets: [
      PaymentProvider.ZAIN_BEDE,
      PaymentProvider.CASHI,
    ],
    cash: [
      PaymentProvider.CASH_ON_DELIVERY,
      PaymentProvider.CASH_AT_BRANCH,
    ],
  };

  if (invoiceLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h3>
        <p className="text-gray-600 mb-6">{successMessage}</p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Your payment is now pending review by our finance team. You'll be notified once it's confirmed.
          </p>
          <button
            type="button"
            onClick={() => onSuccess && onSuccess('')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            View Payment Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Submit Payment</h3>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>
        {invoice && (
          <div className="mt-2 text-sm text-gray-500">
            <p><strong>Invoice:</strong> {invoice.invoice_number}</p>
            <p><strong>Balance Due:</strong> {invoice.balance_amount.toFixed(2)} SDG</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Provider */}
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
            Payment Provider <span className="text-red-500">*</span>
          </label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as PaymentProvider);
              setError(null);
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select payment method...</option>
            <optgroup label="🏦 Bank Transfers">
              {providersByType.banks.map((p) => (
                <option key={p} value={p}>
                  {PaymentProviderLabels[p]}
                </option>
              ))}
            </optgroup>
            <optgroup label="📱 Mobile Wallets">
              {providersByType.wallets.map((p) => (
                <option key={p} value={p}>
                  {PaymentProviderLabels[p]}
                </option>
              ))}
            </optgroup>
            <optgroup label="💵 Cash">
              {providersByType.cash.map((p) => (
                <option key={p} value={p}>
                  {PaymentProviderLabels[p]}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Payment Instructions */}
        {provider && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Payment Instructions:</p>
                <p className="whitespace-pre-line">{getProviderInstructions()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reference ID */}
        {provider && provider !== PaymentProvider.CASH_ON_DELIVERY && provider !== PaymentProvider.CASH_AT_BRANCH && (
          <div>
            <label htmlFor="referenceId" className="block text-sm font-medium text-gray-700">
              Transaction Reference ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="referenceId"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder={provider === PaymentProvider.BANK_OF_KHARTOUM ? 'e.g., BOK1234567890' : 'Enter transaction reference'}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
        )}

        {/* Payer Name */}
        <div>
          <label htmlFor="payerName" className="block text-sm font-medium text-gray-700">
            Payer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="payerName"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder="Enter your full name"
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>

        {/* Wallet Phone (conditional) */}
        {isWalletProvider() && (
          <div>
            <label htmlFor="walletPhone" className="block text-sm font-medium text-gray-700">
              Wallet Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="walletPhone"
              value={walletPhone}
              onChange={(e) => setWalletPhone(e.target.value)}
              placeholder="+249912345678"
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Format: +2499XXXXXXXX</p>
          </div>
        )}

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Payment Amount (SDG) <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BanknotesIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="amount"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              max={invoice?.balance_amount}
              placeholder="0.00"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          {invoice && (
            <p className="mt-1 text-sm text-gray-500">
              Maximum: {invoice.balance_amount.toFixed(2)} SDG
            </p>
          )}
        </div>

        {/* Receipt URL */}
        <div>
          <label htmlFor="receiptUrl" className="block text-sm font-medium text-gray-700">
            Receipt/Screenshot URL {isReceiptRequired() && <span className="text-red-500">*</span>}
          </label>
          <div className="mt-1">
            <input
              type="url"
              id="receiptUrl"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://example.com/receipt.jpg"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required={isReceiptRequired()}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            <DocumentArrowUpIcon className="h-4 w-4 inline mr-1" />
            {isReceiptRequired() 
              ? 'Receipt is required for this amount' 
              : 'Upload receipt to cloud storage and paste the URL here'}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information..."
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="inline-flex justify-center items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {submitMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

