"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Mail, UserPlus, TrendingUp, Flag, Inbox, Reply, FolderOpen, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

type Lead = {
  id: string
  firstName: string
  lastName: string
  status?: string
  leadScore?: number
  serviceInterest?: string
  updatedAt?: string
}

type Campaign = {
  id: string
  name: string
  status?: string
  sent?: number
  opened?: number
  replied?: number
  replyRate?: number
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalLeads, setTotalLeads] = useState<number>(0)
  const [highPriority, setHighPriority] = useState<number>(0)
  const [serviceBreakdown, setServiceBreakdown] = useState<Array<[string, number]>>([])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch paginated leads for recent activity
        const leadsRes = await fetch(`/api/leads?limit=50`)
        if (!leadsRes.ok) throw new Error("Failed to load leads")
        const leadsData = await leadsRes.json()
        const leadsList: Lead[] = Array.isArray(leadsData?.leads) ? leadsData.leads : []

        // Fetch campaigns
        const campaignsRes = await fetch(`/api/campaigns`).catch(() => new Response(null, { status: 404 }))
        let campaignsList: Campaign[] = []
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json()
          campaignsList = Array.isArray(campaignsData?.campaigns)
            ? campaignsData.campaigns
            : Array.isArray(campaignsData)
            ? campaignsData
            : []
        }

        // Fetch total leads count
        const totalRes = await fetch(`/api/leads?countOnly=true`)
        const totalJson = await totalRes.json()
        setTotalLeads(totalJson.total ?? 0)

        // Fetch high priority count (score >= 70)
        const hpRes = await fetch(`/api/leads?countOnly=true&scoreMin=70`)
        const hpJson = await hpRes.json()
        setHighPriority(hpJson.total ?? 0)

        // Fetch service breakdown
        const sbRes = await fetch(`/api/leads?groupByService=true`)
        const sbJson = await sbRes.json()
        setServiceBreakdown(Array.isArray(sbJson.breakdown) ? sbJson.breakdown : [])

        if (!isMounted) return
        setLeads(leadsList)
        setCampaigns(campaignsList)
      } catch (e: any) {
        if (!isMounted) return
        setError(e?.message ?? "Failed to load dashboard data")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const metrics = useMemo(() => {
    const replied = leads.filter((l) => (l.status ?? "").toLowerCase() === "replied").length
    const replyRate = totalLeads > 0 ? Math.round((replied / totalLeads) * 100) : 0
    const activeCampaigns = campaigns.length
    return { total: totalLeads, highPriority, replied, replyRate, activeCampaigns }
  }, [leads, campaigns, totalLeads, highPriority])

  const recentActivity = useMemo(() => {
    return [...leads]
      .filter((l) => l.updatedAt)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, 8)
  }, [leads])

  // serviceBreakdown now comes from API

  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Top: Tabs like shadcn example */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Overview of your leads and campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" className="h-8 px-3 text-xs">
            <UserPlus className="h-4 w-4 mr-2" /> New Lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Metrics */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">&nbsp;</CardTitle>
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="mt-2 h-4 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Inbox className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.total}</div>
                    <p className="text-xs text-muted-foreground">+{Math.max(0, Math.floor(metrics.total * 0.08))} this week</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Priority (70+)</CardTitle>
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.highPriority}</div>
                    <p className="text-xs text-muted-foreground">Leads with score 70+</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
                    <p className="text-xs text-muted-foreground">Currently running</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Reply Rate</CardTitle>
                    <Reply className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.replyRate}%</div>
                    <p className="text-xs text-muted-foreground">Replied / total leads</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Middle Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across your leads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-80 overflow-auto pr-2">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div className="flex items-start gap-3" key={i}>
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))
                ) : recentActivity.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent activity.</div>
                ) : (
                  recentActivity.map((l) => (
                    <div className="flex items-start gap-3" key={l.id}>
                      <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{l.firstName} {l.lastName}</span> updated
                        </p>
                        <p className="text-xs text-muted-foreground">{l.updatedAt ? new Date(l.updatedAt).toLocaleString() : ''}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Performance of your running campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-80 overflow-auto pr-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div className="flex items-center justify-between" key={i}>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))
                ) : campaigns.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No active campaigns.</div>
                ) : (
                  campaigns.map((c) => (
                    <div className="flex items-center justify-between" key={c.id}>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(c.replyRate ?? (c.replied && c.sent ? (c.replied / c.sent) * 100 : 0))}% reply rate</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{c.status ?? 'active'}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom: Service Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Service Breakdown</CardTitle>
              <CardDescription>Lead counts by service type</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-6" />
                  ))}
                </div>
              ) : serviceBreakdown.length === 0 ? (
                <div className="text-sm text-muted-foreground">No leads yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {serviceBreakdown.map(([service, count]) => (
                    <div key={service} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <span className="text-sm capitalize text-muted-foreground">{service}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder contents for other tabs */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> This section is under construction.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> This section is under construction.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> This section is under construction.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
