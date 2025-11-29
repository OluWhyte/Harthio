# Performance Optimization Plan - Faster Load Times

## Current Performance Issues

### Landing Page
- Large images from Unsplash (not optimized)
- Multiple animations loading at once
- Heavy Framer Motion bundle
- No code splitting for carousel components

### Authenticated Pages
- Loading all data on mount
- No caching strategy
- Large bundle sizes
- Unnecessary re-renders

## Optimization Strategy

### 1. Image Optimization ⭐ HIGHEST IMPACT

**Problem**: Unsplash images are 2-5MB each, slowing initial load.

**Solutions**:

#### A. Use Next.js Image Optimization
```typescript
// ❌ Before
<img src="https://images.unsplash.com/photo-xxx?q=80&w=1170" />

// ✅ After
<Image 
  src="https://images.unsplash.com/photo-xxx?q=80&w=1170"
  width={1170}
  height={780}
  alt="Description"
  priority={false} // Only true for above-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Tiny placeholder
/>
```

#### B. Optimize Image Sizes
```javascript
// next.config.js
images: {
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ['image/webp', 'image/avif'], // Modern formats
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
}
```

#### C. Use Local Optimized Images
- Download and optimize testimonial images
- Convert to WebP format (70% smaller)
- Store in `/public/images/optimized/`
- Serve from CDN

**Expected Impact**: 
- Landing page load: 3-5s → 1-2s
- Image size: 2-5MB → 50-200KB

### 2. Code Splitting & Lazy Loading

**Problem**: Loading all components upfront, even below fold.

**Solutions**:

#### A. Dynamic Imports for Heavy Components
```typescript
// ❌ Before
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { AICompanionShowcase } from '@/components/landing/AICompanionShowcase';

// ✅ After
const HeroCarousel = dynamic(() => import('@/components/landing/HeroCarousel'), {
  loading: () => <div className="h-[500px] animate-pulse bg-gray-100" />,
  ssr: true // Keep SSR for SEO
});

const AICompanionShowcase = dynamic(
  () => import('@/components/landing/AICompanionShowcase'),
  { ssr: false } // Load only on client, below fold
);
```

#### B. Lazy Load Animations
```typescript
// Only load Framer Motion when needed
const motion = dynamic(() => import('framer-motion').then(mod => mod.motion));
```

#### C. Route-Based Code Splitting
```typescript
// Automatically split by route
// /login → login.chunk.js
// /dashboard → dashboard.chunk.js
// /session → session.chunk.js
```

**Expected Impact**:
- Initial bundle: 500KB → 200KB
- Time to Interactive: 4s → 2s

### 3. Font Optimization

**Problem**: Loading Google Fonts blocks rendering.

**Solutions**:

#### A. Use next/font
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Show fallback immediately
  preload: true,
  variable: '--font-inter',
});
```

#### B. Self-Host Fonts
- Download font files
- Store in `/public/fonts/`
- Serve from same domain (faster)

**Expected Impact**:
- Font load time: 500ms → 50ms
- No render blocking

### 4. Data Fetching Optimization

**Problem**: Loading all data on page mount, causing delays.

**Solutions**:

#### A. Parallel Data Fetching
```typescript
// ❌ Before (Sequential - slow)
const user = await getUser();
const sessions = await getSessions(user.id);
const notifications = await getNotifications(user.id);

// ✅ After (Parallel - fast)
const [user, sessions, notifications] = await Promise.all([
  getUser(),
  getSessions(),
  getNotifications(),
]);
```

#### B. Incremental Loading
```typescript
// Load critical data first, rest later
useEffect(() => {
  // Critical: Load immediately
  loadUserProfile();
  
  // Non-critical: Load after 1 second
  setTimeout(() => {
    loadNotifications();
    loadHistory();
  }, 1000);
}, []);
```

#### C. Implement SWR/React Query
```typescript
import useSWR from 'swr';

