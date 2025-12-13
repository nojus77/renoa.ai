'use client';

import { useState, useEffect } from 'react';
import { Home } from 'lucide-react';

interface PropertyPhotoProps {
  address: string;
  customerId?: string;
  className?: string;
}

export function PropertyPhoto({
  address,
  customerId,
  className = '',
}: PropertyPhotoProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchPhoto = async () => {
      try {
        const res = await fetch('/api/property/streetview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, address }),
        });

        if (res.ok) {
          const data = await res.json();
          setImageUrl(data.url);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [address, customerId]);

  if (loading) {
    return (
      <div
        className={`bg-zinc-800 animate-pulse flex items-center justify-center ${className}`}
      >
        <Home className="w-8 h-8 text-zinc-600" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        className={`bg-zinc-800 flex items-center justify-center ${className}`}
      >
        <Home className="w-8 h-8 text-zinc-600" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Property"
      className={`object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}
