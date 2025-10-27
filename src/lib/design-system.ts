/**
 * Harthio Design System
 * Consistent text sizes and loading components
 */

// Text Size System - Based on modern social media standards (X.com, Instagram, etc.)
export const textSizes = {
  // Body text - main content
  body: 'text-base', // 16px - standard readable size
  bodyLarge: 'text-lg', // 18px - for important content
  bodySmall: 'text-sm', // 14px - for secondary info only
  
  // Headings
  h1: 'text-3xl font-bold', // 30px - page titles
  h2: 'text-2xl font-semibold', // 24px - section titles  
  h3: 'text-xl font-semibold', // 20px - card titles
  h4: 'text-lg font-medium', // 18px - subsection titles
  
  // UI Elements
  button: 'text-base font-medium', // 16px - buttons
  buttonSmall: 'text-sm font-medium', // 14px - small buttons only
  label: 'text-base font-medium', // 16px - form labels
  input: 'text-base', // 16px - form inputs
  
  // Meta information
  meta: 'text-sm', // 14px - timestamps, counts, etc.
  caption: 'text-xs', // 12px - very small text only when necessary
  
  // Mobile responsive
  mobileBody: 'text-base sm:text-lg', // Larger on mobile for readability
  mobileHeading: 'text-xl sm:text-2xl',
} as const;

// Loading Spinner Sizes - Consistent across app
export const spinnerSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4', 
  md: 'h-6 w-6', // Default size
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
} as const;

// Component-specific text size mappings
export const componentTextSizes = {
  // Topic Cards
  topicTitle: textSizes.h3,
  topicDescription: textSizes.body,
  topicMeta: textSizes.meta,
  
  // Dashboard
  dashboardTitle: textSizes.h1,
  sectionTitle: textSizes.h2,
  cardTitle: textSizes.h3,
  
  // Forms
  formLabel: textSizes.label,
  formInput: textSizes.input,
  formHelp: textSizes.meta,
  formError: textSizes.bodySmall,
  
  // Navigation
  navItem: textSizes.body,
  navLabel: textSizes.bodySmall,
  
  // Buttons
  primaryButton: textSizes.button,
  secondaryButton: textSizes.button,
  smallButton: textSizes.buttonSmall,
  
  // Session UI
  sessionTitle: textSizes.h2,
  sessionStatus: textSizes.body,
  sessionMeta: textSizes.meta,
  chatMessage: textSizes.body,
  
} as const;

// Utility function to get consistent text classes
export function getTextClass(component: keyof typeof componentTextSizes): string {
  return componentTextSizes[component];
}

// Utility function to get spinner class
export function getSpinnerClass(size: keyof typeof spinnerSizes = 'md'): string {
  return `${spinnerSizes[size]} animate-spin`;
}