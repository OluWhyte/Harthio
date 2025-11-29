/**
 * Service Worker Registration and Management
 * Phase 3 Performance Optimization
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Only register in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SW] Service Worker disabled in development');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[SW] New version available');
              
              // Notify user about update
              if (confirm('A new version is available. Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading...');
        window.location.reload();
      });

    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  });
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister();
  });
}

export async function clearServiceWorkerCache() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  if (registration.active) {
    registration.active.postMessage({ type: 'CLEAR_CACHE' });
  }
}
