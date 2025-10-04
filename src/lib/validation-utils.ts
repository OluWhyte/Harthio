/**
 * Comprehensive validation utilities for forms and user inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: any;
}

/**
 * Validate and sanitize topic title
 */
export function validateTopicTitle(title: unknown): ValidationResult {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: 'Title is required' };
  }
  
  const sanitized = title.trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Title cannot be empty' };
  }
  
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Title must be at least 3 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Title cannot exceed 100 characters' };
  }
  
  // Check for potentially harmful content
  if (containsHarmfulContent(sanitized)) {
    return { isValid: false, error: 'Title contains inappropriate content' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate and sanitize topic description
 */
export function validateTopicDescription(description: unknown): ValidationResult {
  if (!description || typeof description !== 'string') {
    return { isValid: false, error: 'Description is required' };
  }
  
  const sanitized = description.trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Description cannot be empty' };
  }
  
  if (sanitized.length < 10) {
    return { isValid: false, error: 'Description must be at least 10 characters long' };
  }
  
  if (sanitized.length > 500) {
    return { isValid: false, error: 'Description cannot exceed 500 characters' };
  }
  
  // Check for potentially harmful content
  if (containsHarmfulContent(sanitized)) {
    return { isValid: false, error: 'Description contains inappropriate content' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate join request message
 */
export function validateJoinRequestMessage(message: unknown): ValidationResult {
  // Message is optional
  if (!message) {
    return { isValid: true, sanitized: '' };
  }
  
  if (typeof message !== 'string') {
    return { isValid: false, error: 'Message must be text' };
  }
  
  const sanitized = message.trim();
  
  if (sanitized.length > 200) {
    return { isValid: false, error: 'Message cannot exceed 200 characters' };
  }
  
  // Check for potentially harmful content
  if (containsHarmfulContent(sanitized)) {
    return { isValid: false, error: 'Message contains inappropriate content' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate session date and time
 */
export function validateSessionDateTime(startTime: unknown, endTime: unknown): ValidationResult {
  if (!startTime || !endTime) {
    return { isValid: false, error: 'Start time and end time are required' };
  }
  
  let startDate: Date;
  let endDate: Date;
  
  try {
    startDate = new Date(startTime as string);
    endDate = new Date(endTime as string);
  } catch (error) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { isValid: false, error: 'Invalid date values' };
  }
  
  const now = new Date();
  
  if (startDate < now) {
    return { isValid: false, error: 'Session cannot start in the past' };
  }
  
  if (endDate <= startDate) {
    return { isValid: false, error: 'End time must be after start time' };
  }
  
  const duration = endDate.getTime() - startDate.getTime();
  const maxDuration = 4 * 60 * 60 * 1000; // 4 hours
  
  if (duration > maxDuration) {
    return { isValid: false, error: 'Session cannot exceed 4 hours' };
  }
  
  // Check if it's too far in the future (e.g., more than 30 days)
  const maxFutureTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (startDate > maxFutureTime) {
    return { isValid: false, error: 'Session cannot be scheduled more than 30 days in advance' };
  }
  
  return { 
    isValid: true, 
    sanitized: { 
      startTime: startDate.toISOString(), 
      endTime: endDate.toISOString() 
    } 
  };
}

/**
 * Validate user display name
 */
export function validateDisplayName(name: unknown): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Display name is required' };
  }
  
  const sanitized = name.trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Display name cannot be empty' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Display name cannot exceed 50 characters' };
  }
  
  // Check for valid characters (letters, numbers, spaces, basic punctuation)
  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(sanitized)) {
    return { isValid: false, error: 'Display name contains invalid characters' };
  }
  
  // Check for potentially harmful content
  if (containsHarmfulContent(sanitized)) {
    return { isValid: false, error: 'Display name contains inappropriate content' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate email address
 */
export function validateEmail(email: unknown): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required' };
  }
  
  const sanitized = email.trim().toLowerCase();
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Email address cannot be empty' };
  }
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate UUID format
 */
export function validateUUID(id: unknown): ValidationResult {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'ID is required' };
  }
  
  const sanitized = id.trim();
  
  // UUID v4 regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid ID format' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Check for potentially harmful content
 */
function containsHarmfulContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Basic checks for common harmful patterns
  const harmfulPatterns = [
    // Script injection attempts
    '<script',
    'javascript:',
    'onload=',
    'onerror=',
    
    // SQL injection attempts
    'drop table',
    'delete from',
    'insert into',
    'update set',
    
    // Common spam/abuse patterns
    'viagra',
    'casino',
    'lottery',
    
    // Excessive profanity (basic check)
    'fuck you',
    'go kill yourself',
    'kys'
  ];
  
  return harmfulPatterns.some(pattern => lowerText.includes(pattern));
}

/**
 * Sanitize HTML content (basic)
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate multiple fields at once
 */
