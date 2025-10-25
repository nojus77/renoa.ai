"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function CampaignsPage() {
  // Campaign state
  const [assignLeadsDialogOpen, setAssignLeadsDialogOpen] = useState(false)
  const [assignCampaignId, setAssignCampaignId] = useState<string | null>(null)
  const [assignFilters, setAssignFilters] = useState({
    tier: '',
    serviceType: '',
    location: ''
  })
  const [assigning, setAssigning] = useState(false)
  const [previewEmailDialogOpen, setPreviewEmailDialogOpen] = useState(false)
  const [previewEmailData, setPreviewEmailData] = useState<any>(null)
  const [generatingCampaignId, setGeneratingCampaignId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [apiStats, setApiStats] = useState<any>(null)
  const [apiTrends, setApiTrends] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [status, setStatus] = useState("draft")

  // Template state
  const [templates, setTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateSubject, setTemplateSubject] = useState("")
  const [templateBody, setTemplateBody] = useState("")

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<'campaign' | 'template'>('campaign')
  const [deleteItem, setDeleteItem] = useState<any>(null)

  // Preview state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<any>(null)

  // Detail state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailCampaign, setDetailCampaign] = useState<any>(null)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/campaigns")
      const data = await res.json()
      console.log("[API] /api/campaigns response:", data)
      if (Array.isArray(data)) {
        setCampaigns(data)
        console.log("[State] campaigns set:", data)
      } else {
        setCampaigns([])
        console.log("[State] campaigns set: [] (not array)")
      }
      setApiStats(data.stats || null)
      setApiTrends(data.stats?.trends || null)
    } catch (err) {
      setCampaigns([])
      setApiStats(null)
      setApiTrends(null)
      console.error("[Fetch Error] /api/campaigns:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const res = await fetch("/api/templates")
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch (err) {
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }

  const generatePreviewEmail = async (campaignId: string) => {
    setGeneratingCampaignId(campaignId)
    try {
      const campaign = campaigns.find(c => c.id === campaignId)
      if (!campaign) return

      if (campaign.leadCount === 0) {
        toast.error('This campaign has no assigned leads')
        return
      }

      // Use the first template for preview (or improve logic as needed)
      const template = templates[0]
      if (!template) {
        toast.error('No templates found')
        return
      }

      // Use processTemplateWithSampleData for instant preview
      const processed = processTemplateWithSampleData(template)
      setPreviewEmailData({
        leadName: 'John Smith',
        leadScore: 85,
        subject: processed.subject,
        body: processed.body
      })
      setPreviewEmailDialogOpen(true)
    } catch (err) {
      toast.error('Failed to generate preview')
    } finally {
      setGeneratingCampaignId(null)
    }
  }

  const handleAssignLeads = async () => {
    if (!assignCampaignId) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/campaigns/${assignCampaignId}/assign-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: assignFilters })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Assigned ${data.assigned} leads to campaign!`)
        fetchCampaigns()
        setAssignLeadsDialogOpen(false)
        setAssignFilters({ tier: '', serviceType: '', location: '' })
      } else {
        toast.error(data.error || 'Failed to assign leads')
      }
    } catch (err) {
      toast.error('Failed to assign leads')
    } finally {
      setAssigning(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const endpoint = deleteType === 'campaign' ? '/api/campaigns' : '/api/templates'
      const res = await fetch(`${endpoint}/${deleteItem.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`${deleteType === 'campaign' ? 'Campaign' : 'Template'} deleted!`)
        deleteType === 'campaign' ? fetchCampaigns() : fetchTemplates()
      } else {
        toast.error('Failed to delete')
      }
    } catch (err) {
      toast.error('Failed to delete')
    } finally {
      setDeleteDialogOpen(false)
      setDeleteItem(null)
    }
  }

  const openDeleteDialog = (item: any, type: 'campaign' | 'template') => {
    setDeleteItem(item)
    setDeleteType(type)
    setDeleteDialogOpen(true)
  }

  const processTemplateWithSampleData = (template: any) => {
    const sampleData = {
      firstName: 'John',
      lastName: 'Smith',
      city: 'Chicago',
      state: 'IL',
      serviceType: 'landscaping',
      propertyValue: '$450,000'
    }
    let processedSubject = template.subject
    let processedBody = template.body
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processedSubject = processedSubject.replace(regex, value)
      processedBody = processedBody.replace(regex, value)
    })
    return { subject: processedSubject, body: processedBody }
  }

  useEffect(() => {
    fetchCampaigns()
    fetchTemplates()
  }, [])

  const stats = apiStats
    ? {
        total: apiStats.total,
        active: apiStats.active,
        paused: apiStats.paused,
        sent: apiStats.sent,
        totalOpens: apiStats.totalOpens,
        totalClicks: apiStats.totalClicks,
        totalReplies: apiStats.totalReplies,
        avgReplyRate: apiStats.avgReplyRate,
      }
    : {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === "active").length,
        paused: campaigns.filter(c => c.status === "paused").length,
        sent: 0,
        totalOpens: 0,
        totalClicks: 0,
        totalReplies: 0,
        avgReplyRate: 0,
      }

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
    <div className="p-6">
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold">Campaigns</h1>
              <p className="text-sm text-muted-foreground">Manage your campaigns</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Campaign</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" aria-describedby="campaign-dialog-desc">
                <DialogTitle>{name ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
                <DialogDescription id="campaign-dialog-desc">
                  Fill in the campaign details below.
                </DialogDescription>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!name.trim()) { toast.error('Name required'); return }
                  if (!serviceType) { toast.error('Service type required'); return }
                  try {
                    const res = await fetch('/api/campaigns', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name,
                        description: desc,
                        serviceType,
                        status: status || 'draft',
                        targetAudience: { type: 'all' },
                        sequenceType: 'sms_email'
                      })
                    })
                    const data = await res.json()
                    if (res.ok) {
                      toast.success('Campaign created!')
                      fetchCampaigns()
                      setDialogOpen(false)
                      setName(''); setDesc(''); setServiceType(''); setStatus('draft')
                    } else {
                      toast.error(data.error)
                    }
                  } catch (err) {
                    toast.error('Failed')
                  }
                }} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
                  </div>
                  <div>
                    <Label>Service Type</Label>
                    <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full px-3 py-2 bg-input border rounded-md">
                      <option value="">Select</option>
                      <option value="landscaping">Landscaping</option>
                      <option value="roofing">Roofing</option>
                      <option value="hvac">HVAC</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="fencing">Fencing</option>
                      <option value="remodeling">Remodeling</option>
                    </select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 bg-input border rounded-md">
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  <Button type="submit">Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{stats.total}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Active</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{stats.active}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Paused</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{stats.paused}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Sent</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{stats.sent}</span></CardContent>
            </Card>
          </div>

          <Card>
            {loading ? (
              <div className="p-8 text-center">Loading campaigns...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>Sequences</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8">No campaigns found</TableCell></TableRow>
                  ) : (
                    campaigns.map((c, idx) => (
  <TableRow key={`${c.id}-${idx}`} className="cursor-pointer hover:bg-muted/50" onClick={() => { setDetailCampaign(c); setDetailDialogOpen(true); }}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(c.status)}>{c.status}</Badge>
                        </TableCell>
                        <TableCell>{c.serviceType}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${c.totalLeads && c.sentCount / c.totalLeads * 100 > 60 ? "bg-green-500" : c.totalLeads && c.sentCount / c.totalLeads * 100 > 30 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${c.totalLeads ? (c.sentCount / c.totalLeads * 100) : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{c.sentCount}/{c.totalLeads}</span>
                          </div>
                        </TableCell>
                        <TableCell>{typeof c.openRate === "number" ? `${c.openRate.toFixed(1)}%` : "0%"}</TableCell>
                        <TableCell>{typeof c.clickRate === "number" ? `${c.clickRate.toFixed(1)}%` : "0%"}</TableCell>
                        <TableCell>{c.sequenceCount} steps</TableCell>
                        <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
  <div className="flex gap-2">
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={(e) => { 
        e.stopPropagation()
        setAssignCampaignId(c.id)
        setAssignLeadsDialogOpen(true)
      }}
    >
      Assign Leads
    </Button>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={(e) => { 
        e.stopPropagation()
        generatePreviewEmail(c.id)
      }}
      disabled={generatingCampaignId === c.id || c.leadCount === 0}
    >
      {c.leadCount === 0 ? 'No Leads' : generatingCampaignId === c.id ? 'Generating...' : 'Preview Email'}
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          const res = await fetch(`/api/campaigns/${c.id}/launch`, { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            toast.success('Campaign launched! Generating emails in background...')
            // Optionally: trigger polling for progress
          } else {
            toast.error(data.error || 'Failed to launch campaign')
          }
        } catch (err) {
          toast.error('Failed to launch campaign')
        }
      }}
      disabled={c.leadCount === 0}
    >
      Launch Campaign
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          const res = await fetch(`/api/campaigns/${c.id}/send`, { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            toast.success('Sending campaign via SES...')
          } else {
            toast.error(data.error || 'Failed to send campaign')
          }
        } catch (err) {
          toast.error('Failed to send campaign')
        }
      }}
      disabled={c.leadCount === 0}
    >
      Send Campaign
    </Button>
    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setName(c.name); setDesc(c.description || ''); setServiceType(c.serviceType); setStatus(c.status); setDialogOpen(true); }}>Edit</Button>
    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDeleteDialog(c, 'campaign'); }}>Delete</Button>
  </div>
