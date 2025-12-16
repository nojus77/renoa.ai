'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Phone,
  User,
  Briefcase,
  Send,
  Image as ImageIcon,
  ChevronDown,
  CheckCheck,
  Clock,
  X,
  Users,
  MessageSquare,
  Building2,
  Wrench,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type MessageTab = 'team' | 'customers';

interface Message {
  id: string;
  conversationId?: string;
  senderId?: string;
  senderType?: 'provider' | 'customer' | 'system';
  senderUserId?: string;
  senderName?: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  timestamp?: string;
  createdAt?: string;
  read: boolean;
  photoUrl?: string;
}

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  jobReference?: string;
  jobDate?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  source: 'renoa' | 'own';
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

interface TeamChat {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
}

const QUICK_REPLY_TEMPLATES = [
  "On my way!",
  "Running 15 minutes late",
  "Job completed! Photos attached.",
  "Thank you for your business!",
  "I'll be there shortly",
  "Just finished up, everything looks great!",
];

export default function ProviderMessages() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MessageTab>('customers');

  // Customer conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [customerMessages, setCustomerMessages] = useState<Message[]>([]);

  // Team state
  const [teamChat, setTeamChat] = useState<TeamChat | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [teamMessages, setTeamMessages] = useState<Message[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'renoa' | 'own'>('all');
  const [messageText, setMessageText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');
    const uid = localStorage.getItem('userId');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    setUserId(uid || id); // Fall back to providerId if userId not set

    fetchConversations(id);
    if (uid || id) {
      fetchTeamConversations(id, uid || id);
    }
  }, [router]);

  // Real-time polling for new messages
  useEffect(() => {
    if (!providerId) return;

    const interval = setInterval(() => {
      fetchConversations(providerId);
      if (userId) {
        fetchTeamConversations(providerId, userId);
      }
      if (selectedConversation) {
        fetchCustomerMessages(selectedConversation.customerId);
      }
      if (selectedTeamMember !== null) {
        fetchTeamMessages(selectedTeamMember);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [providerId, userId, selectedConversation, selectedTeamMember]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [customerMessages, teamMessages]);

  const fetchConversations = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/messages?providerId=${id}`);
      const data = await res.json();

      if (data.conversations) {
        setConversations(data.conversations);
        setFilteredConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamConversations = async (provId: string, uid: string) => {
    try {
      const res = await fetch(`/api/provider/messages/team/conversations?providerId=${provId}&userId=${uid}`);
      const data = await res.json();

      if (data.teamChat) {
        setTeamChat(data.teamChat);
      }
      if (data.conversations) {
        setTeamMembers(data.conversations);
      }
    } catch (error) {
      console.error('Failed to load team conversations:', error);
    }
  };

  const fetchCustomerMessages = async (customerId: string) => {
    try {
      const res = await fetch(`/api/provider/messages/${customerId}?providerId=${providerId}`);
      const data = await res.json();

      if (data.messages) {
        setCustomerMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  const fetchTeamMessages = async (recipientId: string | null) => {
    try {
      const url = recipientId && recipientId !== 'team'
        ? `/api/provider/messages/team?providerId=${providerId}&userId=${userId}&recipientId=${recipientId}`
        : `/api/provider/messages/team?providerId=${providerId}&userId=${userId}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.messages) {
        setTeamMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load team messages:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchCustomerMessages(conversation.customerId);
  };

  const handleSelectTeamMember = (memberId: string | null) => {
    setSelectedTeamMember(memberId);
    fetchTeamMessages(memberId);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !photoFile) return;
    if (sending) return;

    setSending(true);

    try {
      if (activeTab === 'team') {
        // Send team message
        const recipientId = selectedTeamMember === 'team' ? null : selectedTeamMember;

        const res = await fetch('/api/provider/messages/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            userId,
            recipientUserId: recipientId,
            content: messageText,
          }),
        });

        if (!res.ok) throw new Error('Failed to send message');

        setMessageText('');
        fetchTeamMessages(selectedTeamMember);
        fetchTeamConversations(providerId, userId);
      } else {
        // Send customer message
        if (!selectedConversation) return;

        // Optimistically add message to UI
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId: selectedConversation.id,
          senderId: providerId,
          senderType: 'provider',
          content: messageText,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setCustomerMessages(prev => [...prev, tempMessage]);

        if (photoFile) {
          toast.error('Photo upload coming soon!');
          setPhotoFile(null);
          setSending(false);
          return;
        }

        const res = await fetch('/api/provider/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            customerId: selectedConversation.customerId,
            content: messageText,
            type: 'sms',
          }),
        });

        if (!res.ok) throw new Error('Failed to send message');

        const data = await res.json();

        // Replace temp message with actual message from server
        setCustomerMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id ? data.message : msg
        ));

        toast.success('Message sent!');
        setMessageText('');
        setPhotoFile(null);
        fetchConversations(providerId);
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTemplateClick = (template: string) => {
    setMessageText(template);
    setShowTemplates(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Building2 className="w-3 h-3" />;
      case 'office':
        return <User className="w-3 h-3" />;
      case 'field':
        return <Wrench className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  // Apply filters for customer conversations
  useEffect(() => {
    let filtered = conversations;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filter === 'unread') {
      filtered = filtered.filter(conv => conv.unread);
    } else if (filter === 'renoa') {
      filtered = filtered.filter(conv => conv.source === 'renoa');
    } else if (filter === 'own') {
      filtered = filtered.filter(conv => conv.source === 'own');
    }

    setFilteredConversations(filtered);
  }, [searchQuery, filter, conversations]);

  const totalTeamUnread = (teamChat?.unreadCount || 0) + teamMembers.reduce((sum, m) => sum + m.unreadCount, 0);
  const totalCustomerUnread = conversations.filter(c => c.unread).length;

  const hasSelection = activeTab === 'team'
    ? selectedTeamMember !== null
    : selectedConversation !== null;

  const currentMessages = activeTab === 'team' ? teamMessages : customerMessages;

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="h-screen bg-zinc-950 flex flex-col">
        {/* Header - Desktop only */}
        <div className="hidden md:block border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-zinc-100">Messages</h1>
            <p className="text-sm text-zinc-400 mt-1">Communicate with your team and customers</p>
          </div>
        </div>

        {/* Split View Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Conversation List */}
          <div className={`${hasSelection ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-zinc-800 flex-col bg-zinc-900/30`}>
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => {
                  setActiveTab('team');
                  setSelectedConversation(null);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'team'
                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-zinc-800/50'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <Users className="w-4 h-4" />
                Team
                {totalTeamUnread > 0 && (
                  <Badge className="bg-emerald-500 text-white text-xs px-1.5 py-0">
                    {totalTeamUnread}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('customers');
                  setSelectedTeamMember(null);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'customers'
                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-zinc-800/50'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Customers
                {totalCustomerUnread > 0 && (
                  <Badge className="bg-emerald-500 text-white text-xs px-1.5 py-0">
                    {totalCustomerUnread}
                  </Badge>
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Filters - Only for customers */}
              {activeTab === 'customers' && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {(['all', 'unread', 'renoa', 'own'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        filter === f
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'renoa' ? 'Renoa' : 'Own'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'team' ? (
                <>
                  {/* Team Chat (broadcast) */}
                  {teamChat && (
                    <button
                      onClick={() => handleSelectTeamMember('team')}
                      className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                        selectedTeamMember === 'team' ? 'bg-zinc-800' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-white">Team Chat</p>
                        <p className="text-xs text-zinc-400 truncate">
                          {teamChat.lastMessage || 'Everyone'}
                        </p>
                      </div>
                      {teamChat.unreadCount > 0 && (
                        <Badge className="bg-emerald-500 text-white">{teamChat.unreadCount}</Badge>
                      )}
                    </button>
                  )}

                  {/* Individual team members */}
                  {teamMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectTeamMember(member.id)}
                      className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                        selectedTeamMember === member.id ? 'bg-zinc-800' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                        {getInitials(member.name)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">{member.name}</p>
                          <span className="text-zinc-500">{getRoleIcon(member.role)}</span>
                        </div>
                        {member.lastMessage && (
                          <p className="text-xs text-zinc-400 truncate">{member.lastMessage}</p>
                        )}
                      </div>
                      {member.unreadCount > 0 && (
                        <Badge className="bg-emerald-500 text-white">{member.unreadCount}</Badge>
                      )}
                    </button>
                  ))}

                  {teamMembers.length === 0 && !teamChat && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                      <Users className="w-12 h-12 text-zinc-600 mb-3" />
                      <p className="text-zinc-400 font-medium">No team members</p>
                      <p className="text-sm text-zinc-500">Add team members to start messaging</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                      <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-zinc-600" />
                      </div>
                      <p className="text-zinc-400 font-medium mb-1">No conversations</p>
                      <p className="text-sm text-zinc-500">
                        {searchQuery || filter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Messages will appear here'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`w-full p-3 text-left transition-colors hover:bg-zinc-800/50 ${
                            selectedConversation?.id === conv.id ? 'bg-zinc-800/70' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold text-sm">
                                {getInitials(conv.customerName)}
                              </div>
                              {conv.unread && (
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-zinc-900"></div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <h3 className="font-medium text-sm text-zinc-100 truncate">{conv.customerName}</h3>
                                <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                                  {getTimeAgo(conv.lastMessageTime)}
                                </span>
                              </div>

                              {conv.jobReference && (
                                <div className="flex items-center gap-1 text-xs text-zinc-500 mb-0.5">
                                  <Briefcase className="h-3 w-3" />
                                  <span className="truncate">{conv.jobReference}</span>
                                </div>
                              )}

                              <p className={`text-xs truncate ${conv.unread ? 'text-zinc-300 font-medium' : 'text-zinc-500'}`}>
                                {conv.lastMessage}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Main Area - Conversation View */}
          <div className={`${hasSelection ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-zinc-950`}>
            {hasSelection ? (
              <>
                {/* Conversation Header */}
                <div className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center justify-between p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      {/* Back button for mobile */}
                      <button
                        onClick={() => {
                          if (activeTab === 'team') setSelectedTeamMember(null);
                          else setSelectedConversation(null);
                        }}
                        className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {activeTab === 'team' && selectedTeamMember === 'team' && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">Team Chat</p>
                            <p className="text-xs text-zinc-400">{teamMembers.length + 1} members</p>
                          </div>
                        </>
                      )}

                      {activeTab === 'team' && selectedTeamMember && selectedTeamMember !== 'team' && (
                        <>
                          {(() => {
                            const member = teamMembers.find(m => m.id === selectedTeamMember);
                            return member ? (
                              <>
                                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                                  {getInitials(member.name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{member.name}</p>
                                  <p className="text-xs text-zinc-400 capitalize">{member.role}</p>
                                </div>
                              </>
                            ) : null;
                          })()}
                        </>
                      )}

                      {activeTab === 'customers' && selectedConversation && (
                        <>
                          <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm md:text-base font-semibold">
                            {getInitials(selectedConversation.customerName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="font-semibold text-sm md:text-base text-zinc-100 truncate">{selectedConversation.customerName}</h2>
                            {selectedConversation.jobReference && (
                              <p className="text-xs text-zinc-500 truncate">{selectedConversation.jobReference}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Quick Actions for customer messages */}
                    {activeTab === 'customers' && selectedConversation && (
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-800 px-2 md:px-3"
                          onClick={() => window.location.href = `tel:${selectedConversation.customerId}`}
                        >
                          <Phone className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Call</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-800 px-2 md:px-3"
                          onClick={() => router.push(`/provider/customers/${selectedConversation.customerId}`)}
                        >
                          <User className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Profile</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6">
                  <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
                    {currentMessages.map((message) => {
                      const isOwn = activeTab === 'team'
                        ? message.senderUserId === userId
                        : message.senderType === 'provider';
                      const isSystem = message.senderType === 'system';

                      if (isSystem) {
                        return (
                          <div key={message.id} className="flex justify-center">
                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-full text-xs text-zinc-400">
                              <Clock className="h-3 w-3" />
                              <span>{message.content}</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            {/* Sender name for team messages */}
                            {activeTab === 'team' && !isOwn && message.senderName && (
                              <span className="text-xs text-zinc-500 px-2">{message.senderName}</span>
                            )}

                            {message.photoUrl && (
                              <img
                                src={message.photoUrl}
                                alt="Attachment"
                                className="rounded-lg border border-zinc-700 max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(message.photoUrl, '_blank')}
                              />
                            )}
                            {message.content && (
                              <div
                                className={`px-3 md:px-4 py-2 md:py-2.5 rounded-2xl shadow-md ${
                                  isOwn
                                    ? 'bg-emerald-600 text-white rounded-br-sm'
                                    : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-1 px-2">
                              <span className="text-xs text-zinc-500">
                                {formatMessageTime(message.timestamp || message.createdAt || '')}
                              </span>
                              {isOwn && message.read && (
                                <CheckCheck className="h-3 w-3 text-blue-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="sticky bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shadow-lg p-3 md:p-4">
                  {/* Photo Preview */}
                  {photoFile && (
                    <div className="mb-3 relative inline-block">
                      <div className="relative w-24 h-24 rounded-lg border-2 border-emerald-500 overflow-hidden">
                        <img
                          src={URL.createObjectURL(photoFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setPhotoFile(null)}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{photoFile.name}</p>
                    </div>
                  )}

                  <div className="flex items-end gap-2 md:gap-3">
                    {/* Left Actions - only for customer messages */}
                    {activeTab === 'customers' && (
                      <div className="flex gap-1 md:gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                          title="Attach photo"
                        >
                          <ImageIcon className="h-5 w-5" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />

                        <div className="relative">
                          <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                            title="Quick replies"
                          >
                            <ChevronDown className="h-5 w-5" />
                          </button>

                          {/* Templates Dropdown */}
                          {showTemplates && (
                            <div className="absolute bottom-full mb-2 left-0 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-30">
                              <div className="p-2 border-b border-zinc-700">
                                <p className="text-xs font-semibold text-zinc-400">Quick Replies</p>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {QUICK_REPLY_TEMPLATES.map((template, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleTemplateClick(template)}
                                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                                  >
                                    {template}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Message Input */}
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />

                    {/* Send Button */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                      className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // No Conversation Selected
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-10 w-10 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">Select a conversation</h3>
                  <p className="text-sm text-zinc-500">
                    Choose from team or customers to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
