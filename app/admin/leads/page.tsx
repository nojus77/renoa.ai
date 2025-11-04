"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X, Sparkles, Star, MapPin, Phone, Mail, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

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
  propertyValue: number;
  serviceInterest: string;
  leadScore: number;
  tier: number;
  status: string;
  createdAt: string;
  assignedProviderId?: string | null;
  assignedProvider?: {
    id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
  } | null;
  notes?: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [matching, setMatching] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [serviceInterest, setServiceInterest] = useState('landscaping');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads?limit=1000');
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      console.log('📊 Fetched leads:', data.leads?.length || 0);
      setLeads(data.leads || []);
    } catch (error) {
      console.error('❌ Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          state,
          zip: zipCode,
          propertyType: 'single_family',
          propertyValue: parseFloat(propertyValue),
          serviceInterest,
          leadSource: 'admin',
          tier: 1,
          leadScore: 50,
          notes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create lead');
      }

      toast.success('Lead created successfully!');
      setShowCreateModal(false);
      resetForm();
      await fetchLeads();
    } catch (error: any) {
      console.error('❌ Error creating lead:', error);
      toast.error(error.message || 'Failed to create lead');
    } finally {
      setCreating(false);
    }
  };

  const handleMatchProvider = async (leadId: string) => {
    setMatching(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/match`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to match provider');
      }

      toast.success(data.message || 'Provider matched successfully!');
      await fetchLeads(); // ✅ Refresh the list
    } catch (error: any) {
      console.error('❌ Error matching provider:', error);
      toast.error(error.message || 'Failed to match provider');
    } finally {
      setMatching(null);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setPropertyValue('');
    setServiceInterest('landscaping');
    setNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'matched': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'accepted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'converted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 2: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 3: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Leads Management</h1>
            <p className="text-sm text-zinc-500 mt-2">{leads.length} total leads</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Lead
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">New Leads</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {leads.filter(l => l.status === 'new').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Star className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Matched</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {leads.filter(l => l.status === 'matched').length}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Active</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {leads.filter(l => l.status === 'accepted').length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Converted</p>
                  <p className="text-3xl font-bold text-green-400">
                    {leads.filter(l => l.status === 'converted').length}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <Card key={lead.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-zinc-100">
                      {lead.firstName} {lead.lastName}
                    </CardTitle>
                    <p className="text-sm text-zinc-400 capitalize mt-1">
                      {lead.serviceInterest?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/30">
                      <Star className="h-3 w-3 text-blue-400 fill-blue-400" />
                      <span className="text-xs font-medium text-blue-400">{lead.leadScore}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded border font-medium ${getTierBadge(lead.tier)}`}>
                      T{lead.tier}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{lead.city}, {lead.state} {lead.zip}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <DollarSign className="h-4 w-4 flex-shrink-0" />
                    <span>${lead.propertyValue?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-lg text-center border ${getStatusColor(lead.status)}`}>
                  <span className="text-xs font-semibold uppercase">{lead.status}</span>
                </div>

                {lead.assignedProvider ? (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-xs text-green-400 mb-1">Matched Provider</p>
                    <p className="text-sm font-semibold text-zinc-100">
                      {lead.assignedProvider.businessName}
                    </p>
                  </div>
                ) : lead.status === 'new' ? (
                  <Button
                    onClick={() => handleMatchProvider(lead.id)}
                    disabled={matching === lead.id}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                  >
                    {matching === lead.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Matching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Match Provider
                      </>
                    )}
                  </Button>
                ) : null}

                <Button
                  onClick={() => setSelectedLead(lead)}
                  variant="outline"
                  size="sm"
                  className="w-full border-zinc-700 hover:bg-zinc-800"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {leads.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">No leads found</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Lead
            </Button>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-zinc-100">Create New Lead</h2>
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(312) 555-0100"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Chicago"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="IL"
                    maxLength={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="60601"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Property Value *
                  </label>
                  <input
                    type="number"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="450000"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Service Interest *
                  </label>
                  <select
                    value={serviceInterest}
                    onChange={(e) => setServiceInterest(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="landscaping">Landscaping</option>
                    <option value="lawn_care">Lawn Care</option>
                    <option value="hardscaping">Hardscaping</option>
                    <option value="remodeling">Remodeling</option>
                    <option value="roofing">Roofing</option>
                    <option value="fencing">Fencing</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Any additional information about the lead..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="flex-1 border-zinc-700"
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Lead'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">
                  {selectedLead.firstName} {selectedLead.lastName}
                </h2>
                <p className="text-sm text-zinc-400 capitalize mt-1">
                  {selectedLead.serviceInterest?.replace('_', ' ')}
                </p>
              </div>
              <Button
                onClick={() => setSelectedLead(null)}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
              {/* Status and Score */}
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg border ${getStatusColor(selectedLead.status)}`}>
                  <span className="text-sm font-semibold uppercase">{selectedLead.status}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <Star className="h-4 w-4 text-blue-400 fill-blue-400" />
                  <span className="text-sm font-semibold text-blue-400">Score: {selectedLead.leadScore}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border ${getTierBadge(selectedLead.tier)}`}>
                  <span className="text-sm font-semibold">Tier {selectedLead.tier}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Email</p>
                  <a href={`mailto:${selectedLead.email}`} className="text-zinc-100 hover:text-blue-400 transition-colors">
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Phone</p>
                  <a href={`tel:${selectedLead.phone}`} className="text-zinc-100 hover:text-blue-400 transition-colors">
                    {selectedLead.phone}
                  </a>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-zinc-500 mb-1">Address</p>
                  <p className="text-zinc-100">
                    {selectedLead.address || 'N/A'}<br />
                    {selectedLead.city}, {selectedLead.state} {selectedLead.zip}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Property Value</p>
                  <p className="text-zinc-100 text-lg font-semibold">
                    ${selectedLead.propertyValue?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Created</p>
                  <p className="text-zinc-100">
                    {new Date(selectedLead.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Assigned Provider */}
              {selectedLead.assignedProvider && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400 font-medium mb-3">Assigned Provider</p>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-zinc-100">
                      {selectedLead.assignedProvider.businessName}
                    </p>
                    <p className="text-sm text-zinc-300">
                      {selectedLead.assignedProvider.ownerName}
                    </p>
                    <div className="flex gap-4 mt-3">
                      
                        href={`mailto:${selectedLead.assignedProvider.email}`}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </a>
                      
                        href={`tel:${selectedLead.assignedProvider.phone}`}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <p className="text-sm text-zinc-500 mb-2 font-medium">Notes</p>
                  <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <p className="text-zinc-100 text-sm">{selectedLead.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}