'use client'
import { useState } from 'react'

interface BrowserLocation {
  zip: string
  city: string
  state: string
  loading: boolean
  error: string | null
}

export function useBrowserLocation() {
  const [location, setLocation] = useState<BrowserLocation>({
    zip: '',
    city: '',
    state: '',
    loading: false,
    error: null
  })

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation not supported'
      }))
      return
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Use Nominatim (OpenStreetMap) for reverse geocoding (free, unlimited)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'User-Agent': 'Renoa.ai' // Required by Nominatim
              }
            }
          )

          const data = await response.json()

          setLocation({
            zip: data.address?.postcode || '',
            city: data.address?.city || data.address?.town || '',
            state: data.address?.state || '',
            loading: false,
            error: null
          })

          console.log('✅ Browser location detected:', data.address)

        } catch (error) {
          console.error('❌ Reverse geocoding error:', error)
          setLocation(prev => ({
            ...prev,
            loading: false,
            error: 'Could not determine location'
          }))
        }
      },
      (error) => {
        console.error('❌ Browser geolocation error:', error)
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: error.code === 1 ? 'Permission denied' : 'Location unavailable'
        }))
      },
      {
        enableHighAccuracy: false,
        timeout: 10000
      }
    )
  }

  return { location, requestLocation }
}
