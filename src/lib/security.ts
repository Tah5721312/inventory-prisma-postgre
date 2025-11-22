/**
 * Security utilities for preventing XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns Escaped text safe for HTML insertion
 */
export function escapeHtml(text: string | null | undefined): string {
  if (text == null) return '';
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return String(text).replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitizes input by removing potentially dangerous characters
 * @param input - The input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns true if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that input contains only alphanumeric and allowed characters
 * @param input - Input to validate
 * @param allowedChars - Additional allowed characters (default: Arabic and English letters, numbers, spaces, and common punctuation)
 * @returns true if valid
 */
export function isValidText(input: string, allowedChars = ''): boolean {
  const basePattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s\-_.,;:!?()]+$/;
  if (allowedChars) {
    const customPattern = new RegExp(`^[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFFa-zA-Z0-9\\s\\-_.\\.,;:!?()${escapeRegex(allowedChars)}]+$`);
    return customPattern.test(input);
  }
  return basePattern.test(input);
}

/**
 * Escapes special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates that a number is within a safe range
 */
export function isValidNumber(value: number, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return false;
  }
  
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  
  return true;
}

