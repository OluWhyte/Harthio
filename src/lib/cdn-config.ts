/**
 * CDN Configuration and Image Optimization
 * Phase 3 Performance Optimization
 */

/**
 * CDN domains for static assets
 */
export const CDN_CONFIG = {
  // Primary CDN (Vercel/Cloudflare)
  primary: process.env.NEXT_PUBLIC_CDN_URL || '',
  
  // Image CDN (Cloudinary/imgix)
  images: process.env.NEXT_PUBLIC_IMAGE_CDN_URL || '',
  
  // Static assets CDN
  static: process.env.NEXT_PUBLIC_STATIC_CDN_URL || '',
};

/**
 * Image optimization parameters
 */
export interface ImageOptimizationParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
}

/**
 * Generate optimized image URL
 */
export function getOptimizedImageUrl(
  src: string,
  params: ImageOptimizationParams = {}
): string {
  // If no CDN configured, return original
  if (!CDN_CONFIG.images) {
    return src;
  }

  // Default parameters
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'cover',
  } = params;

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (width) queryParams.set('w', width.toString());
  if (height) queryParams.set('h', height.toString());
  queryParams.set('q', quality.toString());
  queryParams.set('fm', format);
  queryParams.set('fit', fit);

  // Encode source URL
  const encodedSrc = encodeURIComponent(src);

  return `${CDN_CONFIG.images}/${encodedSrc}?${queryParams.toString()}`;
}

/**
 * Generate responsive image srcset
 */
export function getResponsiveImageSrcSet(
  src: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920]
): string {
  return widths
    .map(width => {
      const url = getOptimizedImageUrl(src, { width, quality: 80 });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate blur placeholder data URL
 */
export function getBlurDataURL(src: string): string {
  return getOptimizedImageUrl(src, {
    width: 10,
    quality: 10,
    blur: 10,
  });
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'high') {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;

  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(img: HTMLImageElement) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          const src = image.dataset.src;
          
          if (src) {
            image.src = src;
            image.removeAttribute('data-src');
            observer.unobserve(image);
          }
        }
      });
    });

    observer.observe(img);
  } else {
    // Fallback for browsers without Intersection Observer
    const src = img.dataset.src;
    if (src) {
      img.src = src;
    }
  }
}

/**
 * Get static asset URL from CDN
 */
export function getStaticAssetUrl(path: string): string {
  if (!CDN_CONFIG.static) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${CDN_CONFIG.static}/${cleanPath}`;
}

/**
 * Prefetch DNS for external domains
 */
export function prefetchDNS(domains: string[]) {
  if (typeof window === 'undefined') return;

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external domains
 */
export function preconnect(domains: string[]) {
  if (typeof window === 'undefined') return;

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Initialize CDN optimizations
 */
export function initCDNOptimizations() {
  if (typeof window === 'undefined') return;

  // Prefetch DNS for common external domains
  prefetchDNS([
    'https://images.unsplash.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ]);

  // Preconnect to critical domains
  preconnect([
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    CDN_CONFIG.images,
    CDN_CONFIG.static,
  ].filter(Boolean));
}
