'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

export function AdminAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
  const pathname = usePathname()

  // Only load on admin pages for internal tracking
  const isAdminPage = pathname.startsWith('/admin')

  if (!GA_ID || !isAdminPage) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script 
        id="admin-analytics" 
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_title: 'Admin: ' + document.title,
              page_location: window.location.href,
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false,
              send_page_view: true
            });
          `
        }}
      />
    </>
  )
}