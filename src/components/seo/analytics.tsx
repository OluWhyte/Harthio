"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function Analytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const pathname = usePathname();

  // Don't load analytics on admin pages or private routes
  const isPrivatePage =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/session") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/(dashboard)");

  useEffect(() => {
    if (!GA_ID || isPrivatePage) return;

    // Load Google Analytics script dynamically
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script1);

    // Initialize Google Analytics
    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', {
        page_title: document.title,
        page_location: window.location.href,
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
    `;
    document.head.appendChild(script2);

    // Cleanup function
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [GA_ID, isPrivatePage]);

  if (!GA_ID || isPrivatePage) return null;

  return null; // Scripts are loaded via useEffect
}
