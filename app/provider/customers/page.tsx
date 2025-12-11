'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { Search, Plus, Phone, Mail, MapPin, Star, MessageCircle, Users, TrendingUp, Award, Briefcase, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import AddCustomerModal from '@/components/provider/AddCustomerModal';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string;
  source: string;
  tags: string[];
  createdAt: string;
  jobCount: number;
  totalSpent: number;
  averageJobValue: number;
  lastJobDate: string | null;
  lastJobService: string | null;
  isActiveThisMonth: boolean;
}

export default function ProviderCustomers() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortType, setSortType] = useState('since');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      setLoading(true);
      const res = await fetch(`/api/provider/customers?providerId=${id}&sort=${sortType}`);
      const data = await res.json();

      if (data.customers) {
        setCustomers(data.customers);
        applyFilters(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (customerList: Customer[]) => {
    let filtered = [...customerList];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    if (filterType === 'Premium') {
      filtered = filtered.filter(c => c.tags.includes('Premium'));
    } else if (filterType === 'HOA') {
      filtered = filtered.filter(c => c.tags.includes('HOA'));
    } else if (filterType === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(c => new Date(c.createdAt) > thirtyDaysAgo);
    }

    setFilteredCustomers(filtered);
  };

  useEffect(() => {
    applyFilters(customers);
  }, [searchQuery, filterType]);

  useEffect(() => {
    if (providerId) {
      fetchCustomers(providerId);
    }
  }, [sortType]);

  const handleDeleteClick = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/provider/customers/${customerToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.reason || data.error || 'Failed to delete customer');
      }

      toast.success('Customer deleted successfully');
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      applyFilters(customers.filter(c => c.id !== customerToDelete.id));
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  // Calculate stats
  const totalCustomers = customers.length;
  const activeThisMonth = customers.filter(c => c.isActiveThisMonth).length;
  const averageJobValue = customers.length > 0
    ? customers.reduce((sum, c) => sum + c.averageJobValue, 0) / customers.length
    : 0;
  const topCustomer = customers.length > 0
    ? customers.reduce((prev, current) => (prev.totalSpent > current.totalSpent) ? prev : current)
    : null;

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
          <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
            <div className="flex items-start justify-between mb-3 md:mb-6">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-zinc-100">Customers</h1>
                <p className="text-xs md:text-sm text-zinc-400 mt-0.5 md:mt-1">Manage your client relationships</p>
              </div>
              <Button
                onClick={() => setShowAddCustomerModal(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm h-9 md:h-10"
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">Add Customer</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-zinc-100">{totalCustomers}</p>
                    <p className="text-xs text-zinc-500 hidden md:block">Total Customers</p>
                    <p className="text-xs text-zinc-500 md:hidden">Total</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-zinc-100">{activeThisMonth}</p>
                    <p className="text-xs text-zinc-500 hidden md:block">Active This Month</p>
                    <p className="text-xs text-zinc-500 md:hidden">Active</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                    <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-zinc-100">${Math.round(averageJobValue)}</p>
                    <p className="text-xs text-zinc-500 hidden md:block">Avg Job Value</p>
                    <p className="text-xs text-zinc-500 md:hidden">Avg Value</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                    <Award className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base font-bold text-zinc-100 truncate">
                      {topCustomer ? topCustomer.name : 'N/A'}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      <span className="hidden md:inline">Top Customer</span>
                      <span className="md:hidden">Top</span>
                      {topCustomer ? ` - $${Math.round(topCustomer.totalSpent)}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs md:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Filter Dropdown */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 md:px-4 py-2 md:py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs md:text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="all">All Customers</option>
                <option value="Premium">Premium Clients</option>
                <option value="HOA">HOA Properties</option>
                <option value="new">New (&lt; 30 days)</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className="px-3 md:px-4 py-2 md:py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs md:text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="since">Customer Since</option>
                <option value="name">Name (A-Z)</option>
                <option value="spent">Total Spent (High-Low)</option>
                <option value="recent">Recent Jobs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">
                {customers.length === 0 ? 'No customers yet' : 'No customers match your filters'}
              </h3>
              <p className="text-zinc-500 mb-6">
                {customers.length === 0
                  ? 'Add your first customer to start tracking jobs and building relationships'
                  : 'Try adjusting your search or filters'}
              </p>
              {customers.length === 0 && (
                <Button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {filteredCustomers.map(customer => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onViewDetails={() => router.push(`/provider/customers/${customer.id}`)}
                  onDelete={handleDeleteClick}
                  providerId={providerId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        providerId={providerId}
        onCustomerAdded={() => {
          setShowAddCustomerModal(false);
          fetchCustomers(providerId);
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-md mx-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6">
              {/* Warning Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-zinc-100 text-center mb-2">
                Delete Customer?
              </h2>

              {/* Customer Name */}
              <p className="text-center text-zinc-400 mb-4">
                Are you sure you want to delete <span className="font-semibold text-zinc-200">{customerToDelete.name}</span>?
              </p>

              {/* Warning Message */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-400">
                  This will permanently delete this customer and all related data including:
                </p>
                <ul className="text-sm text-red-400 mt-2 space-y-1 ml-4 list-disc">
                  <li>All completed jobs and photos</li>
                  <li>All paid invoices and payments</li>
                  <li>All messages and notes</li>
                  <li>Loyalty points and history</li>
                </ul>
              </div>

              {/* Info Message */}
              {(customerToDelete.jobCount > 0 || customerToDelete.totalSpent > 0) && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-400">
                    <strong>Note:</strong> This customer has {customerToDelete.jobCount} job(s) and ${Math.round(customerToDelete.totalSpent)} in revenue.
                  </p>
                  <p className="text-xs text-yellow-400 mt-1">
                    You can only delete if all jobs are completed and all invoices are paid.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Customer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}

// Customer Card Component
function CustomerCard({ customer, onViewDetails, onDelete, providerId }: {
  customer: Customer;
  onViewDetails: () => void;
  onDelete: (customer: Customer, e: React.MouseEvent) => void;
  providerId: string;
}) {
  return (
    <div
      onClick={onViewDetails}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-5 hover:bg-zinc-900/70 transition-all cursor-pointer hover:border-emerald-500/50 relative group"
    >
      {/* Delete Button - Shows on hover */}
      <button
        onClick={(e) => onDelete(customer, e)}
        className="absolute top-3 right-3 p-2 bg-red-600/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Delete customer"
      >
        <Trash2 className="h-4 w-4 text-white" />
      </button>

      {/* Header with avatar */}
      <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-lg md:text-xl font-bold flex-shrink-0">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-1 truncate">{customer.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <span className={`px-1.5 md:px-2 py-0.5 text-xs font-medium rounded-full ${
              customer.source === 'renoa'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
            }`}>
              {customer.source === 'renoa' ? 'Renoa Lead' : 'Own Client'}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-zinc-400">
          <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
          <span className="truncate">{customer.phone}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-zinc-400">
            <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-zinc-400">
          <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
          <span className="truncate">{customer.address || 'No address'}</span>
        </div>
      </div>

      {/* Stats - Inline on mobile */}
      <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-zinc-800 text-xs md:text-sm">
        <div>
          <p className="text-lg md:text-xl font-bold text-zinc-100">{customer.jobCount}</p>
          <p className="text-xs text-zinc-500">Jobs</p>
        </div>
        <div>
          <p className="text-lg md:text-xl font-bold text-emerald-400">
            ${Math.round(customer.totalSpent)}
          </p>
          <p className="text-xs text-zinc-500"><span className="hidden md:inline">Total </span>Spent</p>
        </div>
        {customer.lastJobDate && (
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">Last Job</p>
            <p className="text-xs md:text-sm text-zinc-300">
              {new Date(customer.lastJobDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>

      {/* Tags */}
      {customer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {customer.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-medium bg-zinc-800/50 text-zinc-300 rounded border border-zinc-700"
            >
              {tag}
            </span>
          ))}
          {customer.tags.length > 3 && (
            <span className="px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-medium text-zinc-500">
              +{customer.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
