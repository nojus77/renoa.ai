"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingModal from '@/components/provider/OnboardingModal';

export default function OnboardingPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setShowModal(true);
  }, [router]);

  const handleComplete = () => {
    router.push('/provider/dashboard');
  };

  const handleClose = () => {
    router.push('/provider/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <OnboardingModal
        isOpen={showModal}
        onClose={handleClose}
        providerId={providerId}
        onComplete={handleComplete}
      />
    </div>
  );
}
