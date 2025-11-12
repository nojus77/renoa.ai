'use client';

import CustomerLayout from '@/components/customer/CustomerLayout';
import { FileText } from 'lucide-react';

export default function CustomerInvoicesPage() {
  return (
    <CustomerLayout>
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Invoices</h2>
        <p className="text-zinc-600">Coming soon - View and pay your invoices here</p>
      </div>
    </CustomerLayout>
  );
}