function Dashboard() {
  const { data: user } = useSWR('/api/user', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 minute
  });
  
  return <div>{user?.name}</div>;
}
```

**Expected Impact**:
- Dashboard load: 2-3s → 0.5-1s
- Reduced API calls by 70%

### 5. Bundle Size Reduction

**Problem**: Large JavaScript bundles slow download and parsing.

**Solutions**:

#### A. Analyze Bundle
```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

```bash
ANALYZE=true npm run build
```

#### B. Remove Unused Dependencies
```json
// Check these heavy packages:
- "recharts": 200KB (use lightweight alternative?)
- "framer-motion": 150KB (lazy load)
- "jspdf": 100KB (lazy load, only for exports)
```

#### C. Tree Shaking
```typescript
// ❌ Import entire library
import _ from 'lodash';

// ✅ Import only what you need
import debounce from 'lodash/debounce';
```

**Expected Impact**:
- Bundle size: 500KB → 300KB
- Parse time: 1s → 0.5s

### 6. Caching Strategy

**Problem**: Re-fetching same data on every page load.

**Solutions**:

#### A. Browser Caching
```typescript
// API routes with cache headers
export async function GET(request: Request) {
  const data = await fetchData();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Content-Type': 'application/json',
    },
  });
}
```

#### B. Service Worker Caching
```typescript
// Cache static assets
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

#### C. Local Storage Caching
```typescript
// Cache user profile locally
const cachedProfile = localStorage.getItem('user_profile');
if (cachedProfile && !isStale(cachedProfile)) {
  return JSON.parse(cachedProfile);
}
```

**Expected Impact**:
- Repeat visits: 3s → 0.5s
- API calls reduced by 80%

### 7. Reduce Re-renders

**Problem**: Components re-rendering unnecessarily.

**Solutions**:

#### A. Use React.memo
```typescript
// ❌ Before
export function UserCard({ user }) {
  return <div>{user.name}</div>;
}

// ✅ After
export const UserCard = React.memo(function UserCard({ user }) {
  return <div>{user.name}</div>;
});
```

#### B. Use useMemo/useCallback
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

#### C. Optimize Context
```typescript
// Split contexts to prevent unnecessary re-renders
<AuthContext>
  <ThemeContext>
    <NotificationContext>
      {children}
    </NotificationContext>
  </ThemeContext>
</AuthContext>
```

**Expected Impact**:
- Render time: 500ms → 100ms
- Smoother interactions

### 8. Prefetching & Preloading

**Problem**: Waiting for navigation to start loading data.

**Solutions**:

#### A. Prefetch Links
```typescript
// Automatically prefetch on hover
<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>
```

#### B. Preload Critical Resources
```typescript
// app/layout.tsx
<head>
  <link rel="preload" href="/fonts/inter.woff2" as="font" crossOrigin="anonymous" />
  <link rel="preconnect" href="https://images.unsplash.com" />
  <link rel="dns-prefetch" href="https://api.supabase.co" />
</head>
```

#### C. Predictive Prefetching
```typescript
// Prefetch likely next pages
useEffect(() => {
  if (isOnHomePage) {
    router.prefetch('/sessions');
    router.prefetch('/harthio');
  }
}, [isOnHomePage]);
```

**Expected Impact**:
- Navigation: 1-2s → Instant
- Perceived performance: Much faster

### 9. Server-Side Rendering (SSR) Optimization

**Problem**: Client-side rendering causes layout shifts.

**Solutions**:

#### A. Use Server Components
```typescript
// app/page.tsx (Server Component by default)
async function LandingPage() {
  const testimonials = await getTestimonials(); // Runs on server
  
  return <TestimonialGrid testimonials={testimonials} />;
}
```

#### B. Streaming SSR
```typescript
// Show page shell immediately, stream content
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
```

**Expected Impact**:
- First Contentful Paint: 2s → 0.5s
- No layout shifts

### 10. Database Query Optimization

**Problem**: Slow database queries delay page loads.

**Solutions**:

#### A. Add Indexes
```sql
-- Speed up common queries
CREATE INDEX idx_topics_start_time ON topics(start_time);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_messages_topic_id ON messages(topic_id);
```

#### B. Limit Query Results
```typescript
// ❌ Fetch all
const sessions = await supabase.from('topics').select('*');

