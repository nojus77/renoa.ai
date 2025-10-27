"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface LeadNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  serviceInterest: string;
  leadScore: number;
  propertyValue: number | null;
  contractValue: number | null;
  notes: string | null;
  providerNotes: LeadNote[];
  status: string;
  createdAt: string;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [contractValues, setContractValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');
    
    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchLeads(id);
  }, [router]);

  const fetchLeads = async (id: string) => {
  setLoading(true);
  try {
    const res = await fetch(`/api/provider/leads?providerId=${id}`);
    const data = await res.json();
    
    if (data.leads) {
      console.log('📊 Leads data:', data.leads); // ADD THIS
      data.leads.forEach((lead: any) => {
        console.log(`Lead ${lead.firstName}: status = ${lead.status}`); // ADD THIS
      });
      setLeads(data.leads);
    }
  } catch (error) {
    toast.error('Failed to load leads');
  } finally {
    setLoading(false);
  }
};

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string, contractValue?: number) => {
  try {
    const body: any = { status: newStatus };
    if (contractValue) {
      body.contractValue = contractValue;
    }

    const res = await fetch(`/api/provider/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Failed to update status');

    toast.success(
      newStatus === 'accepted' 
        ? 'Lead accepted! Contact info revealed.' 
        : newStatus === 'converted'
        ? '🎉 Deal closed! Revenue tracked.'
        : 'Lead status updated!'
    );
    
    if (contractValue) {
      setContractValues({ ...contractValues, [leadId]: '' });
    }
    
    fetchLeads(providerId);
  } catch (error) {
    toast.error('Failed to update lead status');
  }
};

const handleUpdateNotes = async (leadId: string, note: string) => {
  if (!note.trim()) return;

  try {
    const res = await fetch(`/api/provider/leads/${leadId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        note: note,
        providerId: providerId 
      }),
    });

    if (!res.ok) throw new Error('Failed to save note');

    toast.success('Note saved!');
    setNoteText({ ...noteText, [`modal-${leadId}`]: '' });
    fetchLeads(providerId);
  } catch (error) {
    console.error('Failed to save note');
    toast.error('Failed to save note');
  }
};

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      matched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      accepted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      converted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      unqualified: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  const blurText = (text: string, showLength: number = 4) => {
    return text.substring(0, showLength) + '•'.repeat(Math.max(text.length - showLength, 8));
  };

  const convertedCount = leads.filter(l => l.status === 'converted').length;
  const totalCompleted = leads.filter(l => l.status === 'converted' || l.status === 'unqualified').length;
  const conversionRate = totalCompleted > 0 ? Math.round((convertedCount / totalCompleted) * 100) : 0;

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Page Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">Your lead management overview</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  New Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">
                  {leads.filter(l => l.status === 'matched').length}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Awaiting your review</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-400">
                  {leads.filter(l => l.status === 'accepted').length}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Working on these</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Converted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400">
                  {convertedCount}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Closed deals</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-400">
                  {conversionRate}%
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {convertedCount} of {totalCompleted} completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Leads Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Your Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-400">No leads assigned yet</p>
                  <p className="text-sm text-zinc-500 mt-2">
                    New leads will appear here when they're assigned to you
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => {
                    const isBlurred = lead.status === 'matched';
                    
                    return (
                      <Card key={lead.id} className="bg-zinc-800/50 border-zinc-700">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-zinc-100">
                                {lead.firstName} {lead.lastName}
                              </h3>
                              <Badge className="mt-2 capitalize bg-zinc-700 text-zinc-300">
                                {lead.serviceInterest}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-emerald-400">
                                {lead.leadScore}
                              </div>
                              <div className="text-xs text-zinc-500">Lead Score</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              {isBlurred ? (
                                <>
                                  <div className="flex items-center gap-2 text-zinc-500">
                                    <Mail className="h-4 w-4" />
                                    <span className="blur-sm select-none">{blurText(lead.email, 3)}</span>
                                    <EyeOff className="h-3 w-3 text-zinc-600" />
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-500">
                                    <Phone className="h-4 w-4" />
                                    <span className="blur-sm select-none">{blurText(lead.phone, 3)}</span>
                                    <EyeOff className="h-3 w-3 text-zinc-600" />
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-500">
                                    <MapPin className="h-4 w-4" />
                                    <span className="blur-sm select-none">{blurText(lead.address, 8)}</span>
                                    <EyeOff className="h-3 w-3 text-zinc-600" />
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                    <MapPin className="h-4 w-4 text-zinc-500" />
                                    <span>{lead.city}, {lead.state}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                    <Mail className="h-4 w-4 text-zinc-500" />
                                    <a href={`mailto:${lead.email}`} className="hover:text-emerald-400">
                                      {lead.email}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                    <Phone className="h-4 w-4 text-zinc-500" />
                                    <a href={`tel:${lead.phone}`} className="hover:text-emerald-400">
                                      {lead.phone}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                    <MapPin className="h-4 w-4 text-zinc-500" />
                                    <span>{lead.address}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                    <MapPin className="h-4 w-4 text-zinc-500" />
                                    <span>{lead.city}, {lead.state}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="space-y-2">
                              {lead.propertyValue && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-emerald-500" />
                                  <span className="text-emerald-400 font-semibold">
                                    {formatCurrency(lead.propertyValue)}
                                  </span>
                                  <span className="text-xs text-zinc-500">Property Value</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>Received {formatDate(lead.createdAt)}</span>
                              </div>
                              <div>
                                <Badge className={`${getStatusColor(lead.status)} border capitalize`}>
                                  {lead.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Admin Notes */}
                          {lead.notes && (
                            <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-700">
                              <p className="text-sm text-zinc-400">
                                <strong className="text-zinc-300">Admin Notes:</strong> {lead.notes}
                              </p>
                            </div>
                          )}

                          {/* Provider Notes Button - Polished */}
{(lead.status === 'accepted' || lead.status === 'converted' || lead.status === 'unqualified') && (
  <div className="mb-4">
    <div className="flex items-center gap-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-300">Your Private Notes</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {lead.providerNotes?.length || 0} note{lead.providerNotes?.length !== 1 ? 's' : ''} saved
        </p>
      </div>
      <Button
        size="sm"
        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
        onClick={() => {
          const modal = document.getElementById(`notes-modal-${lead.id}`);
          if (modal) modal.style.display = 'flex';
        }}
      >
        {lead.providerNotes?.length > 0 ? 'View & Edit' : 'Add Note'}
      </Button>
    </div>

    {/* Notes Modal */}
    <div
      id={`notes-modal-${lead.id}`}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.currentTarget.style.display = 'none';
        }
      }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              Notes for {lead.firstName} {lead.lastName}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              {lead.providerNotes?.length || 0} total note{lead.providerNotes?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-100"
            onClick={() => {
              const modal = document.getElementById(`notes-modal-${lead.id}`);
              if (modal) modal.style.display = 'none';
            }}
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {lead.providerNotes && lead.providerNotes.length > 0 ? (
            lead.providerNotes.map((note, index) => (
              <div
                key={note.id}
                className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-500">
                    Note #{lead.providerNotes.length - index}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {note.note}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-zinc-400 font-medium">No notes yet</p>
              <p className="text-sm text-zinc-500 mt-1">Add your first note below to get started</p>
            </div>
          )}
        </div>

        {/* Add Note in Modal */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <label className="text-sm font-semibold text-zinc-300 mb-2 block">
            Add New Note
          </label>
          <div className="flex gap-2">
            <textarea
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Type your note here..."
              value={noteText[`modal-${lead.id}`] || ''}
              onChange={(e) => setNoteText({ ...noteText, [`modal-${lead.id}`]: e.target.value })}
            />
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 self-end"
              onClick={() => {
                if (noteText[`modal-${lead.id}`]?.trim()) {
                  handleUpdateNotes(lead.id, noteText[`modal-${lead.id}`]);
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{isBlurred && (
  <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
    <p className="text-sm text-blue-400 flex items-center gap-2">
      <EyeOff className="h-4 w-4" />
      Contact information will be revealed when you accept this lead
    </p>
  </div>
)}

<div className="flex gap-2 pt-4 border-t border-zinc-700">
  {lead.status === 'matched' && (
    <Button
      size="sm"
      className="bg-blue-600 hover:bg-blue-500"
      onClick={() => handleUpdateLeadStatus(lead.id, 'accepted')}
    >
      <Eye className="h-4 w-4 mr-2" />
      Accept Lead
    </Button>
  )}
  
  {lead.status === 'accepted' && (
    <div className="w-full space-y-3">
      <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-700">
        <label className="text-xs font-semibold text-zinc-400 mb-2 block">
          Contract Value (Required to Convert)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <input
              type="number"
              placeholder="5,000"
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
              value={contractValues[lead.id] || ''}
              onChange={(e) => setContractValues({ ...contractValues, [lead.id]: e.target.value })}
            />
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={() => {
              const value = contractValues[lead.id];
              if (value && parseFloat(value) > 0) {
                handleUpdateLeadStatus(lead.id, 'converted', parseFloat(value));
              } else {
                toast.error('Please enter a valid contract value');
              }
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Convert
          </Button>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full border-rose-700 text-rose-400 hover:bg-rose-500/10"
        onClick={() => handleUpdateLeadStatus(lead.id, 'unqualified')}
      >
        <XCircle className="h-4 w-4 mr-2" />
        Mark as Unqualified
      </Button>
    </div>
  )}
  
  {lead.status === 'converted' && (
    <div className="flex items-center gap-2 text-emerald-400">
      <CheckCircle2 className="h-5 w-5" />
      <span className="font-semibold">Deal Closed! 🎉</span>
    </div>
  )}
  
  {lead.status === 'unqualified' && (
    <div className="flex items-center gap-2 text-zinc-500">
      <XCircle className="h-5 w-5" />
      <span>Lead not qualified</span>
    </div>
  )}
</div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProviderLayout>
  );
}