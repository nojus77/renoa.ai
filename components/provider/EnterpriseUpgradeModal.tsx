'use client'

import { X, CheckCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnterpriseUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  currentSeats: number;
}

export default function EnterpriseUpgradeModal({
  isOpen,
  onClose,
  businessName,
  currentSeats,
}: EnterpriseUpgradeModalProps) {
  if (!isOpen) return null;

  const handleContactSales = () => {
    const subject = encodeURIComponent(`Enterprise Pricing - ${businessName}`);
    const body = encodeURIComponent(
      `Hi Renoa Team,\n\nWe're growing fast and need to add more than ${currentSeats} team members to our account.\n\nWe'd like to learn more about enterprise pricing, volume discounts, and dedicated support options.\n\nBusiness Name: ${businessName}\nCurrent Team Size: ${currentSeats} users\n\nBest regards`
    );
    window.location.href = `mailto:sales@renoa.ai?subject=${subject}&body=${body}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Ready for Enterprise?</h2>
                <p className="text-sm text-zinc-400">Your team is growing!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-zinc-300 mb-6">
              Congratulations on your growth! For teams over 50 users, we offer:
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Volume Discounts</p>
                  <p className="text-xs text-zinc-400">Lower per-seat pricing for larger teams</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Dedicated Account Manager</p>
                  <p className="text-xs text-zinc-400">Personal support for your business needs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Priority Support</p>
                  <p className="text-xs text-zinc-400">Faster response times and dedicated assistance</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Custom Integrations</p>
                  <p className="text-xs text-zinc-400">Tailored solutions for your workflow</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Advanced Security</p>
                  <p className="text-xs text-zinc-400">SSO, audit logs, and compliance features</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-emerald-300">
                <strong>Current Team Size:</strong> {currentSeats} users
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Contact our sales team to discuss pricing for your growing business.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleContactSales}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-zinc-700 hover:bg-zinc-800"
              >
                Not Yet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
