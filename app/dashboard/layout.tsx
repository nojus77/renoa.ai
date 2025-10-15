'use client'
import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'

// Simple navigation items - we'll use text for now, add icons later
const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/campaigns', label: 'Campaigns' },
  { href: '/dashboard/providers', label: 'Providers' },
  { href: '/dashboard/analytics', label: 'Analytics' },
]

const bottomNavItems = [
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/logout', label: 'Logout' },
]

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
  <div className="h-full px-3 py-4 overflow-y-auto bg-card border-r border-border flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 px-2">
            <Link href="/dashboard" className="text-xl font-semibold text-foreground">
              Renoa.ai
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-muted-foreground rounded-lg hover:bg-muted/50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Navigation */}
          <nav className="mt-auto space-y-1 pt-4 border-t border-border">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`p-4 ${sidebarOpen ? 'ml-64' : ''} transition-all duration-200`}>
        {/* Header bar with Theme Toggle */}
        <div className="flex items-center justify-end mb-4">
          <ThemeToggle />
        </div>
        {/* Toggle Button for mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2 text-muted-foreground rounded-lg hover:bg-muted/50"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Page Content */}
        <div className="container mx-auto">{children}</div>
      </div>
    </div>
  )
}