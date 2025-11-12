'use client';

import CustomerLayout from '@/components/customer/CustomerLayout';
import { MessageSquare } from 'lucide-react';

export default function CustomerMessagesPage() {
  return (
    <CustomerLayout>
      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Messages</h2>
        <p className="text-zinc-600">Coming soon - Chat with your service provider here</p>
      </div>
    </CustomerLayout>
  );
}
