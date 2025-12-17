"use client"

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Calendar,
  MessageCircle,
  Menu,
  X,
  MoreHorizontal,
  FileText,
  UsersRound,
  ChevronDown,
  Search,
  Bell,
  Plus,
  User,
  CreditCard,
  HelpCircle,
  Mail,
  Target,
  Map
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import ThemeToggle from './ThemeToggle';
import NotificationsDropdown from './NotificationsDropdown';
import AddJobModal from './AddJobModal';
import SupportChat from './SupportChat';
import { ClickToComponent } from 'click-to-react-component';

interface ProviderLayoutProps {
  children: React.ReactNode;
  providerName?: string;
}

export default function ProviderLayout({ children, providerName }: ProviderLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('owner');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [providerId, setProviderId] = useState<string>('');
  const [providerServiceTypes, setProviderServiceTypes] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [userId, setUserId] = useState<string>('');

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  // Fetch provider profile photo, role, and service types
  useEffect(() => {
    const fetchProviderData = async () => {
      const id = localStorage.getItem('providerId');
      const uid = localStorage.getItem('userId');
      const role = localStorage.getItem('userRole') || 'owner';
      const email = localStorage.getItem('userEmail') || '';
      const name = localStorage.getItem('userName') || '';

      setUserRole(role);
      setUserEmail(email);
      setUserName(name);
      setUserId(uid || id || '');

      if (!id) return;
      setProviderId(id);

      try {
        const [profileRes, notificationsRes] = await Promise.all([
          fetch(`/api/provider/profile?id=${id}`),
          fetch(`/api/provider/notifications?providerId=${id}&limit=1`),
        ]);

        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.provider) {
          setProfilePhotoUrl(profileData.provider.profilePhotoUrl || profileData.provider.avatar || '');
          setProviderServiceTypes(profileData.provider.serviceTypes || []);
        }

        const notificationsData = await notificationsRes.json();
        if (notificationsRes.ok) {
          setUnreadNotificationCount(notificationsData.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching provider data:', error);
      }
    };

    fetchProviderData();
  }, []);

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    if (!providerId) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`/api/provider/notifications?providerId=${providerId}&limit=1`);
        const data = await res.json();
        if (res.ok) {
          setUnreadNotificationCount(data.unreadCount || 0);
        }
      } catch (error) {
        // Silently ignore polling errors
      }
    };

    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [providerId]);

  // Fetch and poll for unread message count every 30 seconds
  useEffect(() => {
    if (!providerId || !userId) return;

    const fetchUnreadMessages = async () => {
      try {
        const res = await fetch(`/api/provider/messages/unread-count?providerId=${providerId}&userId=${userId}`);
        const data = await res.json();
        if (res.ok) {
          setUnreadMessageCount(data.total || 0);
        }
      } catch (error) {
        // Silently ignore polling errors
      }
    };

    // Fetch immediately
    fetchUnreadMessages();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [providerId, userId]);

  const handleLogout = () => {
    localStorage.removeItem('providerId');
    localStorage.removeItem('providerName');
    router.push('/provider/login');
  };

  const navItems = [
    {
      name: 'Home',
      href: '/provider/home',
      icon: LayoutDashboard,
      disabled: false,
      showInBottomNav: true,
      showInTopNav: true,
    },
    {
      name: 'Calendar',
      href: '/provider/calendar',
      icon: Calendar,
      disabled: false,
      showInBottomNav: true,
      showInTopNav: true,
    },
    {
      name: 'Dispatch',
      href: '/provider/dispatch',
      icon: Map,
      disabled: false,
      showInBottomNav: false,
      showInTopNav: true,
    },
    {
      name: 'Customers',
      href: '/provider/customers',
      icon: Users,
      disabled: false,
      showInBottomNav: true,
      showInTopNav: true,
    },
    {
      name: 'Jobs',
      href: '/provider/jobs',
      icon: FileText,
      disabled: false,
      showInBottomNav: false,
      showInTopNav: true,
    },
    {
      name: 'Messages',
      href: '/provider/messages',
      icon: MessageCircle,
      disabled: false,
      showInBottomNav: true,
      showInTopNav: true,
    },
    {
      name: 'Invoices',
      href: '/provider/invoices',
      icon: FileText,
      disabled: false,
      showInBottomNav: false,
      showInTopNav: true,
    },
    {
      name: 'Analytics',
      href: '/provider/analytics',
      icon: TrendingUp,
      disabled: false,
      showInBottomNav: false,
      showInTopNav: false,
    },
    {
      name: 'Team',
      href: '/provider/team',
      icon: UsersRound,
      disabled: false,
      showInBottomNav: false,
      showInTopNav: true,
    },
    {
      name: 'Settings',
      href: '/provider/settings',
      icon: Settings,
      disabled: false,
      showInBottomNav: false,
      showInTopNav: false,
    },
  ];

  const isActive = (href: string) => pathname === href;
  const bottomNavItems = navItems.filter(item => item.showInBottomNav);
  const topNavItems = navItems.filter(item => item.showInTopNav);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {process.env.NODE_ENV === 'development' && <ClickToComponent />}
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        {/* Top Navigation Bar - Desktop */}
        <div className="hidden lg:flex fixed top-0 left-0 right-0 h-[72px] bg-card dark:bg-zinc-900 border-b border-border dark:border-zinc-800 z-50 shadow-sm dark:shadow-none">
          <div className="flex items-center w-full px-8 max-w-[1920px] mx-auto">
            {/* Left: Logo + Business Name */}
            <div className="flex items-center gap-3 flex-shrink-0 min-w-[240px]">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Logo"
                  className="w-10 h-10 rounded-lg object-cover border border-border dark:border-zinc-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {providerName?.charAt(0).toUpperCase() || 'R'}
                </div>
              )}
              <div>
                <h1 className="text-base font-bold text-foreground dark:text-zinc-100 whitespace-nowrap">
                  {providerName || 'Provider Portal'}
                </h1>
              </div>
            </div>

            {/* Center: Nav Items */}
            <nav className="flex items-center justify-center gap-1 flex-1 px-4">
              {topNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showMessageBadge = item.name === 'Messages' && unreadMessageCount > 0;

                return (
                  <Link
                    key={item.name}
                    href={item.disabled ? '#' : item.href}
                    className={`
                      flex items-center gap-2 px-4 py-4 rounded-full transition-all font-medium whitespace-nowrap
                      ${active
                        ? 'bg-primary text-primary-foreground'
                        : item.disabled
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-muted-foreground dark:text-zinc-300 hover:bg-accent dark:hover:bg-emerald-800/50 hover:text-foreground dark:hover:text-white'
                      }
                    `}
                    style={{ fontSize: '14px' }}
                    onClick={(e) => {
                      if (item.disabled) e.preventDefault();
                    }}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4" />
                      {showMessageBadge && (
                        <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                          {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                        </span>
                      )}
                    </div>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Quick Actions + Profile */}
            <div className="flex items-center gap-4 flex-shrink-0 min-w-[240px] justify-end">
              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2.5 rounded-lg text-muted-foreground dark:text-zinc-400 hover:bg-accent dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {/* Notification badge - only show if there are unread notifications */}
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <NotificationsDropdown
                  isOpen={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  providerId={providerId}
                  onUnreadCountChange={setUnreadNotificationCount}
                />
              </div>

              {/* New Button (Add Job) */}
              <button
                onClick={() => setShowAddJobModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold transition-colors shadow-sm"
                style={{ fontSize: '15px' }}
              >
                <Plus className="h-4 w-4" />
                <span>NEW</span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent dark:hover:bg-zinc-800 transition-colors"
                >
                  {/* User greeting */}
                  {userName && (
                    <span className="text-sm font-medium text-muted-foreground dark:text-zinc-300">
                      Hi, {userName.split(' ')[0]}
                    </span>
                  )}
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border border-border dark:border-zinc-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted dark:bg-zinc-700 flex items-center justify-center text-muted-foreground dark:text-zinc-300 font-medium text-sm">
                      {providerName?.charAt(0).toUpperCase() || 'P'}
                    </div>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground dark:text-zinc-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-4 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border dark:border-zinc-800">
                      <div className="flex items-center gap-3 mb-2">
                        {profilePhotoUrl ? (
                          <img
                            src={profilePhotoUrl}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-lg font-bold">
                            {(userName || providerName)?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground dark:text-zinc-100 truncate">
                            {userName || providerName || 'User'}
                          </p>
                          {userEmail && (
                            <p className="text-xs text-muted-foreground dark:text-zinc-400 truncate flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {userEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                          {userRole === 'owner' ? 'Owner' : userRole === 'office' ? 'Office' : 'Field'}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/provider/home"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground dark:text-zinc-300 hover:bg-accent dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Target className="h-4 w-4" />
                        <span>Home</span>
                      </Link>

                      <Link
                        href="/provider/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground dark:text-zinc-300 hover:bg-accent dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>

                      {userRole === 'owner' && (
                        <Link
                          href="/provider/billing"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground dark:text-zinc-300 hover:bg-accent dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Subscription & Billing</span>
                        </Link>
                      )}

                      <a
                        href="https://docs.renoa.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground dark:text-zinc-300 hover:bg-accent dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white transition-colors"
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span>Help Center</span>
                      </a>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border dark:border-zinc-800 my-1"></div>

                    {/* Settings & Theme */}
                    <div className="py-2">
                      <Link
                        href="/provider/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground dark:text-zinc-300 hover:bg-accent dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      <div className="px-4 py-2">
                        <ThemeToggle />
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border dark:border-zinc-800 pt-2">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-accent dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-300 transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card dark:bg-zinc-900 border-b border-border dark:border-zinc-800 z-40 flex items-center justify-between px-4 shadow-sm dark:shadow-none">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground dark:text-zinc-100">Provider Portal</h1>
            {providerName && (
              <p className="text-xs text-muted-foreground dark:text-zinc-500">{providerName}</p>
            )}
          </div>

          <ThemeToggle />
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-card dark:bg-zinc-900 border-r border-border dark:border-zinc-800 z-[60] shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Mobile menu header */}
            <div className="p-4 border-b border-border dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {providerName?.charAt(0).toUpperCase() || 'P'}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-foreground dark:text-zinc-100">Menu</h2>
                  {providerName && (
                    <p className="text-xs text-muted-foreground dark:text-zinc-500">{providerName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-zinc-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile menu items */}
            <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showMessageBadge = item.name === 'Messages' && unreadMessageCount > 0;

                return (
                  <Link
                    key={item.name}
                    href={item.disabled ? '#' : item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px]
                      ${active
                        ? 'bg-primary text-primary-foreground'
                        : item.disabled
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-muted-foreground dark:text-zinc-300 hover:bg-accent dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white'
                      }
                    `}
                    onClick={(e) => {
                      if (item.disabled) e.preventDefault();
                      else setMobileMenuOpen(false);
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className="h-5 w-5" />
                      {showMessageBadge && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                          {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu logout */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border dark:border-zinc-800 bg-card dark:bg-zinc-900">
              <Button
                variant="outline"
                className="w-full min-h-[44px] bg-muted dark:bg-zinc-800 border-border dark:border-zinc-700 text-muted-foreground dark:text-zinc-300 hover:bg-accent dark:hover:bg-zinc-700 hover:text-foreground dark:hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}

        {/* Main Content - Full width with top padding */}
        <div className="flex-1 overflow-auto pt-16 pb-20 lg:pt-[72px] lg:pb-0">
          {children}
        </div>

        {/* Bottom Navigation - Mobile only */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card dark:bg-zinc-900 border-t border-border dark:border-zinc-800 z-40 shadow-[0_-1px_3px_0_rgb(0_0_0/0.1)] dark:shadow-none">
          <div className="flex items-center justify-around h-full px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showMessageBadge = item.name === 'Messages' && unreadMessageCount > 0;

              return (
                <Link
                  key={item.name}
                  href={item.disabled ? '#' : item.href}
                  className={`
                    flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] min-h-[44px]
                    ${active
                      ? 'text-primary'
                      : item.disabled
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-muted-foreground dark:text-zinc-400 active:bg-accent dark:active:bg-zinc-800'
                    }
                  `}
                  onClick={(e) => {
                    if (item.disabled) e.preventDefault();
                  }}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {showMessageBadge && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* More button for additional menu items */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] min-h-[44px] text-muted-foreground dark:text-zinc-400 active:bg-accent dark:active:bg-zinc-800"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </div>

        {/* Add Job Modal */}
        {showAddJobModal && providerId && (
          <AddJobModal
            isOpen={showAddJobModal}
            onClose={() => setShowAddJobModal(false)}
            providerId={providerId}
            providerServiceTypes={providerServiceTypes}
            onJobCreated={() => {
              setShowAddJobModal(false);
              // Optionally refresh the page or trigger a reload
              window.location.reload();
            }}
          />
        )}

        {/* Support Chat - hide on messages page to avoid overlap with send button */}
        {pathname !== '/provider/messages' && <SupportChat />}
      </div>
    </ThemeProvider>
  );
}
