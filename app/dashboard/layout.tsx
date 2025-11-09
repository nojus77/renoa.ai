'use client'
import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Shield } from 'lucide-react'

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
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminRole, setAdminRole] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('adminToken')

      if (!token) {
        router.push('/admin/login')
        return
      }

      try {
        const response = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (data.valid) {
          // Load admin info from localStorage
          const name = localStorage.getItem('adminName') || ''
          const email = localStorage.getItem('adminEmail') || ''
          const role = localStorage.getItem('adminRole') || ''
          const mustChangePassword = localStorage.getItem('adminMustChangePassword') === 'true'

          setAdminName(name)
          setAdminEmail(email)
          setAdminRole(role)

          // Check if user must change password and is not already on settings page
          if (mustChangePassword && pathname !== '/dashboard/settings') {
            router.push('/dashboard/settings')
            return
          }

          setIsAuthorized(true)
        } else {
          // Token is invalid or expired
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminEmail')
          localStorage.removeItem('adminName')
          localStorage.removeItem('adminRole')
          localStorage.removeItem('adminMustChangePassword')
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Token verification failed:', error)
        router.push('/admin/login')
      }
    }

    verifyToken()
  }, [router, pathname])

  // Show nothing while checking auth
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <div className="text-muted-foreground">Verifying access...</div>
        </div>
      </div>
    )
  }

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
        {/* Header bar with User Menu and Theme Toggle */}
        <div className="flex items-center justify-end gap-3 mb-4">
          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium text-foreground">{adminName}</span>
                <span className="text-xs text-muted-foreground capitalize">{adminRole.replace('_', ' ')}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{adminName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{adminEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logout" className="flex items-center cursor-pointer text-rose-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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