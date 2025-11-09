'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export default function GoogleAnalytics() {
  const [consent, setConsent] = useState(false)
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID

  useEffect(() => {
    const checkConsent = () => {
      try {
        const preferencesStr = localStorage.getItem('cookie_preferences')
        console.log('[GA] Raw localStorage:', preferencesStr)

        if (preferencesStr) {
          const preferences = JSON.parse(preferencesStr)
          console.log('[GA] Parsed preferences:', preferences)

          const hasConsent = preferences.analytics === true
          console.log('[GA] Has analytics consent:', hasConsent)

          setConsent(hasConsent)
        } else {
          console.log('[GA] No cookie_preferences found in localStorage')
          setConsent(false)
        }
      } catch (e) {
        console.error('[GA] Error checking consent:', e)
        setConsent(false)
      }
    }

    // Check immediately
    console.log('[GA] Component mounted, checking consent...')
    checkConsent()

    // Poll for changes (in case consent is given after mount)
    const interval = setInterval(() => {
      console.log('[GA] Polling for consent...')
      checkConsent()
    }, 1000)

    // Stop polling after 10 seconds
    setTimeout(() => {
      console.log('[GA] Stopping consent polling')
      clearInterval(interval)
    }, 10000)

    // Listen for storage events
    window.addEventListener('storage', checkConsent)

    // Listen for consent changes via custom event
    const handleConsentChange = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('[GA] Consent changed event received:', customEvent.detail)
      checkConsent()
    }
    window.addEventListener('cookieConsentChanged', handleConsentChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', checkConsent)
      window.removeEventListener('cookieConsentChanged', handleConsentChange)
    }
  }, [])

  // Log when consent changes
  useEffect(() => {
    console.log('[GA] Consent state changed to:', consent)
    console.log('[GA] GA_ID:', GA_ID)
  }, [consent, GA_ID])

  if (!GA_ID) {
    console.warn('[GA] NEXT_PUBLIC_GA_ID not configured in environment')
    return null
  }

  if (!consent) {
    console.log('[GA] No consent - not loading Google Analytics')
    return null
  }

  console.log('[GA] ✅ CONSENT GRANTED - Loading Google Analytics with ID:', GA_ID)

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        onLoad={() => console.log('[GA] ✅ gtag.js script loaded successfully')}
        onError={(e) => console.error('[GA] ❌ Failed to load gtag.js:', e)}
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          console.log('[GA] Initializing gtag...');
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
          console.log('[GA] ✅ gtag initialized and configured');
        `}
      </Script>
    </>
  )
}