export function validateFields(fields: Record<string, { value: unknown; validator: (value: unknown) => ValidationResult }>): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: Record<string, any>;
} {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, any> = {};
  let isValid = true;
  
  for (const [fieldName, { value, validator }] of Object.entries(fields)) {
    const result = validator(value);
    if (!result.isValid) {
      errors[fieldName] = result.error || 'Invalid value';
      isValid = false;
    } else {
      sanitized[fieldName] = result.sanitized !== undefined ? result.sanitized : value;
    }
  }
  
  return { isValid, errors, sanitized };
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(
  lastActionTime: Date | null,
  minIntervalMs: number,
  actionName: string
): ValidationResult {
  if (!lastActionTime) {
    return { isValid: true };
  }
  
  const now = new Date();
  const timeSinceLastAction = now.getTime() - lastActionTime.getTime();
  
  if (timeSinceLastAction < minIntervalMs) {
    const remainingSeconds = Math.ceil((minIntervalMs - timeSinceLastAction) / 1000);
    return {
      isValid: false,
      error: `Please wait ${remainingSeconds} seconds before ${actionName} again`
    };
  }
  
  return { isValid: true };
}

/**
 * Real-time validation for form fields
 */
export function createRealTimeValidator<T>(
  validator: (value: T) => ValidationResult,
  debounceMs: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (value: T, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, debounceMs);
  };
}

/**
 * Batch validation for multiple fields
 */
export function validateBatch(
  validations: Array<{
    field: string;
    value: unknown;
    validator: (value: unknown) => ValidationResult;
    required?: boolean;
  }>
): {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  sanitized: Record<string, any>;
} {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const sanitized: Record<string, any> = {};
  let isValid = true;

  for (const { field, value, validator, required = false } of validations) {
    // Skip validation for optional empty fields
    if (!required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      sanitized[field] = value;
      continue;
    }

    try {
      const result = validator(value);
      
      if (!result.isValid) {
        errors[field] = result.error || 'Invalid value';
        isValid = false;
      } else {
        sanitized[field] = result.sanitized !== undefined ? result.sanitized : value;
      }
    } catch (error) {
      errors[field] = error instanceof Error ? error.message : 'Validation error';
      isValid = false;
    }
  }

  return { isValid, errors, warnings, sanitized };
}

/**
 * Enhanced form validation with warnings
 */
export interface EnhancedValidationResult extends ValidationResult {
  warning?: string;
  suggestion?: string;
}

/**
 * Enhanced topic title validation with warnings
 */
export function validateTopicTitleEnhanced(title: unknown): EnhancedValidationResult {
  const basicResult = validateTopicTitle(title);
  
  if (!basicResult.isValid) {
    return basicResult;
  }

  const sanitized = basicResult.sanitized as string;
  
  // Add warnings for better UX
  if (sanitized.length < 10) {
    return {
      ...basicResult,
      warning: 'Consider adding more detail to help others understand your topic'
    };
  }

  if (sanitized.toLowerCase().includes('help') || sanitized.toLowerCase().includes('advice')) {
    return {
      ...basicResult,
      suggestion: 'Be specific about what kind of help or advice you need'
    };
  }

  return basicResult;
}

/**
 * Enhanced description validation with warnings
 */
export function validateTopicDescriptionEnhanced(description: unknown): EnhancedValidationResult {
  const basicResult = validateTopicDescription(description);
  
  if (!basicResult.isValid) {
    return basicResult;
  }

  const sanitized = basicResult.sanitized as string;
  
  // Add warnings for better UX
  if (sanitized.length < 50) {
    return {
      ...basicResult,
      warning: 'A more detailed description will help attract the right participants'
    };
  }

  if (!sanitized.includes('?') && !sanitized.toLowerCase().includes('discuss')) {
    return {
      ...basicResult,
      suggestion: 'Consider framing your topic as a question or discussion point'
    };
  }

  return basicResult;
}

/**
 * Validation with context awareness
 */
export function validateWithContext<T>(
  value: T,
  validator: (value: T) => ValidationResult,
  context: {
    userLevel?: 'new' | 'experienced';
    previousValues?: T[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  }
): EnhancedValidationResult {
  const basicResult = validator(value);
  
  if (!basicResult.isValid) {
    return basicResult;
  }

  // Add context-aware suggestions
  const suggestions: string[] = [];
  
  if (context.userLevel === 'new') {
    suggestions.push('As a new user, consider being extra clear about your expectations');
  }

  if (context.previousValues && context.previousValues.length > 0) {
    // Check for repetitive patterns
    const isDuplicate = context.previousValues.some(prev => 
      JSON.stringify(prev) === JSON.stringify(value)
    );
    
    if (isDuplicate) {
      suggestions.push('This looks similar to a previous entry - consider varying your approach');
    }
  }

  return {
    ...basicResult,
    suggestion: suggestions.length > 0 ? suggestions.join('. ') : undefined
  };
}