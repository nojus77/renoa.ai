'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  Search,
  Phone,
  Send,
  ChevronLeft,
  CheckCheck,
  Clock,
  Briefcase,
  MessageSquare,
  Loader2,
  Users,
  User,
  Building2,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

// Renoa Design System Colors
const LIME_GREEN = '#C4F542';

type MessageTab = 'team' | 'customers';

interface Message {
  id: string;
  customerId?: string;
  customerName?: string;
  senderId?: string;
  senderType?: 'worker' | 'customer' | 'system';
  senderUserId?: string;
  senderName?: string;
  senderRole?: string;
  content: string;
  timestamp?: string;
  createdAt?: string;
  read: boolean;
}

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  lastMessage: string | null;
  lastMessageTime: string;
  unread: boolean;
  unreadCount: number;
  jobReference: string | null;
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
  "Running a few minutes late",
  "I've arrived",
  "Job completed!",
  "Thank you!",
];

export default function WorkerMessages() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = localStorage.getItem('workerUserId');

    if (!id) {
      router.push('/worker/login');
      return;
    }

    setUserId(id);
    fetchConversations(id);
    fetchTeamConversations(id);

    // Check if we should open a specific conversation
    const openCustomerId = searchParams.get('customerId');
    if (openCustomerId) {
      // Will be handled after conversations load
    }
  }, [router, searchParams]);

  // Handle opening a specific conversation from URL params
  useEffect(() => {
    const openCustomerId = searchParams.get('customerId');
    if (openCustomerId && conversations.length > 0) {
      const conv = conversations.find(c => c.customerId === openCustomerId);
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [conversations, searchParams]);

  // Real-time polling for new messages
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchConversations(userId);
      fetchTeamConversations(userId);
      if (selectedConversation) {
        fetchCustomerMessages(selectedConversation.customerId);
      }
      if (selectedTeamMember !== null) {
        fetchTeamMessages(selectedTeamMember);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [userId, selectedConversation, selectedTeamMember]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [customerMessages, teamMessages]);

  // Apply search filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv =>
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  const fetchConversations = async (id: string) => {
    try {
      const res = await fetch(`/api/worker/messages?userId=${id}`);
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

  const fetchTeamConversations = async (id: string) => {
    try {
      const res = await fetch(`/api/worker/messages/team/conversations?userId=${id}`);
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
      const res = await fetch(`/api/worker/messages/${customerId}?userId=${userId}`);
      const data = await res.json();

      if (data.messages) {
        setCustomerMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const fetchTeamMessages = async (recipientId: string | null) => {
    try {
      const url = recipientId && recipientId !== 'team'
        ? `/api/worker/messages/team?userId=${userId}&recipientId=${recipientId}`
        : `/api/worker/messages/team?userId=${userId}`;

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
    if (!messageText.trim() || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;

    try {
      if (activeTab === 'team') {
        // Send team message
        const recipientId = selectedTeamMember === 'team' ? null : selectedTeamMember;

        // Optimistically add message
        const tempMessage: Message = {
          id: tempId,
          senderUserId: userId,
          senderName: 'You',
          content: messageText,
          createdAt: new Date().toISOString(),
          read: false,
        };
        setTeamMessages(prev => [...prev, tempMessage]);
        setMessageText('');

        const res = await fetch('/api/worker/messages/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            recipientUserId: recipientId,
            content: messageText,
          }),
        });

        if (!res.ok) throw new Error('Failed to send message');

        // Refresh messages
        fetchTeamMessages(selectedTeamMember);
        fetchTeamConversations(userId);
      } else {
        // Send customer message
        if (!selectedConversation) return;

        // Optimistically add message to UI
        const tempMessage: Message = {
          id: tempId,
          customerId: selectedConversation.customerId,
          customerName: selectedConversation.customerName,
          senderId: userId,
          senderType: 'worker',
          content: messageText,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setCustomerMessages(prev => [...prev, tempMessage]);
        setMessageText('');

        const res = await fetch('/api/worker/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            customerId: selectedConversation.customerId,
            content: messageText,
          }),
        });

        if (!res.ok) throw new Error('Failed to send message');

        const data = await res.json();

        // Replace temp message with actual message
        setCustomerMessages(prev => prev.map(msg =>
          msg.id === tempId ? data.message : msg
        ));

        // Refresh conversation list to update last message
        fetchConversations(userId);
      }
    } catch (error) {
      // Remove temp message on error
      if (activeTab === 'team') {
        setTeamMessages(prev => prev.filter(msg => msg.id !== tempId));
      } else {
        setCustomerMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (template: string) => {
    setMessageText(template);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
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

  const totalTeamUnread = (teamChat?.unreadCount || 0) + teamMembers.reduce((sum, m) => sum + m.unreadCount, 0);
  const totalCustomerUnread = conversations.filter(c => c.unread).length;

  const hasSelection = activeTab === 'team'
    ? selectedTeamMember !== null
    : selectedConversation !== null;

  const currentMessages = activeTab === 'team' ? teamMessages : customerMessages;

  if (loading) {
    return (
      <WorkerLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header - Only show when no conversation selected */}
        {!hasSelection && (
          <div className="sticky top-0 z-20 bg-black border-b border-[#2A2A2A]">
            <div className="px-4 py-3">
              <h1 className="text-xl font-bold text-white">Messages</h1>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2A2A2A]">
              <button
                onClick={() => {
                  setActiveTab('team');
                  setSelectedConversation(null);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'team'
                    ? 'border-b-2 text-white'
                    : 'text-zinc-500'
                }`}
                style={activeTab === 'team' ? { borderBottomColor: LIME_GREEN, color: LIME_GREEN } : undefined}
              >
                <Users className="w-4 h-4" />
                Team
                {totalTeamUnread > 0 && (
                  <span
                    className="px-1.5 py-0.5 text-xs rounded-full text-black font-medium"
                    style={{ backgroundColor: LIME_GREEN }}
                  >
                    {totalTeamUnread}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('customers');
                  setSelectedTeamMember(null);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'customers'
                    ? 'border-b-2 text-white'
                    : 'text-zinc-500'
                }`}
                style={activeTab === 'customers' ? { borderBottomColor: LIME_GREEN, color: LIME_GREEN } : undefined}
              >
                <MessageSquare className="w-4 h-4" />
                Customers
                {totalCustomerUnread > 0 && (
                  <span
                    className="px-1.5 py-0.5 text-xs rounded-full text-black font-medium"
                    style={{ backgroundColor: LIME_GREEN }}
                  >
                    {totalCustomerUnread}
                  </span>
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  style={{ borderColor: searchQuery ? LIME_GREEN : '#2A2A2A' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Conversation List or Chat View */}
        {!hasSelection ? (
          // Conversation List
          <div className="flex-1 overflow-y-auto pb-20">
            {activeTab === 'team' ? (
              <>
                {/* Team Chat (broadcast) */}
                {teamChat && (
                  <button
                    onClick={() => handleSelectTeamMember('team')}
                    className="w-full p-4 flex items-center gap-3 border-b border-[#2A2A2A] hover:bg-[#1F1F1F] active:bg-[#2A2A2A] transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: LIME_GREEN }}
                    >
                      <Users className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-white">Team Chat</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {teamChat.lastMessage || 'Everyone'}
                      </p>
                    </div>
                    {teamChat.unreadCount > 0 && (
                      <span
                        className="px-2 py-1 text-xs rounded-full text-black font-medium"
                        style={{ backgroundColor: LIME_GREEN }}
                      >
                        {teamChat.unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Individual team members */}
                {teamMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectTeamMember(member.id)}
                    className="w-full p-4 flex items-center gap-3 border-b border-[#2A2A2A] hover:bg-[#1F1F1F] active:bg-[#2A2A2A] transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">{member.name}</p>
                        <span className="text-zinc-500">{getRoleIcon(member.role)}</span>
                      </div>
                      {member.lastMessage && (
                        <p className="text-xs text-zinc-500 truncate">{member.lastMessage}</p>
                      )}
                    </div>
                    {member.unreadCount > 0 && (
                      <span
                        className="px-2 py-1 text-xs rounded-full text-black font-medium"
                        style={{ backgroundColor: LIME_GREEN }}
                      >
                        {member.unreadCount}
                      </span>
                    )}
                  </button>
                ))}

                {teamMembers.length === 0 && !teamChat && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                    <Users className="w-12 h-12 text-zinc-600 mb-3" />
                    <p className="text-zinc-400 font-medium">No team members</p>
                    <p className="text-sm text-zinc-500">Your team will appear here</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-[#1F1F1F] flex items-center justify-center mb-4">
                      <MessageSquare className="h-8 w-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400 font-medium mb-1">No conversations</p>
                    <p className="text-sm text-zinc-500">
                      {searchQuery
                        ? 'No results found'
                        : 'Messages with your customers will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2A2A2A]">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className="w-full p-4 text-left transition-colors hover:bg-[#1F1F1F] active:bg-[#2A2A2A]"
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-black font-semibold"
                              style={{ backgroundColor: LIME_GREEN }}
                            >
                              {getInitials(conv.customerName)}
                            </div>
                            {conv.unread && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-black"></div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-white truncate">{conv.customerName}</h3>
                              <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                                {getTimeAgo(conv.lastMessageTime)}
                              </span>
                            </div>

                            {conv.jobReference && (
                              <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                                <Briefcase className="h-3 w-3" />
                                <span className="truncate">{conv.jobReference}</span>
                              </div>
                            )}

                            <p className={`text-sm truncate ${conv.unread ? 'text-zinc-300 font-medium' : 'text-zinc-500'}`}>
                              {conv.lastMessage || 'No messages yet'}
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
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="sticky top-0 z-20 bg-black border-b border-[#2A2A2A] px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (activeTab === 'team') setSelectedTeamMember(null);
                    else setSelectedConversation(null);
                  }}
                  className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {activeTab === 'team' && selectedTeamMember === 'team' && (
                  <>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: LIME_GREEN }}
                    >
                      <Users className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-white">Team Chat</h2>
                      <p className="text-xs text-zinc-500">{teamMembers.length + 1} members</p>
                    </div>
                  </>
                )}

                {activeTab === 'team' && selectedTeamMember && selectedTeamMember !== 'team' && (
                  <>
                    {(() => {
                      const member = teamMembers.find(m => m.id === selectedTeamMember);
                      return member ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {getInitials(member.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-white truncate">{member.name}</h2>
                            <p className="text-xs text-zinc-500 capitalize">{member.role}</p>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </>
                )}

                {activeTab === 'customers' && selectedConversation && (
                  <>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-black font-semibold text-sm"
                      style={{ backgroundColor: LIME_GREEN }}
                    >
                      {getInitials(selectedConversation.customerName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-white truncate">{selectedConversation.customerName}</h2>
                      {selectedConversation.jobReference && (
                        <p className="text-xs text-zinc-500 truncate">{selectedConversation.jobReference}</p>
                      )}
                    </div>

                    {selectedConversation.customerPhone && (
                      <a
                        href={`tel:${selectedConversation.customerPhone}`}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Phone className="h-5 w-5" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <MessageSquare className="h-12 w-12 text-zinc-600 mb-3" />
                  <p className="text-zinc-500">No messages yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                currentMessages.map((message) => {
                  const isOwn = activeTab === 'team'
                    ? message.senderUserId === userId
                    : message.senderType === 'worker';
                  const isSystem = message.senderType === 'system';

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1F1F1F] rounded-full text-xs text-zinc-500">
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
                      <div className={`max-w-[80%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                        {/* Sender name for team messages */}
                        {activeTab === 'team' && !isOwn && message.senderName && (
                          <span className="text-xs text-zinc-500 px-1">{message.senderName}</span>
                        )}

                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            isOwn
                              ? 'rounded-br-sm text-black'
                              : 'bg-[#2A2A2A] text-white rounded-bl-sm'
                          }`}
                          style={isOwn ? { backgroundColor: LIME_GREEN } : undefined}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-xs text-zinc-600">
                            {formatMessageTime(message.timestamp || message.createdAt || '')}
                          </span>
                          {isOwn && message.read && (
                            <CheckCheck className="h-3 w-3 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies + Message Input - Sticky Container */}
            <div className="sticky bottom-20 bg-black border-t border-[#2A2A2A]">
              {/* Quick Replies - Only for customer messages */}
              {activeTab === 'customers' && (
                <div className="px-4 py-2 bg-[#0A0A0A]">
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                    {QUICK_REPLY_TEMPLATES.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(template)}
                        className="flex-shrink-0 px-3 py-1.5 bg-[#1F1F1F] border border-[#2A2A2A] rounded-full text-xs text-zinc-400 hover:bg-[#2A2A2A] hover:text-white transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 pt-2">
                <div className="flex items-end gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    style={{ borderColor: messageText ? LIME_GREEN : '#2A2A2A' }}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{
                      backgroundColor: messageText.trim() && !sending ? LIME_GREEN : '#2A2A2A',
                      color: messageText.trim() && !sending ? 'black' : '#6B7280',
                    }}
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
