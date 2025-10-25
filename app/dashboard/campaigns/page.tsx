"use client"

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
// Ensure shadcn/ui imports are present (redundant lines are for clarity and future-proofing)
import { MoreHorizontal, Play, Send, Pencil, Trash2, Filter, Plus, Search, Pause, Layers, Mail, X, Copy, Eye, UserPlus, Rocket, Settings2, BarChart3, Crown, Clock, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from "recharts";

const campaigns = [
  { id: 1, name: "Move-in Concierge — Chicago", status: "active", service: "Landscaping", sent: 480, total: 2000, open: 18.2, click: 4.1, replies: 32, steps: 3, created: "2025-10-15", leadsAssigned: 520, leadsTotal: 800, launched: true, hasLeads: true },
  { id: 2, name: "Roofing — Test Batch A", status: "scheduled", service: "Roofing", sent: 0, total: 1500, open: 0, click: 0, replies: 0, steps: 4, created: "2025-10-15", leadsAssigned: 0, leadsTotal: 500, launched: false, hasLeads: false },
  { id: 3, name: "HVAC — October Push", status: "draft", service: "HVAC", sent: 620, total: 1000, open: 21.5, click: 6.0, replies: 18, steps: 3, created: "2025-10-14", leadsAssigned: 300, leadsTotal: 600, launched: false, hasLeads: true },
  { id: 4, name: "Landscaping — Batch B", status: "paused", service: "Landscaping", sent: 400, total: 1000, open: 7.2, click: 1.0, replies: 5, steps: 3, created: "2025-10-13", leadsAssigned: 100, leadsTotal: 400, launched: true, hasLeads: true },
];

function makeSeries(days: number) {
  return Array.from({ length: days }).map((_, i) => ({
    label: days <= 30 ? i + 1 : `W${i + 1}`,
    sent: Math.max(0, 200 + Math.sin(i / 3) * 60 + i * 2),
    opens: Math.max(0, 80 + Math.cos(i / 4) * 30 + i),
    clicks: Math.max(0, 25 + Math.sin(i / 5) * 12),
  }));
}

const serviceBreakdown = [
  { name: "Landscaping", value: 42 },
  { name: "Roofing", value: 25 },
  { name: "HVAC", value: 18 },
  { name: "Plumbing", value: 15 },
];

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ef4444"];

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    active: "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30",
    scheduled: "bg-sky-500/25 text-sky-300 border border-sky-500/30",
    draft: "bg-zinc-500/25 text-zinc-200 border border-zinc-500/30",
    paused: "bg-amber-500/25 text-amber-300 border border-amber-500/30",
    completed: "bg-indigo-500/25 text-indigo-300 border border-indigo-500/30",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || map.draft}`}>{status}</span>;
};

const MetricCard: React.FC<{ title: string; value: string; sub?: string; icon?: React.ReactNode }> = ({ title, value, sub, icon }) => (
  <Card className="rounded-2xl shadow-sm border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm text-zinc-200 font-semibold flex items-center gap-2">{icon}{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">{value}</div>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

function ProgressBar({ value, color = "bg-emerald-500", height = "h-3" }: { value: number; color?: string; height?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full ${height} bg-zinc-800/80 rounded-md overflow-hidden border border-zinc-800`}>
      <div className={`${color} ${height} transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function FiltersPopover({ activeCount = 0 }: { activeCount?: number }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-zinc-800/60 border-zinc-700 text-zinc-200 hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer">
          <Filter className="h-4 w-4 mr-2"/>
          Filters
          {activeCount > 0 && <span className="ml-2 text-teal-300 text-xs font-semibold">{activeCount}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 bg-zinc-900 border border-zinc-800 text-zinc-200 p-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Status</p>
            <div className="grid grid-cols-2 gap-2">
              {['Active','Paused','Draft','Scheduled','Completed'].map(s => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <Checkbox id={`status-${s}`} /> {s}
                </label>
              ))}
            </div>
          </div>
          <Separator className="my-2"/>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Service Types</p>
            <div className="grid grid-cols-2 gap-2">
              {['Landscaping','Roofing','HVAC','Plumbing','Gutters','Windows'].map(s => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <Checkbox id={`svc-${s}`} /> {s}
                </label>
              ))}
            </div>
          </div>
          <Separator className="my-2"/>
          <div className="grid grid-cols-2 gap-2 items-center">
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Date Range</p>
              <Select defaultValue="30">
                <SelectTrigger className="bg-zinc-800/60 border-zinc-700">
                  <SelectValue placeholder="Last 30 days" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border border-zinc-800 text-zinc-100">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Sort By</p>
              <Select defaultValue="new">
                <SelectTrigger className="bg-zinc-800/60 border-zinc-700">
                  <SelectValue placeholder="Newest first" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border border-zinc-800 text-zinc-100">
                  <SelectItem value="new">Newest first</SelectItem>
                  <SelectItem value="old">Oldest first</SelectItem>
                  <SelectItem value="leads">Most leads</SelectItem>
                  <SelectItem value="perf">Best performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" className="text-zinc-300 cursor-pointer">Clear all</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer">Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const ActionsMenuRow: React.FC<{ c: any; onAction?: (a: string, c: any) => void }> = ({ c, onAction }) => {
  const noLeads = !c.hasLeads || (c.leadsAssigned ?? 0) === 0;
  const launched = !!c.launched;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Row actions" variant="ghost" size="icon" className="h-8 w-8 text-teal-300 hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer"><MoreHorizontal className="h-4 w-4"/></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border border-zinc-800 text-zinc-200">
        <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer" onClick={() => onAction?.('assign', c)}><UserPlus className="h-4 w-4 mr-2"/>Assign Leads</DropdownMenuItem>
        <DropdownMenuItem disabled={noLeads} className={`hover:bg-zinc-800 ${noLeads ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !noLeads && onAction?.('preview', c)}><Eye className="h-4 w-4 mr-2"/>Preview Email</DropdownMenuItem>
        <DropdownMenuItem disabled={noLeads || launched} className={`hover:bg-zinc-800 ${(noLeads || launched) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => (!noLeads && !launched) && onAction?.('launch', c)}><Rocket className="h-4 w-4 mr-2"/>Launch Campaign</DropdownMenuItem>
        <DropdownMenuItem disabled={!launched} className={`hover:bg-zinc-800 ${!launched ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => launched && onAction?.('send', c)}><Send className="h-4 w-4 mr-2"/>Send Campaign</DropdownMenuItem>
        <Separator className="my-1"/>
        <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer" onClick={() => onAction?.('edit', c)}><Pencil className="h-4 w-4 mr-2"/>Edit</DropdownMenuItem>
        <DropdownMenuItem className="text-rose-400 focus:text-rose-400 hover:bg-zinc-800 cursor-pointer" onClick={() => onAction?.('delete', c)}><Trash2 className="h-4 w-4 mr-2"/>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function CampaignDetail({ open, onOpenChange, data }: { open: boolean; onOpenChange: (v: boolean) => void; data: any | null }) {
  const [leadQuery, setLeadQuery] = useState("");
  if (!data) return null;

  const trend = [
    { label: 'Assigned', value: data.leadsAssigned, total: data.leadsTotal, color: 'bg-emerald-500' },
    { label: 'Emails Generated', value: Math.round(data.leadsAssigned * 0.95), total: data.leadsAssigned, color: 'bg-sky-500' },
    { label: 'Sent', value: data.sent, total: data.total, color: 'bg-purple-500' },
  ];

  const leads = useMemo(() => Array.from({ length: data.leadsAssigned || 0 }).map((_, i) => ({
    email: `lead${i + 1}@example.com`,
    status: 'Ready',
  })), [data.leadsAssigned]);

  const filteredLeads = leads.filter(l => l.email.toLowerCase().includes(leadQuery.toLowerCase()));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-zinc-950 text-zinc-200 border-l border-zinc-800 overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-10">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl font-bold flex items-center gap-2">{data.name} <StatusPill status={data.status}/></SheetTitle>
              <SheetDescription className="text-sm text-zinc-400">{data.service} • Created {new Date(data.created).toLocaleDateString()}</SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close details"><X className="h-5 w-5"/></Button>
            </SheetClose>
          </div>
          <div className="flex gap-2 pt-3">
            <Button className="bg-amber-600 hover:bg-amber-500 text-white transition-all duration-200 cursor-pointer"><Pause className="h-4 w-4 mr-2"/>Pause/Resume</Button>
            <Button className="bg-sky-600 hover:bg-sky-500 text-white transition-all duration-200 cursor-pointer"><Pencil className="h-4 w-4 mr-2"/>Edit</Button>
            <Button className="bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200 cursor-pointer"><Copy className="h-4 w-4 mr-2"/>Duplicate</Button>
            <Button className="bg-rose-600 hover:bg-rose-500 text-white transition-all duration-200 cursor-pointer"><Trash2 className="h-4 w-4 mr-2"/>Delete</Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="grid grid-cols-1 gap-4">
            {trend.map((m) => (
              <div key={m.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-200 font-semibold">{m.label}</span>
                  <span className="text-zinc-300">{m.value}/{m.total}</span>
                </div>
                <ProgressBar value={Math.round((m.value / Math.max(1, m.total)) * 100)} color={m.color} height="h-3"/>
              </div>
            ))}
          </div>

          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-200 font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4"/>Performance (30 days)</CardTitle></CardHeader>
            <CardContent className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={makeSeries(30)} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis dataKey="label" hide tickLine={false}/>
                  <YAxis hide/>
                  <RechartsTooltip cursor={{ stroke: "#333" }}/>
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={2} dot={false} name="Sent" />
                  <Line type="monotone" dataKey="opens" stroke="#06b6d4" strokeWidth={2} dot={false} name="Opens" />
                  <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Clicks" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div>
            <p className="text-sm uppercase tracking-wide text-zinc-500 mb-2">Timeline</p>
            <ul className="space-y-3">
              {[
                { t: 'Created', d: data.created },
                { t: 'Leads assigned', d: '2025-10-15' },
                { t: 'Launched', d: data.launched ? '2025-10-16' : '—' },
                { t: 'First email sent', d: data.sent > 0 ? '2025-10-16' : '—' },
              ].map((i) => (
                <li key={i.t} className="flex items-center gap-3 text-sm"><Clock className="h-4 w-4 text-zinc-500"/>{i.t}: <span className="text-zinc-300">{i.d}</span></li>
              ))}
            </ul>
          </div>

          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-200 font-semibold">Assigned Leads</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                <Input placeholder="Search leads…" value={leadQuery} onChange={(e) => setLeadQuery(e.target.value)} className="pl-8 bg-zinc-800/60 border-zinc-700 focus:ring-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="max-h-56 overflow-auto text-sm text-zinc-200">
              {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <UserPlus className="h-8 w-8 text-zinc-500 mb-2"/>
                  <p className="font-semibold">No leads assigned to this campaign</p>
                  <p className="text-zinc-500 text-xs mt-1">Assign leads to preview and launch.</p>
                  <Button className="mt-3 bg-emerald-600 hover:bg-emerald-500 cursor-pointer">Assign Leads</Button>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-400">No results found</div>
              ) : (
                <ul className="space-y-2">
                  {filteredLeads.slice(0, 100).map((l, i) => (
                    <li key={i} className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span>{l.email}</span>
                      <Badge className="bg-zinc-800 border border-zinc-700">{l.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusModal({ open, onOpenChange, payload }: { open: boolean; onOpenChange: (v: boolean) => void; payload: { action: 'activate' | 'pause'; leads: number } | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 text-zinc-200 border border-zinc-800">
        <DialogHeader>
          <DialogTitle>{payload?.action === 'activate' ? 'Activate Campaign?' : 'Pause Campaign?'}</DialogTitle>
          <DialogDescription>
            {payload?.action === 'activate' ? 'Confirm activation details below.' : 'Campaign will stop sending until resumed.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between"><span>Will send to</span><span className="font-semibold">{payload?.leads ?? 0} leads</span></div>
          <div className="flex items-center justify-between"><span>Estimated cost</span><span className="font-semibold">$15.60</span></div>
          <div className="flex items-center justify-between"><span>Expected delivery</span><span className="font-semibold">2–3 hours</span></div>
          <p className="text-amber-400 text-sm">⚠️ This campaign has no email template</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="cursor-pointer">Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer">Confirm Activation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const EmptyStateCreate: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl p-8 bg-zinc-900/60 border border-zinc-800 shadow-sm">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-teal-600/20 mb-4"><Mail className="h-7 w-7 text-teal-400"/></div>
      <h3 className="text-xl font-semibold text-zinc-100">No campaigns yet</h3>
      <p className="text-sm text-zinc-400 mt-1 max-w-md">Create your first campaign to start reaching leads.</p>
      <div className="flex gap-3 justify-center mt-4">
        <Button className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer">Create First Campaign</Button>
        <Button variant="ghost" className="text-zinc-300 cursor-pointer">Watch tutorial</Button>
      </div>
    </motion.div>
  </div>
);

const EmptyStateNoFilters: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="rounded-2xl p-8 bg-zinc-900/60 border border-zinc-800">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-amber-600/20 mb-4"><Settings2 className="h-7 w-7 text-amber-400"/></div>
      <h3 className="text-lg font-semibold text-zinc-100">No campaigns match your filters</h3>
      <p className="text-sm text-zinc-400 mt-1">Try adjusting your filters or search terms.</p>
      <Button onClick={onClear} className="mt-4 bg-emerald-600 hover:bg-emerald-500 cursor-pointer">Clear all filters</Button>
    </div>
  </div>
);

export default function CampaignsPage() {
  const [selected, setSelected] = useState<number[]>([]);
  const [detail, setDetail] = useState<{ open: boolean; data: any | null }>({ open: false, data: null });
  const [modal, setModal] = useState<{ open: boolean; payload: any | null }>({ open: false, payload: null });
  const [tab, setTab] = useState<string>("list");
  const [q, setQ] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [range, setRange] = useState<string>("30");
  const [leadsSort, setLeadsSort] = useState<'none' | 'asc' | 'desc'>('none');

  const totals = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    sent: campaigns.reduce((s, c) => s + (c.sent || 0), 0),
  }), []);

  const displayedCampaigns = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = !term ? campaigns : campaigns.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.service.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term)
    );
    if (leadsSort !== 'none') {
      const ratio = (c: any) => (c.leadsAssigned || 0) / Math.max(1, (c.leadsTotal || 0));
      list = [...list].sort((a, b) => {
        const ra = ratio(a);
        const rb = ratio(b);
        return leadsSort === 'asc' ? ra - rb : rb - ra;
      });
    }
    return list;
  }, [q, leadsSort]);

  const onSelectAll = (checked: boolean) => setSelected(checked ? displayedCampaigns.map(c => c.id) : []);
  const onToggleRow = (id: number, checked: boolean) => setSelected(prev => checked ? [...new Set([...prev, id])] : prev.filter(x => x !== id));

  const handleRowClick = (c: any) => setDetail({ open: true, data: c });

  const handleAction = (action: string, c: any) => {
    if (action === 'launch') setModal({ open: true, payload: { action: 'activate', leads: c.leadsAssigned } });
    if (action === 'pause') setModal({ open: true, payload: { action: 'pause', leads: c.leadsAssigned } });
    if (['assign','preview','send','edit','delete'].includes(action)) {
      console.log('action', action, c.id);
    }
  };

  const analyticsData = useMemo(() => {
    const days = Number(range);
    return makeSeries(isNaN(days) ? 30 : days);
  }, [range]);

  return (
    <div className="p-6 md:p-8 text-zinc-200 font-semibold">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-zinc-200 via-emerald-300 to-teal-300 bg-clip-text text-transparent">Campaigns</h1>
          <p className="text-sm text-zinc-500">Create, monitor, and optimize email campaigns.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 transition-all duration-200 cursor-pointer"><Plus className="h-4 w-4 mr-2"/>Create Campaign</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total" value={`${totals.total}`} icon={<Layers className="h-4 w-4 text-teal-400"/>} />
        <MetricCard title="Active" value={`${totals.active}`} icon={<Play className="h-4 w-4 text-emerald-400"/>} />
        <MetricCard title="Paused" value={`${totals.paused}`} icon={<Pause className="h-4 w-4 text-amber-400"/>} />
        <MetricCard title="Sent today" value={`${totals.sent}`} icon={<Send className="h-4 w-4 text-teal-400"/>} />
      </div>

      <Tabs defaultValue="list" value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-zinc-900/30 border border-zinc-800">
          <TabsTrigger value="list" className="font-semibold">All Campaigns</TabsTrigger>
          <TabsTrigger value="analytics" className="font-semibold">Analytics</TabsTrigger>
          <TabsTrigger value="templates" className="font-semibold">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="rounded-2xl bg-zinc-950/50 backdrop-blur-sm border-zinc-800">
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2 items-center flex-1 min-w-[280px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input value={q} onChange={(e)=> setQ(e.target.value)} placeholder="Search campaigns…" className="pl-8 w-64 bg-zinc-800/60 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus:ring-emerald-500" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-36 bg-zinc-800/60 border-zinc-700 text-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border border-zinc-800 text-zinc-200">
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                  <FiltersPopover activeCount={2} />
                </div>
                <div className="flex gap-2 items-center">
                  <Button onClick={()=> setBulkMode(b => !b)} variant="outline" className="bg-zinc-800/60 border-zinc-700 text-zinc-200 hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer"><Layers className="h-4 w-4 mr-2"/>{bulkMode ? 'Exit bulk' : 'Bulk actions'}</Button>
                  <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 transition-all duration-200 cursor-pointer"><Plus className="h-4 w-4 mr-2"/>Create Campaign</Button>
                </div>
              </div>

              <Separator className="my-2"/>

              <div className="rounded-xl overflow-hidden border border-zinc-800">
                <Table>
                  <TableHeader className="bg-zinc-900/30 text-zinc-500 uppercase tracking-wide text-sm font-semibold">
                    <TableRow>
                      <TableHead className="w-8">{bulkMode && <Checkbox aria-label="Select all" checked={selected.length === displayedCampaigns.length && displayedCampaigns.length>0} onCheckedChange={(v: boolean | "indeterminate") => onSelectAll(Boolean(v))}/>}</TableHead>
                      <TableHead className="md:table-cell">Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Service</TableHead>
                      <TableHead onClick={() => setLeadsSort(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none')} className="cursor-pointer select-none">Leads{leadsSort !== 'none' && <span className="ml-2 text-xs text-teal-300">{leadsSort}</span>}</TableHead>
                      <TableHead className="hidden md:table-cell">Sequence</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="hidden md:table-cell">Open / Click</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedCampaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="p-8 text-center text-zinc-400">No campaigns match your search</TableCell>
                      </TableRow>
                    ) : (
                      displayedCampaigns.map((c) => (
                        <TableRow key={c.id} className="hover:bg-zinc-900/30 cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest('[data-row-actions]')) return; handleRowClick(c); }}>
                          <TableCell className="w-8" onClick={(e) => e.stopPropagation()}>{bulkMode && <Checkbox aria-label="Select row" checked={selected.includes(c.id)} onCheckedChange={(v: boolean | "indeterminate") => onToggleRow(c.id, Boolean(v))}/>}</TableCell>
                          <TableCell className="font-bold text-zinc-100 text-[15px] md:table-cell">{c.name}</TableCell>
                          <TableCell><StatusPill status={c.status} /></TableCell>
                          <TableCell className="hidden md:table-cell"><Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">{c.service}</Badge></TableCell>
                          <TableCell className="w-[300px]">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-400 whitespace-nowrap">{c.leadsAssigned}/{c.leadsTotal}</span>
                              <div className="flex-1">
                                <ProgressBar value={Math.round(((c.leadsAssigned || 0) / Math.max(1, (c.leadsTotal || 0))) * 100)} color="bg-emerald-500" height="h-3"/>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-300 font-semibold hidden md:table-cell">{c.steps} steps</TableCell>
                          <TableCell className="text-zinc-300 font-semibold hidden md:table-cell">{new Date(c.created).toLocaleDateString()}</TableCell>
                          <TableCell className="text-zinc-300 font-semibold hidden md:table-cell">{c.open}% / {c.click}%</TableCell>
                          <TableCell className="text-right" data-row-actions onClick={(e)=> e.stopPropagation()}>
                            <ActionsMenuRow c={c} onAction={handleAction}/>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 pr-4">
              <MetricCard title="Total sent" value="12,480" sub="↑12% vs last period" icon={<Send className="h-4 w-4 text-teal-400"/>} />
              <MetricCard title="Avg open rate" value="19.4%" sub="↑2.1%" icon={<BarChart3 className="h-4 w-4 text-emerald-400"/>} />
              <MetricCard title="Avg click rate" value="5.2%" sub="↑0.6%" icon={<BarChart3 className="h-4 w-4 text-amber-400"/>} />
              <MetricCard title="Total replies" value="174" sub="↑8%" icon={<Mail className="h-4 w-4 text-teal-400"/>} />
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-zinc-400"/>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="w-40 bg-zinc-800/60 border-zinc-700 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border border-zinc-800 text-zinc-100">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {range === 'custom' && (
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-100">
              <p className="text-sm text-zinc-300 mb-2">Select start/end dates (demo placeholder)</p>
              <Calendar mode="range" />
            </div>
          )}

          <Card className="bg-zinc-950/50 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-100 font-semibold">Performance ({range === 'custom' ? 'custom' : `last ${range}d`})</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData}>
                  <XAxis dataKey="label" stroke="#cbd5e1"/>
                  <YAxis stroke="#cbd5e1"/>
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={2} dot={false} name="Sent" />
                  <Line type="monotone" dataKey="opens" stroke="#06b6d4" strokeWidth={2} dot={false} name="Opens" />
                  <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Clicks" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-zinc-950/50 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-100 font-semibold">Best performing campaigns</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-zinc-100">Campaign</TableHead>
                      <TableHead className="text-zinc-100">Open</TableHead>
                      <TableHead className="text-zinc-100">Click</TableHead>
                      <TableHead className="text-zinc-100">Replies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.slice(0,5).map((c, i) => (
                      <TableRow key={c.id} onClick={() => handleRowClick(c)} className="cursor-pointer hover:bg-zinc-900/40">
                        <TableCell className="font-semibold flex items-center gap-2 text-zinc-100">{i < 3 && <Crown className={`${i===0?'text-amber-400': i===1?'text-zinc-300':'text-rose-400'} h-4 w-4`} />} {c.name}</TableCell>
                        <TableCell className="text-zinc-100">{c.open}%</TableCell>
                        <TableCell className="text-zinc-100">{c.click}%</TableCell>
                        <TableCell className="text-zinc-100">{c.replies}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950/50 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-100 font-semibold">Service type breakdown</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={serviceBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                      {serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-950/50 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-100 font-semibold">Recent activity</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-100">
                <li>Campaign "Move-in Concierge — Chicago" sent to 100 leads</li>
                <li>Lead replied to "HVAC — October Push"</li>
                <li>"Roofing — Test Batch A" was scheduled</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="rounded-2xl bg-zinc-950/50 backdrop-blur-sm border-zinc-800">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-2xl text-zinc-100">Email Templates</CardTitle>
              <Button className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer"><Plus className="h-4 w-4 mr-2"/>Create Template</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input placeholder="Search templates…" className="pl-8 bg-zinc-800/60 border-zinc-700 focus:ring-emerald-500" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48 bg-zinc-800/60 border-zinc-700 text-zinc-200">
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border border-zinc-800 text-zinc-100">
                    <SelectItem value="all">All services</SelectItem>
                    <SelectItem value="Landscaping">Landscaping</SelectItem>
                    <SelectItem value="Roofing">Roofing</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="group border-zinc-800 bg-zinc-900/40 transition-all duration-200 hover:bg-zinc-900/60">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Template {i+1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-zinc-300">
                      <div className="h-24 rounded-md bg-zinc-800/60 border border-zinc-800 flex items-center justify-center text-zinc-500">Thumbnail</div>
                      <div>
                        <p className="text-zinc-100">Subject: Free local help for your project</p>
                        <p className="text-xs text-zinc-400">Created Oct 01, 2025</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span>Open 21%</span>
                        <span>Click 5%</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="border-zinc-700 cursor-pointer">Preview</Button>
                        <Button variant="outline" className="border-zinc-700 cursor-pointer">Edit</Button>
                        <Button variant="outline" className="border-zinc-700 cursor-pointer">Duplicate</Button>
                        <Button variant="destructive" className="cursor-pointer">Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {bulkMode && selected.length > 0 && (
        <div className="fixed left-4 right-4 bottom-4 z-50 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
          <div className="text-sm">{selected.length} campaign(s) selected</div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-zinc-700 cursor-pointer">Pause</Button>
            <Button variant="outline" className="border-zinc-700 cursor-pointer">Resume</Button>
            <Button variant="outline" className="border-zinc-700 cursor-pointer">Export</Button>
            <Button variant="destructive" className="cursor-pointer">Delete</Button>
            <Button variant="ghost" onClick={() => setSelected([])} className="cursor-pointer">Deselect all</Button>
          </div>
        </div>
      )}

  <CampaignDetail open={detail.open} onOpenChange={(v: boolean) => setDetail({ open: v, data: v ? detail.data : null })} data={detail.data} />
  <StatusModal open={modal.open} onOpenChange={(v: boolean) => setModal({ open: v, payload: v ? modal.payload : null })} payload={modal.payload} />
    </div>
  );
}
