"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Inbox, Play, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const SERVICE_TYPES = [
  "landscaping",
  "roofing",
  "hvac",
  "plumbing",
  "fencing",
  "remodeling"
]

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" }
]

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  // Form fields
  const [name, setName] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState("active")

  // Stats
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.status === "active").length,
    mostUsed: templates.reduce((max, t) => t.timesUsed > (max?.timesUsed ?? 0) ? t : max, null)?.name ?? "-",
    avgReplyRate: templates.length ? Math.round(templates.reduce((sum, t) => sum + (t.avgReplyRate ?? 0), 0) / templates.length) : 0
  }

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/templates")
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch (err) {
      setTemplates([])
      toast.error("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Dialog open for create/edit
  const openCreate = () => {
    setEditId(null)
    setName("")
    setServiceType("")
    setSubject("")
    setBody("")
    setStatus("active")
    setDialogOpen(true)
  }
  const openEdit = (template: any) => {
    setEditId(template.id)
    setName(template.name)
    setServiceType(template.serviceType)
    setSubject(template.subject)
    setBody(template.body)
    setStatus(template.status)
    setDialogOpen(true)
  }

  const handleSave = async (e: any) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Template name is required")
      return
    }
    if (!serviceType) {
      toast.error("Please select a service type")
      return
    }
    if (!subject.trim()) {
      toast.error("Subject line is required")
      return
    }
    if (!body.trim()) {
      toast.error("Email body is required")
      return
    }
    const payload = {
      name,
      serviceType,
      subject,
      body,
      status
    }
    try {
      let res, data
      if (editId) {
        res = await fetch(`/api/templates/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      }
      data = await res.json()
      if (res.ok) {
        toast.success(editId ? "Template updated!" : "Template created!")
        setDialogOpen(false)
        fetchTemplates()
      } else {
        toast.error(data.error || "Failed to save template")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this template?")) return
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Template deleted")
        fetchTemplates()
      } else {
        toast.error("Failed to delete template")
      }
    } catch {
      toast.error("Network error")
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-semibold">Email Templates</h1>
          <p className="text-sm text-muted-foreground">Manage your campaign email templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" onClick={openCreate}>Create Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogTitle>{editId ? "Edit Template" : "Create Template"}</DialogTitle>
            <form className="space-y-4" onSubmit={handleSave}>
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="serviceType">Service Type *</Label>
                <select
                  id="serviceType"
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select service type</option>
                  {SERVICE_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subject">Subject Line *</Label>
                <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="body">Email Body *</Label>
                <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} rows={12} required />
                <p className="text-xs text-muted-foreground mt-1">Available tags: {'{{firstName}}, {{lastName}}, {{city}}, {{state}}, {{serviceType}}, {{propertyValue}}'}</p>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="default" type="submit">Save Template</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Templates</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{loading ? <Skeleton className="h-6 w-16" /> : stats.total}</span>
            <p className="text-xs text-muted-foreground mt-1">All templates</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Templates</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{loading ? <Skeleton className="h-6 w-16" /> : stats.active}</span>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Most Used Template</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-base font-semibold">{loading ? <Skeleton className="h-6 w-24" /> : stats.mostUsed}</span>
            <p className="text-xs text-muted-foreground mt-1">Most used by campaigns</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Reply Rate</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{loading ? <Skeleton className="h-6 w-16" /> : `${stats.avgReplyRate}%`}</span>
            <p className="text-xs text-muted-foreground mt-1">Across all templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card className="bg-card border border-border mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Templates</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">All email templates in your workspace</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
            </div>
          ) : templates.length === 0 ? (
            <div className="p-6 flex items-center justify-center">
              <Card className="bg-muted border border-border p-6 w-full text-center">
                <CardTitle className="text-base font-semibold">No templates yet</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Create your first template to get started.</CardDescription>
              </Card>
            </div>
          ) : (
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Times Used</TableHead>
                  <TableHead>Avg Reply Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t, i) => (
                  <TableRow key={t.id || i} className="hover:bg-muted/50 py-1.5">
                    <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                    <TableCell>{t.subject}</TableCell>
                    <TableCell>{t.serviceType}</TableCell>
                    <TableCell>{t.timesUsed ?? 0}</TableCell>
                    <TableCell>{t.avgReplyRate ? `${t.avgReplyRate}%` : "-"}</TableCell>
                    <TableCell>
                      <Badge className={t.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-muted text-muted-foreground border border-border"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>Delete</Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info(t.body)}>Preview</Button>
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
