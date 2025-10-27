/**
 * Console Cleanup Utilities
 * Suppress known harmless console errors and warnings
 */

// Suppress known harmless errors
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suppress known harmless errors
    const suppressedErrors = [
      'content.bundle.js', // Browser extension errors
      'Assignment to constant variable', // Extension conflicts
      'Cannot access \'c\' before initialization', // Extension conflicts
    ];

    if (suppressedErrors.some(error => message.includes(error))) {
      // Suppress these errors (they're from browser extensions)
      return;
    }

    // Log other errors normally
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Suppress known harmless warnings
    const suppressedWarnings = [
      'Unrecognized feature: \'speaker-selection\'', // Jitsi warning
      'content.bundle.js', // Extension warnings
    ];

    if (suppressedWarnings.some(warning => message.includes(warning))) {
      // Suppress these warnings
      return;
    }

    // Log other warnings normally
    originalWarn.apply(console, args);
  };
}

export {}; // Make this a module