// ✅ Fetch only needed
const sessions = await supabase
  .from('topics')
  .select('id, title, start_time')
  .limit(20)
  .order('start_time', { ascending: false });
```

#### C. Use Database Functions
```sql
-- Move complex logic to database
CREATE FUNCTION get_user_dashboard_data(user_id UUID)
RETURNS JSON AS $$
  -- Combine multiple queries into one
$$ LANGUAGE sql;
```

**Expected Impact**:
- Query time: 500ms → 50ms
- Reduced network roundtrips

## Implementation Priority

### Phase 1: Quick Wins (Week 1) - 50% Improvement
1. ✅ Optimize images (WebP, proper sizing)
2. ✅ Add dynamic imports for heavy components
3. ✅ Implement font optimization
4. ✅ Add parallel data fetching
5. ✅ Enable browser caching

### Phase 2: Medium Effort (Week 2) - 30% Improvement
6. ✅ Implement SWR/caching strategy
7. ✅ Reduce bundle size (tree shaking, lazy loading)
8. ✅ Add prefetching for navigation
9. ✅ Optimize re-renders (memo, useMemo)
10. ✅ Add database indexes

### Phase 3: Advanced (Week 3) - 20% Improvement
11. ✅ Implement service worker
12. ✅ Add streaming SSR
13. ✅ Optimize database queries
14. ✅ Add performance monitoring
15. ✅ Implement CDN for static assets

## Measurement & Monitoring

### Tools to Use
- **Lighthouse**: Measure Core Web Vitals
- **Next.js Analytics**: Track real user metrics
- **Bundle Analyzer**: Monitor bundle sizes
- **React DevTools Profiler**: Find slow components

### Key Metrics to Track

**Before Optimization**:
- Landing Page Load: 3-5s
- Time to Interactive: 4-6s
- First Contentful Paint: 2-3s
- Bundle Size: 500KB
- Lighthouse Score: 60-70

**After Optimization (Target)**:
- Landing Page Load: 1-2s ⚡
- Time to Interactive: 1.5-2s ⚡
- First Contentful Paint: 0.5-1s ⚡
- Bundle Size: 200-300KB ⚡
- Lighthouse Score: 90-100 ⚡

## Quick Implementation Checklist

### Landing Page
- [ ] Convert Unsplash images to WebP
- [ ] Add `priority` to hero image
- [ ] Lazy load testimonials section
- [ ] Lazy load AI showcase
- [ ] Optimize Framer Motion usage

### Authenticated Pages
- [ ] Implement SWR for data fetching
- [ ] Add loading skeletons
- [ ] Prefetch common routes
- [ ] Cache user profile locally
- [ ] Optimize session list queries

### Global
- [ ] Use next/font for typography
- [ ] Add service worker
- [ ] Enable compression
- [ ] Add CDN for images
- [ ] Monitor with Lighthouse

## Expected Results

### User Experience
- **Landing page**: Loads instantly (< 1s)
- **Navigation**: Feels instant with prefetching
- **Interactions**: Smooth, no lag
- **Mobile**: Fast even on 3G

### Business Impact
- **Bounce rate**: Reduced by 40%
- **Conversion**: Increased by 25%
- **SEO**: Better rankings (speed is ranking factor)
- **User satisfaction**: Higher retention

## Conclusion

By implementing these optimizations in phases, we can achieve:
- **80% faster load times**
- **Better user experience**
- **Higher conversion rates**
- **Improved SEO rankings**

The key is starting with high-impact, low-effort optimizations (images, code splitting) and progressively implementing more advanced techniques.
