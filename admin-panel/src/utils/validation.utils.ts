/**
 * Validation Utility Functions
 * Common validation logic
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate Sudan phone number
 */
export const isValidSudanPhone = (phone: string): boolean => {
  const sudanPhoneRegex = /^\+2499[0-9]{8}$/;
  return sudanPhoneRegex.test(phone);
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Clean filter object by removing empty values
 * Prevents 400 errors from backend validation
 */
export const cleanFilters = (filters: Record<string, any>): Record<string, any> | undefined => {
  const cleaned: Record<string, any> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Trim strings
      cleaned[key] = typeof value === 'string' ? value.trim() : value;
    }
  });
  
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

/**
 * Validate required fields in an object
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === null || value === undefined || value === '';
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

