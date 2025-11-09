'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function GoogleMaps() {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!API_KEY) {
    console.warn('[GoogleMaps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined')
    return null
  }

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`}
      strategy="afterInteractive"
      onLoad={() => console.log('[GoogleMaps] ✅ Google Maps API loaded successfully')}
      onError={(e) => console.error('[GoogleMaps] ❌ Failed to load Google Maps API:', e)}
    />
  )
}
