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
  Info,
  X,
  Crown,
  Paperclip,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { validateAndCompressImage } from '@/lib/image-upload';

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
  senderAvatar?: string | null;
  content: string;
  timestamp?: string;
  createdAt?: string;
  read: boolean;
  crewId?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  thumbnailUrl?: string | null;
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
  type: 'member';
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

interface CrewChat {
  id: string;
  crewId: string;
  type: 'crew';
  name: string;
  color: string;
  memberCount: number;
  leaderId?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
}

interface TeamChat {
  id: string;
  type: 'team';
  name: string;
  unreadCount: number;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  isLead?: boolean;
  isCurrentUser?: boolean;
}

interface GroupInfo {
  type: 'team' | 'crew';
  name: string;
  color?: string;
  memberCount: number;
  createdAt?: string;
  members: GroupMember[];
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
  const [activeTab, setActiveTab] = useState<MessageTab>('team');

  // Customer conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [customerMessages, setCustomerMessages] = useState<Message[]>([]);

  // Team state
  const [teamChat, setTeamChat] = useState<TeamChat | null>(null);
  const [crews, setCrews] = useState<CrewChat[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamChat, setSelectedTeamChat] = useState<string | null>(null); // 'team', 'crew-{id}', or member id
  const [teamMessages, setTeamMessages] = useState<Message[]>([]);

