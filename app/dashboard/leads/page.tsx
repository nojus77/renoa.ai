"use client"

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Download,
  Plus,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  X,
  Edit,
  Save,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

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
  propertyType: string;
  propertyValue: number | null;
  squareFootage: number | null;
  serviceInterest: string;
  leadSource: string;
  leadScore: number;
  tier: number;
  status: string;
  campaign: string | null;
  contactCount: number;
  urgencyScore: number | null;
  propertyScore: number | null;
  financialScore: number | null;
  demographicScore: number | null;
  marketScore: number | null;
  notes: string | null;
  assignedProviderId: string | null;
  createdAt: string;
  updatedAt: string;
}

// VALID SERVICE OPTIONS FROM YOUR PRISMA SCHEMA
const SERVICE_OPTIONS = [
  { value: "landscaping", label: "Landscaping" },
  { value: "remodeling", label: "Remodeling" },
  { value: "roofing", label: "Roofing" },
  { value: "fencing", label: "Fencing" },
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "painting", label: "Painting" },
  { value: "flooring", label: "Flooring" },
];

const TierBadge = ({ tier }: { tier: number }) => {
  const colors = {
    1: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    2: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    3: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };
  return (
    <Badge className={`${colors[tier as keyof typeof colors]} border font-semibold`}>
      T{tier}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    new: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    converted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    lost: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };
  return (
    <Badge className={`${colors[status] || colors.new} border capitalize`}>
      {status}
    </Badge>
  );
};

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
}) => (
  <Card className="bg-zinc-900/50 border-zinc-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-zinc-100">{value}</div>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
      {trend && (
        <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [tierFilters, setTierFilters] = useState<number[]>([]);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [matching, setMatching] = useState(false);
  
  const [newLeadForm, setNewLeadForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'IL',
    zip: '',
    propertyValue: '',
    serviceInterest: 'landscaping',
    notes: '',
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads?limit=1000");
      const data = await res.json();
      if (data.leads && Array.isArray(data.leads)) {
        setLeads(data.leads);
      }
    } catch (err) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async () => {
    if (!newLeadForm.firstName || !newLeadForm.lastName || !newLeadForm.email || !newLeadForm.phone || !newLeadForm.city || !newLeadForm.zip) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...newLeadForm,
        propertyValue: newLeadForm.propertyValue ? parseFloat(newLeadForm.propertyValue) : null,
        leadScore: 50,
        tier: 2,
        status: 'new',
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create lead');
      }

      toast.success('Lead created successfully!');
      setNewLeadOpen(false);
      setNewLeadForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: 'IL',
        zip: '',
        propertyValue: '',
        serviceInterest: 'landscaping',
        notes: '',
      });
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    setSubmitting(true);
    try {
      const payload = {
        ...editForm,
        propertyValue: editForm.propertyValue ? parseFloat(String(editForm.propertyValue)) : null,
      };

      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update lead');
      }

      toast.success('Lead updated successfully!');
      setEditMode(false);
      fetchLeads();
      
      const updatedLead = await res.json();
      setSelectedLead(updatedLead);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIMatch = async () => {
    if (!selectedLead) return;

    setMatching(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/match`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to match lead');
      }
      
      toast.success(`✨ Matched with ${data.provider.name}! Score: ${data.provider.matchScore}/100`);
      fetchLeads();
      
      // Update selected lead
      const updatedLead = { ...selectedLead, assignedProviderId: data.provider.id, status: 'contacted' };
      setSelectedLead(updatedLead);
    } catch (error: any) {
      toast.error(error.message || 'No matching providers found');
    } finally {
      setMatching(false);
    }
  };

  const totals = useMemo(() => ({
    total: leads.length,
    highPriority: leads.filter(l => l.leadScore >= 70).length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    totalValue: leads.reduce((sum, l) => sum + (l.propertyValue || 0), 0),
  }), [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads;

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(l =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query) ||
        l.serviceInterest.toLowerCase().includes(query) ||
        l.city.toLowerCase().includes(query) ||
        l.phone.includes(query)
      );
    }

    if (statusFilters.length > 0) {
      result = result.filter(l => statusFilters.includes(l.status));
    }

    if (tierFilters.length > 0) {
      result = result.filter(l => tierFilters.includes(l.tier));
    }

    return result;
  }, [leads, searchQuery, statusFilters, tierFilters]);

  const highPriorityLeads = useMemo(() =>
    leads.filter(l => l.leadScore >= 70).sort((a, b) => b.leadScore - a.leadScore),
    [leads]
  );

  const recentLeads = useMemo(() =>
    [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20),
    [leads]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const LeadRow = ({ lead }: { lead: Lead }) => (
    <TableRow
      className="border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors"
      onClick={() => {
        setSelectedLead(lead);
        setEditForm(lead);
        setEditMode(false);
        setDetailOpen(true);
      }}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800">
            <span className="text-sm font-semibold text-zinc-100">
              {lead.leadScore}
            </span>
          </div>
          <TierBadge tier={lead.tier} />
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium text-zinc-100">{lead.firstName} {lead.lastName}</div>
          <div className="text-xs text-zinc-400 mt-1">{lead.email}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-zinc-300">
          <Phone className="h-3 w-3" />
          <span className="text-sm">{lead.phone}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-zinc-300">
          <MapPin className="h-3 w-3" />
          <span className="text-sm">{lead.city}, {lead.state}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 capitalize">
          {lead.serviceInterest.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell>
        <StatusBadge status={lead.status} />
      </TableCell>
      <TableCell className="text-zinc-300 text-sm">
        {lead.campaign || 'N/A'}
      </TableCell>
      <TableCell className="text-zinc-100 font-medium">
        {lead.propertyValue ? formatCurrency(Number(lead.propertyValue)) : 'N/A'}
      </TableCell>
      <TableCell className="text-zinc-400 text-sm">
        {formatDate(lead.createdAt)}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Leads</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage and track all your leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={() => setNewLeadOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          title="Total Leads"
          value={totals.total}
          subtitle="+16 this week"
          trend="+8% from last week"
          icon={<User className="h-4 w-4 text-zinc-400" />}
        />
        <MetricCard
          title="High Priority"
          value={totals.highPriority}
          subtitle="Score 70+"
          icon={<Star className="h-4 w-4 text-amber-400" />}
        />
        <MetricCard
          title="Contacted"
          value={totals.contacted}
          subtitle="Awaiting response"
          icon={<Mail className="h-4 w-4 text-sky-400" />}
        />
        <MetricCard
          title="Converted"
          value={totals.converted}
          subtitle="Successful closes"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        />
        <MetricCard
          title="Est. Value"
          value={formatCurrency(Number(totals.totalValue))}
          subtitle="Pipeline value"
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-zinc-900/30 border border-zinc-800">
          <TabsTrigger value="all">All Leads</TabsTrigger>
          <TabsTrigger value="high-priority">High Priority</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="converted">Converted</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-100">All Leads ({filteredLeads.length})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="text-xs text-zinc-400 flex items-center mr-2">
                    Status:
                  </div>

                  <Button
                    size="sm"
                    variant={statusFilters.includes('new') ? "default" : "outline"}
                    className={statusFilters.includes('new') ? "bg-sky-600" : "border-zinc-700"}
                    onClick={() => {
                      if (statusFilters.includes('new')) {
                        setStatusFilters(statusFilters.filter(s => s !== 'new'));
                      } else {
                        setStatusFilters([...statusFilters, 'new']);
                      }
                    }}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    New ({leads.filter(l => l.status === 'new').length})
                  </Button>

                  <Button
                    size="sm"
                    variant={statusFilters.includes('contacted') ? "default" : "outline"}
                    className={statusFilters.includes('contacted') ? "bg-amber-600" : "border-zinc-700"}
                    onClick={() => {
                      if (statusFilters.includes('contacted')) {
                        setStatusFilters(statusFilters.filter(s => s !== 'contacted'));
                      } else {
                        setStatusFilters([...statusFilters, 'contacted']);
                      }
                    }}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Contacted ({leads.filter(l => l.status === 'contacted').length})
                  </Button>

                  <Button
                    size="sm"
                    variant={statusFilters.includes('qualified') ? "default" : "outline"}
                    className={statusFilters.includes('qualified') ? "bg-emerald-600" : "border-zinc-700"}
                    onClick={() => {
                      if (statusFilters.includes('qualified')) {
                        setStatusFilters(statusFilters.filter(s => s !== 'qualified'));
                      } else {
                        setStatusFilters([...statusFilters, 'qualified']);
                      }
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Qualified ({leads.filter(l => l.status === 'qualified').length})
                  </Button>

                  <Button
                    size="sm"
                    variant={statusFilters.includes('converted') ? "default" : "outline"}
                    className={statusFilters.includes('converted') ? "bg-purple-600" : "border-zinc-700"}
                    onClick={() => {
                      if (statusFilters.includes('converted')) {
                        setStatusFilters(statusFilters.filter(s => s !== 'converted'));
                      } else {
                        setStatusFilters([...statusFilters, 'converted']);
                      }
                    }}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Converted ({leads.filter(l => l.status === 'converted').length})
                  </Button>

                  <div className="border-l border-zinc-700 h-8 mx-2" />

                  <div className="text-xs text-zinc-400 flex items-center mr-2">
                    Tier:
                  </div>

                  <Button
                    size="sm"
                    variant={tierFilters.includes(1) ? "default" : "outline"}
                    className={tierFilters.includes(1) ? "bg-emerald-600" : "border-zinc-700"}
                    onClick={() => {
                      if (tierFilters.includes(1)) {
                        setTierFilters(tierFilters.filter(t => t !== 1));
                      } else {
                        setTierFilters([...tierFilters, 1]);
                      }
                    }}
                  >
                    T1 ({leads.filter(l => l.tier === 1).length})
                  </Button>

                  <Button
                    size="sm"
                    variant={tierFilters.includes(2) ? "default" : "outline"}
                    className={tierFilters.includes(2) ? "bg-sky-600" : "border-zinc-700"}
                    onClick={() => {
                      if (tierFilters.includes(2)) {
                        setTierFilters(tierFilters.filter(t => t !== 2));
                      } else {
                        setTierFilters([...tierFilters, 2]);
                      }
                    }}
                  >
                    T2 ({leads.filter(l => l.tier === 2).length})
                  </Button>

                  <Button
                    size="sm"
                    variant={tierFilters.includes(3) ? "default" : "outline"}
                    className={tierFilters.includes(3) ? "bg-zinc-600" : "border-zinc-700"}
                    onClick={() => {
                      if (tierFilters.includes(3)) {
                        setTierFilters(tierFilters.filter(t => t !== 3));
                      } else {
                        setTierFilters([...tierFilters, 3]);
                      }
                    }}
                  >
                    T3 ({leads.filter(l => l.tier === 3).length})
                  </Button>

                  {(statusFilters.length > 0 || tierFilters.length > 0) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-zinc-400"
                      onClick={() => {
                        setStatusFilters([]);
                        setTierFilters([]);
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All ({statusFilters.length + tierFilters.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Score</TableHead>
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Phone</TableHead>
                    <TableHead className="text-zinc-400">Location</TableHead>
                    <TableHead className="text-zinc-400">Service</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Campaign</TableHead>
                    <TableHead className="text-zinc-400">Value</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-zinc-400">
                        Loading leads...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-zinc-400">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-priority" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />
                High Priority Leads ({highPriorityLeads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Score</TableHead>
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Phone</TableHead>
                    <TableHead className="text-zinc-400">Location</TableHead>
                    <TableHead className="text-zinc-400">Service</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Campaign</TableHead>
                    <TableHead className="text-zinc-400">Value</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highPriorityLeads.map((lead) => <LeadRow key={lead.id} lead={lead} />)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-400" />
                Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Score</TableHead>
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Phone</TableHead>
                    <TableHead className="text-zinc-400">Location</TableHead>
                    <TableHead className="text-zinc-400">Service</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Campaign</TableHead>
                    <TableHead className="text-zinc-400">Value</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((lead) => <LeadRow key={lead.id} lead={lead} />)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="converted" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Converted Leads ({leads.filter(l => l.status === 'converted').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Score</TableHead>
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Phone</TableHead>
                    <TableHead className="text-zinc-400">Location</TableHead>
                    <TableHead className="text-zinc-400">Service</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Campaign</TableHead>
                    <TableHead className="text-zinc-400">Value</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.filter(l => l.status === 'converted').map((lead) => <LeadRow key={lead.id} lead={lead} />)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Detail Slideout with EDIT MODE */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-zinc-950 text-zinc-200 border-l border-zinc-800 overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <SheetTitle className="text-2xl font-bold text-zinc-100">
                      {editMode ? (
                        <div className="flex gap-2">
                          <Input
                            value={editForm.firstName || ''}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="bg-zinc-900 border-zinc-800"
                          />
                          <Input
                            value={editForm.lastName || ''}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                      ) : (
                        `${selectedLead.firstName} ${selectedLead.lastName}`
                      )}
                    </SheetTitle>
                    <SheetDescription className="text-zinc-400 mt-1">
                      {selectedLead.serviceInterest.replace('_', ' ')} • Score: {selectedLead.leadScore}
                    </SheetDescription>
                  </div>
                  <div className="flex gap-2">
                    <TierBadge tier={selectedLead.tier} />
                    <StatusBadge status={selectedLead.status} />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {!editMode ? (
                    <>
                      <a href={`mailto:${selectedLead.email}`}>
                        <Button size="sm" variant="outline" className="border-zinc-700">
                          <Mail className="h-4 w-4 mr-2" />Email
                        </Button>
                      </a>
                      <a href={`tel:${selectedLead.phone}`}>
                        <Button size="sm" variant="outline" className="border-zinc-700">
                          <Phone className="h-4 w-4 mr-2" />Call
                        </Button>
                      </a>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-zinc-700"
                        onClick={() => setEditMode(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />Edit
                      </Button>
                      
                      {!selectedLead.assignedProviderId ? (
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-500"
                          onClick={handleAIMatch}
                          disabled={matching}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {matching ? 'Matching...' : 'AI Match Provider'}
                        </Button>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border px-3 py-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Assigned to Provider
                        </Badge>
                      )}
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-zinc-700"
                        onClick={() => {
                          setEditMode(false);
                          setEditForm(selectedLead);
                        }}
                        disabled={submitting}
                      >
                        <X className="h-4 w-4 mr-2" />Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-500"
                        onClick={handleUpdateLead}
                        disabled={submitting}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-6 py-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-zinc-400">Email</p>
                        {editMode ? (
                          <Input
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="bg-zinc-900 border-zinc-800 mt-1"
                          />
                        ) : (
                          <p className="text-zinc-200">{selectedLead.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-zinc-400">Phone</p>
                        {editMode ? (
                          <Input
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="bg-zinc-900 border-zinc-800 mt-1"
                          />
                        ) : (
                          <p className="text-zinc-200">{selectedLead.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-zinc-400">Location</p>
                        {editMode ? (
                          <div className="space-y-2 mt-1">
                            <Input
                              placeholder="Address"
                              value={editForm.address || ''}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              className="bg-zinc-900 border-zinc-800"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                placeholder="City"
                                value={editForm.city || ''}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                              />
                              <Input
                                placeholder="State"
                                value={editForm.state || ''}
                                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                                maxLength={2}
                              />
                              <Input
                                placeholder="ZIP"
                                value={editForm.zip || ''}
                                onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-zinc-200">{selectedLead.city}, {selectedLead.state} {selectedLead.zip}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-zinc-400">Service</p>
                        {editMode ? (
                          <Select
                            value={editForm.serviceInterest || selectedLead.serviceInterest}
                            onValueChange={(value) => setEditForm({ ...editForm, serviceInterest: value })}
                          >
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent 
                              className="bg-zinc-900 border-zinc-800 text-zinc-100 z-[9999]"
                              position="popper"
                              sideOffset={5}
                            >
                              {SERVICE_OPTIONS.map(option => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                  className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer hover:bg-zinc-800"
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 mt-1 capitalize">
                            {selectedLead.serviceInterest.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Lead Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Lead Score</span>
                      <span className="text-zinc-100 font-semibold text-lg">{selectedLead.leadScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Tier</span>
                      <TierBadge tier={selectedLead.tier} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Property Value</span>
                      {editMode ? (
                        <Input
                          type="number"
                          value={editForm.propertyValue?.toString() || ''}
                          onChange={(e) => setEditForm({ ...editForm, propertyValue: e.target.value ? Number(e.target.value) : null })}
                          className="bg-zinc-900 border-zinc-800 w-32"
                          placeholder="450000"
                        />
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          {selectedLead.propertyValue ? formatCurrency(Number(selectedLead.propertyValue)) : 'N/A'}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Campaign</span>
                      <span className="text-zinc-200">{selectedLead.campaign || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Date Created</span>
                      <span className="text-zinc-200">{formatDate(selectedLead.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <Textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                        placeholder="Additional information about the lead..."
                      />
                    ) : (
                      <p className="text-zinc-300 text-sm">{selectedLead.notes || 'No notes'}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Lead Dialog */}
      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create a new lead for your sales pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-zinc-200">First Name *</Label>
                <Input
                  id="firstName"
                  value={newLeadForm.firstName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, firstName: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-zinc-200">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newLeadForm.lastName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, lastName: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-200">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-200">Phone *</Label>
                <Input
                  id="phone"
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="(312) 555-0100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-zinc-200">Address</Label>
              <Input
                id="address"
                value={newLeadForm.address}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, address: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-zinc-200">City *</Label>
                <Input
                  id="city"
                  value={newLeadForm.city}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="Chicago"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-zinc-200">State</Label>
                <Input
                  id="state"
                  value={newLeadForm.state}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, state: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="IL"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip" className="text-zinc-200">ZIP *</Label>
                <Input
                  id="zip"
                  value={newLeadForm.zip}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, zip: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="60614"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceInterest" className="text-zinc-200">Service Interest *</Label>
                <Select
                  value={newLeadForm.serviceInterest}
                  onValueChange={(value) => setNewLeadForm({ ...newLeadForm, serviceInterest: value })}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue placeholder="Select service..." />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-zinc-900 border-zinc-800 text-zinc-100 z-[9999]"
                    position="popper"
                    sideOffset={5}
                  >
                    {SERVICE_OPTIONS.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer hover:bg-zinc-800"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyValue" className="text-zinc-200">Property Value</Label>
                <Input
                  id="propertyValue"
                  type="number"
                  value={newLeadForm.propertyValue}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, propertyValue: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="450000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-zinc-200">Notes</Label>
              <Textarea
                id="notes"
                value={newLeadForm.notes}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                placeholder="Additional information about the lead..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setNewLeadOpen(false)}
              className="border-zinc-700"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLead}
              className="bg-emerald-600 hover:bg-emerald-500"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}