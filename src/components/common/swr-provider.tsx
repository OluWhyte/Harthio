'use client';

/**
 * SWR Provider Component
 * Phase 2 Performance Optimization - Global SWR Configuration
 */

import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}