  // Group info modal state
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loadingGroupInfo, setLoadingGroupInfo] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [teamAttachment, setTeamAttachment] = useState<File | null>(null);
  const [teamAttachmentPreview, setTeamAttachmentPreview] = useState<string | null>(null);
  const [customerAttachment, setCustomerAttachment] = useState<File | null>(null);
  const [customerAttachmentPreview, setCustomerAttachmentPreview] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const customerAttachmentInputRef = useRef<HTMLInputElement>(null);
  const customerCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = localStorage.getItem('workerUserId');

    if (!id) {
      router.push('/worker/login');
      return;
    }

    setUserId(id);
    fetchConversations(id);
    fetchTeamConversations(id);
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
      if (selectedTeamChat !== null) {
        fetchTeamMessages(selectedTeamChat);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [userId, selectedConversation, selectedTeamChat]);

  // Auto-scroll to bottom when new messages arrive or conversation changes
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated before scrolling
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [customerMessages, teamMessages, selectedConversation, selectedTeamChat]);

  useEffect(() => {
    if (!teamAttachment) {
      setTeamAttachmentPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(teamAttachment);
    setTeamAttachmentPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [teamAttachment]);

  useEffect(() => {
    if (!customerAttachment) {
      setCustomerAttachmentPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(customerAttachment);
    setCustomerAttachmentPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [customerAttachment]);

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
      if (data.crews) {
        setCrews(data.crews);
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
        // Dispatch event to notify nav to refresh unread count (messages were marked as read)
        window.dispatchEvent(new CustomEvent('messagesRead'));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const fetchTeamMessages = async (chatId: string) => {
    try {
      let url = `/api/worker/messages/team?userId=${userId}`;

      if (chatId === 'team') {
        // Team-wide chat
        url += '&recipientId=team';
      } else if (chatId.startsWith('crew-')) {
        // Crew chat
        const crewId = chatId.replace('crew-', '');
        url += `&crewId=${crewId}`;
      } else {
        // Direct message
        url += `&recipientId=${chatId}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.messages) {
        setTeamMessages(data.messages);
        // Dispatch event to notify nav to refresh unread count (messages were marked as read)
        window.dispatchEvent(new CustomEvent('messagesRead'));
      }
    } catch (error) {
      console.error('Failed to load team messages:', error);
    }
  };

  const fetchGroupInfo = async (chatId: string) => {
    setLoadingGroupInfo(true);
    try {
      let url = `/api/worker/messages/team/members?userId=${userId}`;

      if (chatId === 'team') {
        url += '&type=team';
      } else if (chatId.startsWith('crew-')) {
        const crewId = chatId.replace('crew-', '');
        url += `&type=crew&crewId=${crewId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setGroupInfo(data);
      setShowGroupInfo(true);
    } catch (error) {
      console.error('Failed to load group info:', error);
      toast.error('Failed to load member info');
    } finally {
      setLoadingGroupInfo(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Immediately mark as read in local state and dispatch event
    if (conversation.unread || conversation.unreadCount > 0) {
      setConversations(prev => prev.map(c =>
        c.id === conversation.id ? { ...c, unread: false, unreadCount: 0 } : c
      ));
      window.dispatchEvent(new CustomEvent('messagesRead'));
    }
    fetchCustomerMessages(conversation.customerId);
  };

  const handleSelectTeamChat = (chatId: string) => {
    setSelectedTeamChat(chatId);
    // Immediately mark as read in local state and dispatch event
    if (chatId === 'team' && teamChat?.unreadCount) {
      setTeamChat(prev => prev ? { ...prev, unreadCount: 0 } : null);
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } else if (chatId.startsWith('crew-')) {
      const crewId = chatId.replace('crew-', '');
      setCrews(prev => prev.map(c =>
        c.crewId === crewId ? { ...c, unreadCount: 0 } : c
      ));
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } else if (chatId !== 'team') {
      // Direct message to team member
      setTeamMembers(prev => prev.map(m =>
        m.id === chatId ? { ...m, unreadCount: 0 } : m
      ));
      window.dispatchEvent(new CustomEvent('messagesRead'));
    }
    fetchTeamMessages(chatId);
  };

  const handleSendMessage = async () => {
    const trimmedMessage = messageText.trim();
    if (activeTab === 'team') {
      if (!trimmedMessage && !teamAttachment) return;
    } else if (activeTab === 'customers') {
      if (!trimmedMessage && !customerAttachment) return;
    }
    if (sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;

    try {
      if (activeTab === 'team') {
        if (!selectedTeamChat) {
          toast.error('Select a team chat first');
          setSending(false);
          return;
        }
        if (!userId) {
          toast.error('Not authenticated');
          setSending(false);
          return;
        }
        // Determine message type
        let recipientId: string | null = null;
        let crewId: string | null = null;

        if (selectedTeamChat === 'team') {
          // Team-wide message
          recipientId = null;
        } else if (selectedTeamChat?.startsWith('crew-')) {
          // Crew message
          crewId = selectedTeamChat.replace('crew-', '');
        } else {
          // Direct message
          recipientId = selectedTeamChat;
        }

        // Optimistically add message
        const mediaPayload: { mediaUrl?: string; thumbnailUrl?: string; mediaType?: string } = {};
        if (teamAttachment) {
          const formData = new FormData();
          formData.append('userId', userId);
          formData.append('file', teamAttachment);

          const uploadRes = await fetch('/api/worker/messages/team/upload', {
            method: 'POST',
            body: formData,
          });
          const uploadData = await uploadRes.json();

          if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload image');

          mediaPayload.mediaUrl = uploadData.url;
          mediaPayload.thumbnailUrl = uploadData.thumbnailUrl;
          mediaPayload.mediaType = 'image';
        }

        const tempMessage: Message = {
          id: tempId,
          senderUserId: userId,
          senderName: 'You',
          content: trimmedMessage,
          createdAt: new Date().toISOString(),
          read: false,
          crewId,
          ...mediaPayload,
        };
        setTeamMessages(prev => [...prev, tempMessage]);
        setMessageText('');

        const res = await fetch('/api/worker/messages/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            recipientUserId: recipientId,
            crewId,
            content: trimmedMessage,
            ...mediaPayload,
          }),
        });

        if (!res.ok) throw new Error('Failed to send message');

        setTeamAttachment(null);
        // Refresh messages
        fetchTeamMessages(selectedTeamChat!);
        fetchTeamConversations(userId);
      } else {
        // Send customer message
        if (!selectedConversation) return;

        // Handle photo upload if present
        let mediaUrl: string | undefined;
        let mediaType: string | undefined;

        if (customerAttachment) {
          const formData = new FormData();
          formData.append('userId', userId);
          formData.append('customerId', selectedConversation.customerId);
          formData.append('file', customerAttachment);

          const uploadRes = await fetch('/api/worker/messages/upload', {
            method: 'POST',
            body: formData,
          });
          const uploadData = await uploadRes.json();

          if (!uploadRes.ok) {
            throw new Error(uploadData.error || 'Failed to upload image');
          }

          mediaUrl = uploadData.url;
          mediaType = 'image';
        }

        // Optimistically add message to UI
        const tempMessage: Message = {
          id: tempId,
          customerId: selectedConversation.customerId,
          customerName: selectedConversation.customerName,
          senderId: userId,
          senderType: 'worker',
          content: trimmedMessage,
          mediaUrl,
          mediaType,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setCustomerMessages(prev => [...prev, tempMessage]);
        setMessageText('');
        setCustomerAttachment(null);

        const res = await fetch('/api/worker/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            customerId: selectedConversation.customerId,
            content: trimmedMessage,
            mediaUrl,
            mediaType,
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

  const handleTeamAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const { file, error } = await validateAndCompressImage(e.target.files[0]);
      if (error || !file) {
        toast.error(error || 'Failed to process image');
      } else {
        setTeamAttachment(file);
      }
    }
    e.target.value = '';
  };

  const handleCustomerAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const { file, error } = await validateAndCompressImage(e.target.files[0]);
      if (error || !file) {
        toast.error(error || 'Failed to process image');
      } else {
        setCustomerAttachment(file);
      }
    }
    e.target.value = '';
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-500/20 text-amber-400';
      case 'office':
        return 'bg-blue-500/20 text-blue-400';
      case 'field':
        return 'bg-emerald-500/20 text-emerald-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const totalTeamUnread = (teamChat?.unreadCount || 0) +
    crews.reduce((sum, c) => sum + c.unreadCount, 0) +
    teamMembers.reduce((sum, m) => sum + m.unreadCount, 0);
  const totalCustomerUnread = conversations.filter(c => c.unread).length;

  // Create a unified sorted list of all chats with messages (team chat, crews, members)
  // sorted by most recent message time
  type ChatItem =
    | { type: 'team'; data: TeamChat }
    | { type: 'crew'; data: CrewChat }
    | { type: 'member'; data: TeamMember };

  const allChatsWithMessages: ChatItem[] = [
    // Add team chat if it has messages
    ...(teamChat?.lastMessageAt ? [{ type: 'team' as const, data: teamChat }] : []),
    // Add crew chats that have messages
    ...crews.filter(c => c.lastMessageAt).map(c => ({ type: 'crew' as const, data: c })),
    // Add team members with messages
    ...teamMembers.filter(m => m.lastMessageAt).map(m => ({ type: 'member' as const, data: m })),
  ].sort((a, b) => {
    const aTime = new Date(
      a.type === 'team' ? a.data.lastMessageAt || '' :
      a.type === 'crew' ? a.data.lastMessageAt || '' :
      a.data.lastMessageAt || ''
    ).getTime();
    const bTime = new Date(
      b.type === 'team' ? b.data.lastMessageAt || '' :
      b.type === 'crew' ? b.data.lastMessageAt || '' :
      b.data.lastMessageAt || ''
    ).getTime();
    return bTime - aTime; // Most recent first
  });

  // Chats without messages (for "Start a conversation" section)
  const chatsWithoutMessages: ChatItem[] = [
    // Team chat without messages
    ...(teamChat && !teamChat.lastMessageAt ? [{ type: 'team' as const, data: teamChat }] : []),
    // Crew chats without messages
    ...crews.filter(c => !c.lastMessageAt).map(c => ({ type: 'crew' as const, data: c })),
    // Team members without messages
    ...teamMembers.filter(m => !m.lastMessageAt).map(m => ({ type: 'member' as const, data: m })),
  ];

  const hasSelection = activeTab === 'team'
    ? selectedTeamChat !== null
    : selectedConversation !== null;

  const currentMessages = activeTab === 'team' ? teamMessages : customerMessages;

  // Check if current chat is a group chat (team or crew)
  const isGroupChat = selectedTeamChat === 'team' || selectedTeamChat?.startsWith('crew-');

  // Check if message should show avatar/name (first in group or different sender or >5 min gap)
  const shouldShowSenderInfo = (messages: Message[], index: number) => {
    if (index === 0) return true;
    const current = messages[index];
    const prev = messages[index - 1];

    // Different sender
    if (current.senderUserId !== prev.senderUserId) return true;

    // More than 5 minutes gap
    const currentTime = new Date(current.timestamp || current.createdAt || '').getTime();
    const prevTime = new Date(prev.timestamp || prev.createdAt || '').getTime();
    if (currentTime - prevTime > 5 * 60 * 1000) return true;

    return false;
  };

  // Get current chat info for header
  const getCurrentChatInfo = () => {
    if (selectedTeamChat === 'team') {
      return { name: 'Team Chat', subtitle: `${teamMembers.length + 1} members`, isGroup: true };
    }
    if (selectedTeamChat?.startsWith('crew-')) {
      const crew = crews.find(c => c.id === selectedTeamChat);
      return { name: crew?.name || 'Crew Chat', subtitle: `${crew?.memberCount || 0} members`, isGroup: true, color: crew?.color };
    }
    const member = teamMembers.find(m => m.id === selectedTeamChat);
    return { name: member?.name || '', subtitle: member?.role || '', isGroup: false, avatar: member?.avatar };
  };

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
                  setSelectedTeamChat(null);
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

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={previewImage}
            alt="Full size"
            className="max-h-full max-w-full rounded-2xl border border-[#2A2A2A] object-contain"
          />
        </div>
      )}
          </div>
        )}

        {/* Conversation List or Chat View */}
        {!hasSelection ? (
          // Conversation List
          <div className="flex-1 overflow-y-auto pb-20">
            {activeTab === 'team' ? (
              <>
                {/* All chats sorted by most recent message */}
                {allChatsWithMessages.map((item) => {
                  if (item.type === 'team') {
                    const chat = item.data;
                    return (
                      <button
                        key="team-chat"
                        onClick={() => handleSelectTeamChat('team')}
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
                            {chat.lastMessage || 'Everyone'}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <span
                            className="px-2 py-1 text-xs rounded-full text-black font-medium"
                            style={{ backgroundColor: LIME_GREEN }}
                          >
                            {chat.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  }
                  if (item.type === 'crew') {
                    const crew = item.data;
                    return (
                      <button
                        key={`crew-${crew.id}`}
                        onClick={() => handleSelectTeamChat(crew.id)}
                        className="w-full p-4 flex items-center gap-3 border-b border-[#2A2A2A] hover:bg-[#1F1F1F] active:bg-[#2A2A2A] transition-colors"
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: crew.color }}
                        >
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white truncate">{crew.name}</p>
                            <span className="text-xs text-zinc-500">{crew.memberCount} members</span>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">
                            {crew.lastMessage || 'Crew chat'}
                          </p>
                        </div>
                        {crew.unreadCount > 0 && (
                          <span
                            className="px-2 py-1 text-xs rounded-full text-black font-medium"
                            style={{ backgroundColor: LIME_GREEN }}
                          >
                            {crew.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  }
                  // member type
                  const member = item.data;
                  return (
                    <button
                      key={`member-${member.id}`}
                      onClick={() => handleSelectTeamChat(member.id)}
                      className="w-full p-4 flex items-center gap-3 border-b border-[#2A2A2A] hover:bg-[#1F1F1F] active:bg-[#2A2A2A] transition-colors"
                    >
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {getInitials(member.name)}
                        </div>
                      )}
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
                  );
                })}

                {/* Chats without messages yet (Start a conversation section) */}
                {chatsWithoutMessages.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-[#0A0A0A] border-b border-[#2A2A2A]">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Start a conversation</p>
                    </div>
                    {chatsWithoutMessages.map((item) => {
                      if (item.type === 'team') {
                        const chat = item.data;
                        return (
                          <button
                            key="team-chat-new"
                            onClick={() => handleSelectTeamChat('team')}
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
                              <p className="text-xs text-zinc-500">Broadcast to everyone</p>
                            </div>
                            {chat.unreadCount > 0 && (
                              <span
                                className="px-2 py-1 text-xs rounded-full text-black font-medium"
                                style={{ backgroundColor: LIME_GREEN }}
                              >
                                {chat.unreadCount}
                              </span>
                            )}
                          </button>
                        );
                      }
                      if (item.type === 'crew') {
                        const crew = item.data;
                        return (
                          <button
                            key={`crew-new-${crew.id}`}
                            onClick={() => handleSelectTeamChat(crew.id)}
                            className="w-full p-4 flex items-center gap-3 border-b border-[#2A2A2A] hover:bg-[#1F1F1F] active:bg-[#2A2A2A] transition-colors"
                          >
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: crew.color }}
                            >
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-white truncate">{crew.name}</p>
                                <span className="text-xs text-zinc-500">{crew.memberCount} members</span>
                              </div>
                              <p className="text-xs text-zinc-500">Crew chat</p>
                            </div>
                          </button>
                        );
                      }
                      // member type
                      const member = item.data;
                      return (
                        <button
                          key={`member-new-${member.id}`}
                          onClick={() => handleSelectTeamChat(member.id)}
                          className="w-full p-4 flex items-center gap-3 border-b border-[#2A2A2A] hover:bg-[#1F1F1F] active:bg-[#2A2A2A] transition-colors"
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {getInitials(member.name)}
                            </div>
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white truncate">{member.name}</p>
                              <span className="text-zinc-500">{getRoleIcon(member.role)}</span>
                            </div>
                            <p className="text-xs text-zinc-500">{member.role === 'owner' ? 'Owner' : member.role === 'office' ? 'Office' : 'Field Worker'}</p>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}

                {teamMembers.length === 0 && crews.length === 0 && !teamChat && (
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
                    if (activeTab === 'team') setSelectedTeamChat(null);
                    else setSelectedConversation(null);
                  }}
                  className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {activeTab === 'team' && selectedTeamChat && (() => {
                  const chatInfo = getCurrentChatInfo();
                  return (
                    <>
                      {chatInfo.isGroup ? (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: chatInfo.color || LIME_GREEN }}
                        >
                          <Users className="w-5 h-5" style={{ color: chatInfo.color ? 'white' : 'black' }} />
                        </div>
                      ) : chatInfo.avatar ? (
                        <img
                          src={chatInfo.avatar}
                          alt={chatInfo.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {getInitials(chatInfo.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-white truncate">{chatInfo.name}</h2>
                        <p className="text-xs text-zinc-500 capitalize">{chatInfo.subtitle}</p>
                      </div>
                      {chatInfo.isGroup && (
                        <button
                          onClick={() => fetchGroupInfo(selectedTeamChat!)}
                          className="p-2 text-zinc-400 hover:text-white transition-colors"
                          disabled={loadingGroupInfo}
                        >
                          {loadingGroupInfo ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Info className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </>
                  );
                })()}

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
            <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <MessageSquare className="h-12 w-12 text-zinc-600 mb-3" />
                  <p className="text-zinc-500">No messages yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                currentMessages.map((message, index) => {
                  const isOwn = activeTab === 'team'
                    ? message.senderUserId === userId
                    : message.senderType === 'worker';
                  const isSystem = message.senderType === 'system';
                  const showSenderInfo = activeTab === 'team' ? shouldShowSenderInfo(currentMessages, index) : true;

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center py-2">
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
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showSenderInfo ? 'mt-3' : 'mt-0.5'}`}
                    >
                      {/* Avatar for non-own messages in team chat - only show on first of group */}
                      {activeTab === 'team' && !isOwn && (
                        <div className="flex-shrink-0 mr-2 w-8">
                          {showSenderInfo ? (
                            message.senderAvatar ? (
                              <img
                                src={message.senderAvatar}
                                alt={message.senderName || ''}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white text-xs font-semibold">
                                {getInitials(message.senderName || '')}
                              </div>
                            )
                          ) : null}
                        </div>
                      )}

                      <div className={`max-w-[75%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                        {/* Sender name for team messages - only on first of group */}
                        {activeTab === 'team' && !isOwn && message.senderName && showSenderInfo && (
                          <span className="text-xs text-zinc-500 px-1">{message.senderName}</span>
                        )}

                        {(() => {
                          if (!message.mediaUrl) return null;
                          return (
                            <img
                              src={message.mediaUrl}
                              alt="Attachment"
                              className="rounded-2xl border border-[#2A2A2A] max-w-[280px] w-full object-cover cursor-pointer hover:opacity-90 transition mb-2"
                              onClick={() => setPreviewImage(message.mediaUrl || null)}
                            />
                          );
                        })()}

                        {message.content && (
                          <div
                            className={`px-4 py-2.5 rounded-2xl ${
                              isOwn
                                ? 'rounded-br-sm text-black'
                                : 'bg-[#2A2A2A] text-white rounded-bl-sm'
                            }`}
                            style={isOwn ? { backgroundColor: LIME_GREEN } : undefined}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                        )}
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
              <div className="p-4 pt-2 space-y-3">
                {activeTab === 'team' && teamAttachmentPreview && (
                  <div className="border border-[#2A2A2A] rounded-2xl bg-[#0A0A0A] p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={teamAttachmentPreview}
                        alt="Preview"
                        className="max-h-48 rounded-xl border border-[#2A2A2A] object-cover"
                      />
                      <button
                        onClick={() => setTeamAttachment(null)}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {teamAttachment?.name && (
                      <p className="text-xs text-zinc-500 mt-2 truncate">{teamAttachment.name}</p>
                    )}
                  </div>
                )}

                {activeTab === 'customers' && customerAttachmentPreview && (
                  <div className="border border-[#2A2A2A] rounded-2xl bg-[#0A0A0A] p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={customerAttachmentPreview}
                        alt="Preview"
                        className="max-h-48 rounded-xl border border-[#2A2A2A] object-cover"
                      />
                      <button
                        onClick={() => setCustomerAttachment(null)}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {customerAttachment?.name && (
                      <p className="text-xs text-zinc-500 mt-2 truncate">{customerAttachment.name}</p>
                    )}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {activeTab === 'team' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => attachmentInputRef.current?.click()}
                        className="p-2 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="p-2 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleTeamAttachmentChange}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleTeamAttachmentChange}
                      />
                    </div>
                  )}

                  {activeTab === 'customers' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => customerAttachmentInputRef.current?.click()}
                        className="p-2 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => customerCameraInputRef.current?.click()}
                        className="p-2 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                      <input
                        ref={customerAttachmentInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleCustomerAttachmentChange}
                      />
                      <input
                        ref={customerCameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleCustomerAttachmentChange}
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={
                      (activeTab === 'team' && teamAttachment) || (activeTab === 'customers' && customerAttachment)
                        ? 'Add a caption...'
                        : 'Type a message...'
                    }
                    className="flex-1 px-4 py-2.5 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    style={{
                      borderColor:
                        (activeTab === 'team' && (teamAttachment || messageText)) ||
                        (activeTab === 'customers' && (customerAttachment || messageText))
                          ? LIME_GREEN
                          : '#2A2A2A',
                    }}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={
                      sending ||
                      (activeTab === 'team'
                        ? !messageText.trim() && !teamAttachment
                        : !messageText.trim() && !customerAttachment)
                    }
                    className="p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{
                      backgroundColor:
                        !sending &&
                        (activeTab === 'team'
                          ? messageText.trim() || teamAttachment
                          : messageText.trim() || customerAttachment)
                          ? LIME_GREEN
                          : '#2A2A2A',
                      color:
                        !sending &&
                        (activeTab === 'team'
                          ? messageText.trim() || teamAttachment
                          : messageText.trim() || customerAttachment)
                          ? 'black'
                          : '#6B7280',
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

        {/* Group Info Modal */}
        {showGroupInfo && groupInfo && (
          <div
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowGroupInfo(false)}
          >
            <div
              className="bg-[#1F1F1F] w-full max-w-sm rounded-2xl border border-[#2A2A2A] shadow-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: groupInfo.color || LIME_GREEN }}
                  >
                    <Users className="w-5 h-5" style={{ color: groupInfo.color ? 'white' : 'black' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{groupInfo.name}</h2>
                    <p className="text-xs text-zinc-500">{groupInfo.memberCount} members</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGroupInfo(false)}
                  className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Member List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {groupInfo.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-[#2A2A2A] rounded-xl"
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#3A3A3A] flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">{member.name}</p>
                        {member.isLead && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                            <Crown className="w-3 h-3" />
                            Lead
                          </span>
                        )}
                        {member.isCurrentUser && (
                          <span className="px-1.5 py-0.5 bg-zinc-500/20 text-zinc-400 rounded text-xs">
                            You
                          </span>
                        )}
                      </div>
                      <p className={`text-xs capitalize ${getRoleBadgeColor(member.role).replace('bg-', 'text-').replace('/20', '')}`}>
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              {groupInfo.createdAt && (
                <div className="p-4 border-t border-[#2A2A2A]">
                  <p className="text-xs text-zinc-500 text-center">
                    Created {new Date(groupInfo.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
