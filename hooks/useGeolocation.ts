'use client'
import { useState, useEffect } from 'react'

interface GeoLocation {
  zip: string
  city: string
  state: string
  loading: boolean
  error: boolean
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation>({
    zip: '',
    city: '',
    state: '',
    loading: true,
    error: false
  })

  useEffect(() => {
    async function detectLocation() {
      try {
        console.log('🔍 Detecting location from IP...')

        // Using ipapi.co (free, 1000 requests/day)
        const response = await fetch('https://ipapi.co/json/')

        if (!response.ok) {
          throw new Error('Geolocation API failed')
        }

        const data = await response.json()

        // Check if we got valid data
        if (data.postal && data.city && data.region_code) {
          setLocation({
            zip: data.postal,
            city: data.city,
            state: data.region_code,
            loading: false,
            error: false
          })

          console.log('✅ Location detected:', {
            zip: data.postal,
            city: data.city,
            state: data.region_code
          })
        } else {
          throw new Error('Invalid location data')
        }

      } catch (error) {
        console.error('❌ Geolocation error:', error)

        // Fail silently - user will just enter ZIP manually
        setLocation({
          zip: '',
          city: '',
          state: '',
          loading: false,
          error: true
        })
      }
    }

    // Only run on client side
    if (typeof window !== 'undefined') {
      detectLocation()
    } else {
      // Server side - set to not loading
      setLocation({
        zip: '',
        city: '',
        state: '',
        loading: false,
        error: false
      })
    }
  }, [])

  return location
}
