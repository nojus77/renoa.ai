'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Moon,
  Save,
  Clock,
  CheckCircle,
  Settings as SettingsIcon,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface NotificationSetting {
  type: string;
  label: string;
  description: string;
  sms: boolean;
  email: boolean;
}

export default function NotificationSettings() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Global settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  // Individual notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      type: 'job_scheduled',
      label: 'Job Scheduled',
      description: 'When a new job is scheduled with the customer',
      sms: true,
      email: true,
    },
    {
      type: 'lead_accepted',
      label: 'Lead Accepted',
      description: 'When you accept a new lead from Renoa',
      sms: true,
      email: true,
    },
    {
      type: 'reminder_24h',
      label: '24-Hour Reminder',
      description: 'Reminder sent to customer 24 hours before the job',
      sms: true,
      email: false,
    },
    {
      type: 'provider_on_way',
      label: 'Provider On The Way',
      description: 'When you mark that you\'re heading to the job location',
      sms: true,
      email: false,
    },
    {
      type: 'job_complete',
      label: 'Job Completed',
      description: 'When you mark a job as complete',
      sms: true,
      email: true,
    },
    {
      type: 'invoice_sent',
      label: 'Invoice Sent',
      description: 'When an invoice is sent to the customer',
      sms: true,
      email: true,
    },
    {
      type: 'payment_received',
      label: 'Payment Received',
      description: 'When payment is received from the customer',
      sms: true,
      email: true,
    },
  ]);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    loadSettings(id);
  }, [router]);

  const loadSettings = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/settings/notifications?providerId=${id}`);
      const data = await res.json();

      if (data.settings) {
        // Load settings from API
        if (data.settings.notificationsEnabled !== undefined) {
          setNotificationsEnabled(data.settings.notificationsEnabled);
        }
        if (data.settings.quietHoursEnabled !== undefined) {
          setQuietHoursEnabled(data.settings.quietHoursEnabled);
        }
        if (data.settings.quietHoursStart) {
          setQuietHoursStart(data.settings.quietHoursStart);
        }
        if (data.settings.quietHoursEnd) {
          setQuietHoursEnd(data.settings.quietHoursEnd);
        }
        if (data.settings.notificationSettings) {
          setNotificationSettings(data.settings.notificationSettings);
        }
      }
    } catch (error) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSMS = (index: number) => {
    const updated = [...notificationSettings];
    updated[index].sms = !updated[index].sms;
    setNotificationSettings(updated);
  };

  const handleToggleEmail = (index: number) => {
    const updated = [...notificationSettings];
    updated[index].email = !updated[index].email;
    setNotificationSettings(updated);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/provider/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          notificationsEnabled,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd,
          notificationSettings,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href="/provider/settings"
                    className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                    <Bell className="h-7 w-7" />
                    Notification Settings
                  </h1>
                </div>
                <p className="text-sm text-zinc-400 ml-14">
                  Manage customer notifications and communication preferences
                </p>
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Global Notification Toggle */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                {notificationsEnabled ? (
                  <Bell className="h-5 w-5 text-emerald-400" />
                ) : (
                  <BellOff className="h-5 w-5 text-zinc-500" />
                )}
                Customer Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-zinc-100">Enable All Notifications</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Master switch for all customer notifications. When disabled, no notifications will be sent.
                  </p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Moon className="h-5 w-5 text-blue-400" />
                Quiet Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-100">Enable Quiet Hours</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      No SMS notifications will be sent during quiet hours (emails are not affected)
                    </p>
                  </div>
                  <button
                    onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      quietHoursEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        quietHoursEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Individual Notification Settings */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Notification Types</CardTitle>
              <p className="text-sm text-zinc-400 mt-2">
                Choose which notifications to send via SMS and email for each event
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificationSettings.map((setting, index) => (
                  <div
                    key={setting.type}
                    className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-100 mb-1">
                          {setting.label}
                        </h3>
                        <p className="text-sm text-zinc-400">{setting.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* SMS Toggle */}
                      <button
                        onClick={() => handleToggleSMS(index)}
                        disabled={!notificationsEnabled}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          setting.sms && notificationsEnabled
                            ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                        } ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">SMS</span>
                        {setting.sms && notificationsEnabled && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>

                      {/* Email Toggle */}
                      <button
                        onClick={() => handleToggleEmail(index)}
                        disabled={!notificationsEnabled}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          setting.email && notificationsEnabled
                            ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                        } ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
                      >
                        <Mail className="h-4 w-4" />
                        <span className="text-sm font-medium">Email</span>
                        {setting.email && notificationsEnabled && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-100 mb-2">
                    Keep Your Customers Informed
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Automated notifications help keep customers in the loop at every step.
                    They&apos;ll know when you accept their request, when you&apos;re on your way, and when the job is complete.
                    This reduces support requests and improves customer satisfaction.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Best Practice
                    </Badge>
                    <p className="text-xs text-zinc-400">
                      Customers can opt out by replying &quot;STOP&quot; to any SMS
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {saving ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
