import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export all utilities
export * from '../utils';

/**
 * Get status badge color classes
 * Centralized status color mapping
 */
export const getStatusBadgeColor = (status: string, type: 'invoice' | 'payment' | 'appointment' | 'generic' = 'generic'): string => {
  const statusColors: Record<string, Record<string, string>> = {
    invoice: {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-200 text-gray-600',
    },
    payment: {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      confirmed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-200 text-gray-600',
      processing: 'bg-blue-100 text-blue-800',
    },
    appointment: {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
    },
    generic: {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    },
  };
  
  return statusColors[type]?.[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get payment method badge color
 */
export const getPaymentMethodColor = (method: string): string => {
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
