// Error suppression for browser extensions like MetaMask
export function suppressExtensionErrors() {
  if (typeof window === 'undefined') return;

  // Suppress MetaMask and other extension errors
  const originalError = window.console.error;
  window.console.error = (...args) => {
    const message = args.join(' ');
    
    // Skip MetaMask related errors
    if (
      message.includes('MetaMask') ||
      message.includes('chrome-extension://') ||
      message.includes('Failed to connect to MetaMask') ||
      message.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
    ) {
      return;
    }
    
    // Log other errors normally
    originalError.apply(console, args);
  };

  // Handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (
      error &&
      (error.message?.includes('MetaMask') ||
       error.message?.includes('chrome-extension://') ||
       error.stack?.includes('chrome-extension://'))
    ) {
      event.preventDefault();
    }
  });

  // Handle runtime errors from extensions
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('MetaMask') ||
      event.message?.includes('chrome-extension://') ||
      event.filename?.includes('chrome-extension://')
    ) {
      event.preventDefault();
    }
  });
}