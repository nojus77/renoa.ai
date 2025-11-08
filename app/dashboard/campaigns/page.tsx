"use client"

import React, { useState, useEffect } from 'react';
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
  MoreHorizontal,
  Play,
  Pause,
  Mail,
  Users,
  TrendingUp,
  Send,
  Eye,
  MousePointerClick,
  Plus,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Copy,
  Edit,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  status: string;
  serviceType: string;
  totalLeads: number;
  leadsAssigned: number;
  sequence: number;
  createdAt: string;
  emailsSent?: number;
  opensCount?: number;
  clicksCount?: number;
  repliesCount?: number;
  openRate?: number;
  clickRate?: number;
  replyRate?: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    draft: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    paused: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    completed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <Badge className={`${colors[status] || colors.draft} border capitalize`}>
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const [newCampaignForm, setNewCampaignForm] = useState({
    name: '',
    serviceType: 'landscaping',
    totalLeads: '',
    sequence: '3',
    description: '',
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns?limit=100');
      const data = await res.json();
      
      console.log('📦 Campaigns data:', data);
      
      if (data.campaigns && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
        console.log('✅ Set campaigns:', data.campaigns.length);
      } else {
        console.error('❌ Invalid campaigns data');
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async () => {
  if (!newCampaignForm.name) {
    toast.error('Please fill in campaign name');
    return;
  }

  const serviceMap: Record<string, string> = {
    'landscaping': 'Landscaping',
    'roofing': 'Roofing',
    'hvac': 'HVAC',
    'plumbing': 'Plumbing',
    'electrical': 'Electrical',
    'painting': 'Painting',
  };

  try {
  const res = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newCampaignForm.name,
      serviceType: newCampaignForm.serviceType,  // ← JUST USE IT DIRECTLY
      status: 'draft',
      targetAudience: {},
      sequenceType: 'custom',
    }),
  });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create campaign');
    }

    toast.success('Campaign created successfully!');
    setNewCampaignOpen(false);
    setNewCampaignForm({
      name: '',
      serviceType: 'landscaping',
      totalLeads: '',
      sequence: '3',
      description: '',
    });
    fetchCampaigns();
  } catch (error: any) {
    console.error('Create campaign error:', error);
    toast.error(error.message || 'Failed to create campaign');
  }
};

  const handleUpdateStatus = async (campaignId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update campaign status');
      }

      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Update status error:', error);
      toast.error(error.message || 'Failed to update campaign status');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete campaign');
      }

      toast.success('Campaign deleted successfully');
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Delete campaign error:', error);
      toast.error(error.message || 'Failed to delete campaign');
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesService = serviceFilter === 'all' || c.serviceType === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pausedCampaigns = campaigns.filter(c => c.status === 'paused').length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.emailsSent || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Campaigns</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create, monitor, and optimize email campaigns
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-500"
          onClick={() => setNewCampaignOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total"
          value={totalCampaigns}
          subtitle="All campaigns"
          icon={<Mail className="h-4 w-4 text-zinc-400" />}
        />
        <MetricCard
          title="Active"
          value={activeCampaigns}
          subtitle="Running now"
          icon={<Play className="h-4 w-4 text-emerald-400" />}
        />
        <MetricCard
          title="Paused"
          value={pausedCampaigns}
          subtitle="Temporarily stopped"
          icon={<Pause className="h-4 w-4 text-amber-400" />}
        />
        <MetricCard
          title="Sent today"
          value={totalSent}
          subtitle="Emails delivered"
          icon={<Send className="h-4 w-4 text-blue-400" />}
        />
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="bg-zinc-900/30 border border-zinc-800">
          <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-100">
                    All Campaigns ({filteredCampaigns.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-zinc-700">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters {(statusFilter !== 'all' || serviceFilter !== 'all') ? '2' : ''}
                    </Button>
                    <Button variant="outline" size="sm" className="border-zinc-700">
                      Bulk actions
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                  </select>

                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm"
                  >
                    <option value="all">All services</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="roofing">Roofing</option>
                    <option value="hvac">HVAC</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Service</TableHead>
                    <TableHead className="text-zinc-400">Leads</TableHead>
                    <TableHead className="text-zinc-400">Sequence</TableHead>
                    <TableHead className="text-zinc-400">Created</TableHead>
                    <TableHead className="text-zinc-400">Open / Click</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-zinc-400">
                        Loading campaigns...
                      </TableCell>
                    </TableRow>
                  ) : filteredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-zinc-400">
                        No campaigns found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                      <TableRow
                        key={campaign.id}
                        className="border-zinc-800 cursor-pointer hover:bg-zinc-800/50"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setDetailOpen(true);
                        }}
                      >
                        <TableCell>
                          <div className="font-medium text-zinc-100">{campaign.name}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 capitalize">
                            {campaign.serviceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-zinc-100">{campaign.leadsAssigned || 0}/{campaign.totalLeads}</div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full" 
                              style={{ width: `${campaign.totalLeads > 0 ? ((campaign.leadsAssigned || 0) / campaign.totalLeads) * 100 : 0}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">{campaign.sequence} steps</TableCell>
                        <TableCell className="text-zinc-300">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {(campaign.openRate || 0).toFixed(1)}% / {(campaign.clickRate || 0).toFixed(1)}%
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-zinc-400 hover:text-zinc-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Campaign Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">Email template library coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="bg-zinc-950 text-zinc-100 border-l border-zinc-800 w-full sm:max-w-xl overflow-y-auto">
          {selectedCampaign && (
            <>
              <SheetHeader>
                <SheetTitle className="text-zinc-100 text-2xl">{selectedCampaign.name}</SheetTitle>
                <SheetDescription className="text-zinc-400">
                  Campaign details and performance metrics
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="pt-4">
                      <div className="text-xs text-zinc-400 mb-1">Emails Sent</div>
                      <div className="text-2xl font-bold text-zinc-100">
                        {selectedCampaign.emailsSent || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="pt-4">
                      <div className="text-xs text-zinc-400 mb-1">Open Rate</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {(selectedCampaign.openRate || 0).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="pt-4">
                      <div className="text-xs text-zinc-400 mb-1">Click Rate</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {(selectedCampaign.clickRate || 0).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="pt-4">
                      <div className="text-xs text-zinc-400 mb-1">Reply Rate</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(selectedCampaign.replyRate || 0).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Campaign Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Status</span>
                      <StatusBadge status={selectedCampaign.status} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Service Type</span>
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 capitalize">
                        {selectedCampaign.serviceType}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Total Leads</span>
                      <span className="text-zinc-100 font-semibold">{selectedCampaign.totalLeads}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Leads Assigned</span>
                      <span className="text-zinc-100 font-semibold">{selectedCampaign.leadsAssigned || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Sequence Steps</span>
                      <span className="text-zinc-100 font-semibold">{selectedCampaign.sequence}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Created</span>
                      <span className="text-zinc-200">
                        {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  {selectedCampaign.status === 'active' ? (
                    <Button
                      className="flex-1 bg-amber-600 hover:bg-amber-500"
                      onClick={() => handleUpdateStatus(selectedCampaign.id, 'paused')}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Campaign
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => handleUpdateStatus(selectedCampaign.id, 'active')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Campaign
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-zinc-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-rose-700 text-rose-400 hover:bg-rose-900/20"
                    onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Campaign Dialog */}
      <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Set up a new email campaign for lead generation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-200">Campaign Name *</Label>
              <Input
                id="name"
                value={newCampaignForm.name}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, name: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
                placeholder="Move-in Concierge — Chicago"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType" className="text-zinc-200">Service Type</Label>
                <select
                  id="serviceType"
                  value={newCampaignForm.serviceType}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, serviceType: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100"
                >
                  <option value="Landscaping">Landscaping</option>
                  <option value="Roofing">Roofing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalLeads" className="text-zinc-200">Total Leads *</Label>
                <Input
                  id="totalLeads"
                  type="number"
                  value={newCampaignForm.totalLeads}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, totalLeads: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sequence" className="text-zinc-200">Email Sequence Steps</Label>
              <Input
                id="sequence"
                type="number"
                value={newCampaignForm.sequence}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, sequence: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
                placeholder="3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-200">Description</Label>
              <Textarea
                id="description"
                value={newCampaignForm.description}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, description: e.target.value })}
                className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                placeholder="Campaign description and notes..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setNewCampaignOpen(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}