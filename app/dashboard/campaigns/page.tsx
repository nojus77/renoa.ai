"use client"

import { useEffect, useState } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Mail, Inbox, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
export default function CampaignsPage() {
  const [targetLeads, setTargetLeads] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetLeadsOpen, setTargetLeadsOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<string>("")
  const [serviceType, setServiceType] = useState<string>("")
  const [status, setStatus] = useState<string>("draft")
  const [testSelect, setTestSelect] = useState<string>("")
  // Form fields
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [startDate, setStartDate] = useState("")

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/campaigns")
      const data = await res.json()
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : [])
      console.log("Fetched campaigns:", data.campaigns)
    } catch (err) {
      setCampaigns([])
      console.error("Error fetching campaigns:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Stats
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === "active").length,
    paused: campaigns.filter(c => c.status === "paused").length,
    sent: campaigns.reduce((sum, c) => sum + (c.sent ?? 0), 0)
  }

  // Table columns
  const columns = [
    "Name", "Status", "Leads", "Sent", "Open Rate", "Click Rate", "Replies", "Created", "Actions"
  ]

  // Status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      case "paused":
        return "bg-amber-50 text-amber-700 border border-amber-200"
      case "completed":
        return "bg-slate-50 text-slate-700 border border-slate-200"
      default:
        return "bg-muted text-muted-foreground border border-border"
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Manage your email outreach campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Create Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogTitle>Create Campaign</DialogTitle>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault()
              console.log('=== CAMPAIGN CREATION DEBUG ===')
              console.log('Form data:', {
                name,
                desc,
                targetLeads,
                emailTemplate,
                startDate,
                status
              })
              if (!serviceType) {
                toast.error('Service type is required')
                return
              }
              const payload = {
                name,
                description: desc,
                serviceType,
                targetAudience: targetLeads,
                status,
                sequenceType: 'single'
              };
              console.log("Payload to POST /api/campaigns:", payload);
              try {
                const res = await fetch("/api/campaigns", {
                  headers: { "Content-Type": "application/json" },
                  method: "POST",
                  body: JSON.stringify(payload)
                })
                const data = await res.json()
                console.log("POST response:", data)
                if (!res.ok) {
                  console.error("API error response:", data)
                }
                if (res.ok) {
                  await fetchCampaigns()
                  setDialogOpen(false)
                  setName(""); setDesc(""); setTargetLeads(""); setEmailTemplate(""); setStatus(""); setStartDate(""); setServiceType("")
                  toast.success("Campaign created successfully!")
                } else {
                  toast.error(data.error || "Failed to create campaign")
                }
              } catch (err) {
                console.error("Create campaign error:", err)
                toast.error("Network error")
              }
            }}>
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter campaign name" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe your campaign" className="mt-1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscaping">Landscaping</SelectItem>
                    <SelectItem value="roofing">Roofing</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="fencing">Fencing</SelectItem>
                    <SelectItem value="remodeling">Remodeling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leads">Target Leads</Label>
                <Select
                  value={targetLeads}
                  onValueChange={setTargetLeads}
                  open={targetLeadsOpen}
                  onOpenChange={(open) => {
                    console.log('Target Leads Select open state:', open);
                    setTargetLeadsOpen(open);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="all">All Leads</SelectItem>
                    <SelectItem value="high-priority">High Priority Only</SelectItem>
                    <SelectItem value="by-service">By Service Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template">Email Template</Label>
                <Select value={emailTemplate} onValueChange={v => { console.log('Email Template onValueChange', v); setEmailTemplate(v); }}>
                  <SelectTrigger className="mt-1" onClick={() => console.log('Email Template SelectTrigger clicked')}>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]" >
                    {/* Email Template SelectContent rendered */}
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="start">Start Date</Label>
                <Input id="start" type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={v => { console.log('Status onValueChange', v); setStatus(v); }}>
                  <SelectTrigger className="mt-1" onClick={() => console.log('Status SelectTrigger clicked')}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]" >
                    {/* Status SelectContent rendered */}
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
      {/* Test Select outside Dialog */}
      <div className="mb-6">
        <Label>Test Select Outside Dialog</Label>
        <Select value={testSelect} onValueChange={v => { console.log('Test Select onValueChange', v); setTestSelect(v); }}>
          <SelectTrigger className="mt-1" onClick={() => console.log('Test SelectTrigger clicked')}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="z-[100]" >
            {/* Test SelectContent rendered */}
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="default" type="submit">Create Campaign</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Campaigns</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{loading ? <Skeleton className="h-6 w-16" /> : stats.total}</span>
            <p className="text-xs text-muted-foreground mt-1">All campaigns</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Campaigns</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{loading ? <Skeleton className="h-6 w-16" /> : stats.active}</span>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Paused Campaigns</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{loading ? <Skeleton className="h-6 w-16" /> : stats.paused}</span>
            <p className="text-xs text-muted-foreground mt-1">Paused by user</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{loading ? <Skeleton className="h-6 w-16" /> : stats.sent}</span>
            <p className="text-xs text-muted-foreground mt-1">Emails sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-card border border-border mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Campaigns</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">All campaigns in your workspace</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-6 flex items-center justify-center">
              <Card className="bg-muted border border-border p-6 w-full text-center">
                <CardTitle className="text-base font-semibold">No campaigns yet</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Create your first campaign to get started.</CardDescription>
              </Card>
            </div>
          ) : (
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {columns.map(col => (
                    <TableHead key={col} className="text-xs font-medium text-muted-foreground uppercase py-1.5">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c, i) => (
                  <TableRow key={c.id || i} className="hover:bg-muted/50 py-1.5">
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{c.leads ?? 0}</TableCell>
                    <TableCell>{c.sent ?? 0}</TableCell>
                    <TableCell>{c.openRate ? `${c.openRate}%` : "-"}</TableCell>
                    <TableCell>{c.clickRate ? `${c.clickRate}%` : "-"}</TableCell>
                    <TableCell>{c.replies ?? 0}</TableCell>
                    <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="sm"><Play className="h-4 w-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="sm"><Pause className="h-4 w-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>

  )
}

