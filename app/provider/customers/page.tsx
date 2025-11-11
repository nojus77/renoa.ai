'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { Search, Plus, Phone, Mail, MapPin, Briefcase, Star, MessageCircle, Calendar, Users, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  source: 'renoa' | 'own';
  totalJobs: number;
  lifetimeValue: number;
  lastJobDate?: string;
  lastJobService?: string;
  tags: string[];
  rating?: number;
  isActive: boolean;
  createdAt: string;
}

export default function ProviderCustomers() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'renoa' | 'own'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchCustomers(id);
  }, [router]);

  const fetchCustomers = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/customers?providerId=${id}`);
      const data = await res.json();

      if (data.customers) {
        setCustomers(data.customers);
        setFilteredCustomers(data.customers);
      }
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = customers;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(customer => customer.source === sourceFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer =>
        statusFilter === 'active' ? customer.isActive : !customer.isActive
      );
    }

    setFilteredCustomers(filtered);
  }, [searchQuery, sourceFilter, statusFilter, customers]);

  // Calculate stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.isActive).length,
    renoa: customers.filter(c => c.source === 'renoa').length,
    own: customers.filter(c => c.source === 'own').length,
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
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-6 py-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-zinc-100">Customers</h1>
                <p className="text-sm text-zinc-400 mt-1">Manage your client relationships</p>
              </div>
              <Button
                onClick={() => setShowAddCustomerModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-100">{stats.total}</p>
                    <p className="text-xs text-zinc-500">Total Customers</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-100">{stats.active}</p>
                    <p className="text-xs text-zinc-500">Active This Month</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Award className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-100">{stats.renoa}</p>
                    <p className="text-xs text-zinc-500">Renoa Leads</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Briefcase className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-100">{stats.own}</p>
                    <p className="text-xs text-zinc-500">Own Clients</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, email, or address..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="all">All Sources</option>
                <option value="renoa">Renoa Leads</option>
                <option value="own">Own Clients</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400">
                {searchQuery || sourceFilter !== 'all' || statusFilter !== 'all'
                  ? 'No customers match your filters'
                  : 'No customers yet. Add your first customer to get started!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCustomers.map(customer => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onViewDetails={() => setSelectedCustomer(customer)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal - placeholder for now */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Add Customer</h2>
            <p className="text-sm text-zinc-400 mb-4">This feature is coming soon!</p>
            <Button
              onClick={() => setShowAddCustomerModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}

// Customer Card Component
function CustomerCard({ customer, onViewDetails }: { customer: Customer; onViewDetails: () => void }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:bg-zinc-900/70 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-zinc-100">{customer.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              customer.source === 'renoa'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
            }`}>
              {customer.source === 'renoa' ? 'Renoa' : 'Own Client'}
            </span>
            {!customer.isActive && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-700/50 text-zinc-500 border border-zinc-600">
                Inactive
              </span>
            )}
          </div>
          {customer.rating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < customer.rating!
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-zinc-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Phone className="h-4 w-4" />
          <a href={`tel:${customer.phone}`} className="hover:text-emerald-400 transition-colors">
            {customer.phone}
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Mail className="h-4 w-4" />
          <a href={`mailto:${customer.email}`} className="hover:text-emerald-400 transition-colors truncate">
            {customer.email}
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{customer.address}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-zinc-800">
        <div>
          <p className="text-lg font-semibold text-zinc-100">{customer.totalJobs}</p>
          <p className="text-xs text-zinc-500">Total Jobs</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-emerald-400">
            ${customer.lifetimeValue.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">Lifetime Value</p>
        </div>
      </div>

      {/* Last Job */}
      {customer.lastJobDate && (
        <div className="mb-4 p-3 bg-zinc-800/30 rounded-lg">
          <p className="text-xs text-zinc-500 mb-1">Last Job</p>
          <p className="text-sm text-zinc-300">
            {customer.lastJobService} on {new Date(customer.lastJobDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      )}

      {/* Tags */}
      {customer.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {customer.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `tel:${customer.phone}`;
          }}
          size="sm"
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          <Phone className="h-4 w-4 mr-1" />
          Call
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `sms:${customer.phone}`;
          }}
          size="sm"
          variant="outline"
          className="flex-1 border-zinc-700 hover:bg-zinc-800"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Message
        </Button>
        <Button
          onClick={onViewDetails}
          size="sm"
          variant="outline"
          className="flex-1 border-zinc-700 hover:bg-zinc-800"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
