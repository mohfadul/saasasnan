/**
 * Date Utility Functions
 * Centralized date formatting and parsing utilities
 */

import { format, isValid, parseISO } from 'date-fns';

/**
 * Safely format a date with fallback to 'N/A'
 * @param date - Date string, Date object, or null/undefined
 * @param formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string or 'N/A'
 */
export const formatDate = (date: any, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsedDate)) return 'N/A';
    return format(parsedDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Format date with time
 * @param date - Date to format
 * @returns Formatted date with time
 */
export const formatDateTime = (date: any): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Format date for display in lists
 * @param date - Date to format
 * @returns Short date format
 */
export const formatDateShort = (date: any): string => {
  return formatDate(date, 'MMM dd');
};

/**
 * Format date for forms (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Date string for input fields
 */
export const formatDateForInput = (date: any): string => {
  if (!date) return '';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsedDate)) return '';
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
};

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns true if date is in the past
 */
export const isDatePast = (date: any): boolean => {
  if (!date) return false;
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(parsedDate) && parsedDate < new Date();
  } catch (error) {
    return false;
  }
};

/**
 * Calculate days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export const daysBetween = (startDate: any, endDate: any): number => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate);
    const end = typeof endDate === 'string' ? parseISO(endDate) : new Date(endDate);
    
    if (!isValid(start) || !isValid(end)) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
};

