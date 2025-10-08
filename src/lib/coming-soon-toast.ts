/**
 * Coming Soon Toast Utility
 * Shows toast notifications for features that are not yet implemented
 */

import { toast } from '@/hooks/use-toast';

/**
 * Show coming soon toast for careers page
 */
export function showCareersComingSoon() {
  toast({
    title: '🚀 Careers Page Coming Soon!',
    description: 'We\'re building an amazing careers page. Check back soon for exciting opportunities to join the Harthio team!',
    duration: 4000,
  });
}

/**
 * Show coming soon toast for work with us
 */
export function showWorkWithUsComingSoon() {
  toast({
    title: '💼 Work With Us - Coming Soon!',
    description: 'Exciting opportunities to collaborate with Harthio are on the way. Stay tuned for updates!',
    duration: 4000,
  });
}

/**
 * Show coming soon toast for press page
 */
export function showPressComingSoon() {
  toast({
    title: '📰 Press Resources Coming Soon!',
    description: 'We\'re preparing comprehensive press resources and media kits. Check our blog for the latest updates!',
    duration: 4000,
  });
}

/**
 * Generic coming soon toast
 */
export function showGenericComingSoon(featureName: string) {
  toast({
    title: `🔜 ${featureName} Coming Soon!`,
    description: 'This feature is currently in development. We\'ll notify you when it\'s ready!',
    duration: 3000,
  });
}

export default {
  showCareersComingSoon,
  showWorkWithUsComingSoon,
  showPressComingSoon,
  showGenericComingSoon,
};