</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold">Email Templates</h1>
              <p className="text-sm text-muted-foreground">Manage templates</p>
            </div>
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Template</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogTitle>{templateName ? 'Edit Template' : 'Create Template'}</DialogTitle>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!templateName.trim() || !templateSubject.trim() || !templateBody.trim()) {
                    toast.error('All fields required'); return
                  }
                  try {
                    const res = await fetch('/api/templates', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: templateName,
                        subject: templateSubject,
                        bodyText: templateBody
                      })
                    })
                    const data = await res.json()
                    if (res.ok) {
                      toast.success('Template created!')
                      fetchTemplates()
                      setTemplateDialogOpen(false)
                      setTemplateName(''); setTemplateSubject(''); setTemplateBody('')
                    } else {
                      toast.error(data.error)
                    }
                  } catch (err) {
                    toast.error('Failed')
                  }
                }} className="space-y-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input value={templateName} onChange={e => setTemplateName(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Subject Line</Label>
                    <Input value={templateSubject} onChange={e => setTemplateSubject(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Email Body</Label>
                    <Textarea value={templateBody} onChange={e => setTemplateBody(e.target.value)} rows={12} required />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available tags: firstName, lastName, city, serviceType (wrap in double curly braces)
                    </p>
                  </div>
                  <Button type="submit">Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(t => (
                  <TableRow key={t.id} className="hover:bg-muted/50">
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.subject}</TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setTemplateName(t.name); setTemplateSubject(t.subject); setTemplateBody(t.body); setTemplateDialogOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(t, 'template')}>Delete</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setPreviewTemplate(t); setPreviewDialogOpen(true); }}>Preview</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Delete {deleteType === 'campaign' ? 'Campaign' : 'Template'}</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Preview Template: {previewTemplate?.name}</DialogTitle>
          <div className="space-y-4">
            {previewTemplate && (() => {
              const processed = processTemplateWithSampleData(previewTemplate)
              return (
                <>
                  <div>
                    <Label className="text-sm font-medium">Subject Line</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md border">
                      <p className="text-sm">{processed.subject}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email Body</Label>
                    <div className="mt-1 p-4 bg-muted rounded-md border min-h-[200px]">
                      <div className="whitespace-pre-wrap text-sm">{processed.body}</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Note:</strong> This preview uses sample data (John Smith, Chicago, IL, $450,000 property). Real emails will use actual lead data.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setPreviewDialogOpen(false)}>Close Preview</Button>
                  </div>
                </>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="campaign-detail-desc">
          <DialogTitle>Campaign Details: {detailCampaign?.name}</DialogTitle>
          <DialogDescription id="campaign-detail-desc">
            Full campaign metrics, timeline, and assigned leads.
          </DialogDescription>
          <div className="space-y-6">
            {detailCampaign && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Campaign Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge className={getStatusBadge(detailCampaign.status)}>{detailCampaign.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Service:</span>
                        <span className="text-sm font-medium">{detailCampaign.serviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Created:</span>
                        <span className="text-sm">{detailCampaign.createdAt ? new Date(detailCampaign.createdAt).toLocaleDateString() : '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sent:</span>
                        <span className="text-sm font-medium">{detailCampaign.sentCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Open Rate:</span>
                        <span className="text-sm font-medium">{typeof detailCampaign.openRate === "number" ? `${detailCampaign.openRate.toFixed(1)}%` : "0%"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Click Rate:</span>
                        <span className="text-sm font-medium">{typeof detailCampaign.clickRate === "number" ? `${detailCampaign.clickRate.toFixed(1)}%` : "0%"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Replies:</span>
                        <span className="text-sm font-medium">{detailCampaign.replyCount || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sequences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-2 py-1 text-left">Step</th>
                          <th className="px-2 py-1 text-left">Delay</th>
                          <th className="px-2 py-1 text-left">Template</th>
                          <th className="px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailCampaign.sequences?.map((s: any) => (
                          <tr key={s.id} className="border-b">
                            <td className="px-2 py-1">{s.stepNumber}</td>
                            <td className="px-2 py-1">{s.delayDays} days</td>
                            <td className="px-2 py-1">{s.templateName}</td>
                            <td className="px-2 py-1">{s.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Leads (first 5)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {detailCampaign.leads?.map((l: any) => (
                        <Badge key={l.id} className="bg-muted text-foreground">
                            {l.name} ({l.email})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end">
                  <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewEmailDialogOpen} onOpenChange={setPreviewEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>AI-Generated Email Preview</DialogTitle>
          <div className="space-y-4">
            {previewEmailData && (
              <>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Sample lead:</strong> {previewEmailData.leadName} (Score: {previewEmailData.leadScore})
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    <strong>Cost:</strong> ${previewEmailData.cost} | Tokens: {previewEmailData.tokensUsed}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subject Line</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md border">
                    <p className="text-sm font-semibold">{previewEmailData.subject}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email Body</Label>
                  <div className="mt-1 p-4 bg-muted rounded-md border min-h-[200px]">
                    <div className="whitespace-pre-wrap text-sm">{previewEmailData.body}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewEmailDialogOpen(false)}>Close</Button>
                  <Button onClick={() => {
                    toast.success('Email approved! Ready to send when campaign launches.')
                    setPreviewEmailDialogOpen(false)
                  }}>Approve & Use</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignLeadsDialogOpen} onOpenChange={setAssignLeadsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Assign Leads to Campaign</DialogTitle>
          <DialogDescription>
            Select filters to automatically assign matching leads
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label>Lead Tier</Label>
              <select 
                value={assignFilters.tier} 
                onChange={e => setAssignFilters({...assignFilters, tier: e.target.value})}
                className="w-full px-3 py-2 bg-input border rounded-md"
              >
                <option value="">All Tiers</option>
                <option value="1">Tier 1 (Score 70+)</option>
                <option value="2">Tier 2 (Score 50-69)</option>
                <option value="3">Tier 3 (Score &lt;50)</option>
              </select>
            </div>
            <div>
              <Label>Service Type</Label>
              <select 
                value={assignFilters.serviceType} 
                onChange={e => setAssignFilters({...assignFilters, serviceType: e.target.value})}
                className="w-full px-3 py-2 bg-input border rounded-md"
              >
                <option value="">All Services</option>
                <option value="landscaping">Landscaping</option>
                <option value="roofing">Roofing</option>
                <option value="hvac">HVAC</option>
                <option value="plumbing">Plumbing</option>
                <option value="fencing">Fencing</option>
                <option value="remodeling">Remodeling</option>
              </select>
            </div>
            <div>
              <Label>Location (City)</Label>
              <Input 
                value={assignFilters.location} 
                onChange={e => setAssignFilters({...assignFilters, location: e.target.value})}
                placeholder="e.g., Chicago"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                This will assign all leads matching the selected filters to this campaign.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignLeadsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignLeads} disabled={assigning}>
                {assigning ? 'Assigning...' : 'Assign Leads'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}