/**
 * Currency Utility Functions
 * Centralized currency formatting utilities
 */

/**
 * Format amount as USD currency
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | undefined | null, currency: string = 'USD'): string => {
  if (amount === null || amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format amount as SDG (Sudan) currency
 * @param amount - Amount to format
 * @returns Formatted SDG amount
 */
export const formatSDG = (amount: number | undefined | null): string => {
  if (amount === null || amount === undefined) return '0.00 SDG';
  
  return `${amount.toFixed(2)} SDG`;
};

/**
 * Parse currency string to number
 * @param currencyString - String like "$1,234.56"
 * @returns Numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Format percentage
 * @param value - Numeric value (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

