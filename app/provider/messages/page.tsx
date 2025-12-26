'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import WorkerProfileModal from '@/components/provider/WorkerProfileModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Phone,
  User,
  Briefcase,
  Send,
  Paperclip,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  CheckCheck,
  Clock,
  X,
  Users,
  MessageSquare,
  Building2,
  Wrench,
  ChevronLeft,
  Info,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { PageLoadingSkeleton } from '@/components/ui/loading-skeleton';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { validateAndCompressImage } from '@/lib/image-upload';

type MessageTab = 'team' | 'customers';

interface Message {
  id: string;
  conversationId?: string;
  senderId?: string;
  senderType?: 'provider' | 'customer' | 'system';
  senderUserId?: string;
  senderName?: string;
  senderRole?: string;
  senderAvatar?: string | null;
  content: string;
  timestamp?: string;
  createdAt?: string;
  read: boolean;
  readBy?: string[];
  crewId?: string | null;
  photoUrl?: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  thumbnailUrl?: string | null;
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

interface GroupInfo {
  type: 'team' | 'crew';
  name: string;
  color?: string;
  memberCount: number;
  createdAt?: string;
  members: GroupMember[];
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

type SelectedChat = {
  type: 'team' | 'crew' | 'member';
  id: string;
  crewId?: string;
};

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
  const [crewChats, setCrewChats] = useState<CrewChat[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamChat, setSelectedTeamChat] = useState<SelectedChat | null>(null);
  const [teamMessages, setTeamMessages] = useState<Message[]>([]);

  // Group info modal
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loadingGroupInfo, setLoadingGroupInfo] = useState(false);

  // Worker profile modal
  const [profileWorkerId, setProfileWorkerId] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'renoa' | 'own'>('all');
  const [messageText, setMessageText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [teamAttachment, setTeamAttachment] = useState<File | null>(null);
  const [teamAttachmentPreview, setTeamAttachmentPreview] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customerCameraInputRef = useRef<HTMLInputElement>(null);
  const teamAttachmentInputRef = useRef<HTMLInputElement>(null);
  const teamCameraInputRef = useRef<HTMLInputElement>(null);

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
    setUserId(uid || id);

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
      if (selectedTeamChat) {
        fetchTeamMessages(selectedTeamChat);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [providerId, userId, selectedConversation, selectedTeamChat]);

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
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [photoFile]);

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
      if (data.crews) {
        setCrewChats(data.crews);
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
        // Dispatch event to notify nav to refresh unread count (messages were marked as read)
        window.dispatchEvent(new CustomEvent('messagesRead'));
      }
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  const fetchTeamMessages = async (chat: SelectedChat) => {
    try {
      let url = `/api/provider/messages/team?providerId=${providerId}&userId=${userId}`;

      if (chat.type === 'crew' && chat.crewId) {
        url += `&crewId=${chat.crewId}`;
      } else if (chat.type === 'member') {
        url += `&recipientId=${chat.id}`;
      }
      // team type uses default (no recipientId, no crewId)

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

  const fetchGroupInfo = async (chat: SelectedChat) => {
    setLoadingGroupInfo(true);
    try {
      let url = `/api/provider/messages/team/members?providerId=${providerId}&userId=${userId}`;

      if (chat.type === 'crew' && chat.crewId) {
        url += `&type=crew&crewId=${chat.crewId}`;
      } else {
        url += `&type=team`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.members) {
        setGroupInfo(data);
        setShowGroupInfo(true);
      }
    } catch (error) {
      console.error('Failed to load group info:', error);
      toast.error('Failed to load group info');
    } finally {
      setLoadingGroupInfo(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Immediately mark as read in local state and dispatch event
    if (conversation.unread) {
      setConversations(prev => prev.map(c =>
        c.id === conversation.id ? { ...c, unread: false } : c
      ));
      window.dispatchEvent(new CustomEvent('messagesRead'));
    }
    fetchCustomerMessages(conversation.customerId);
  };

  const handleSelectTeamChat = (chat: SelectedChat) => {
    setSelectedTeamChat(chat);
    // Immediately mark as read in local state and dispatch event
    if (chat.type === 'team' && teamChat?.unreadCount) {
      setTeamChat(prev => prev ? { ...prev, unreadCount: 0 } : null);
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } else if (chat.type === 'crew' && chat.crewId) {
      setCrewChats(prev => prev.map(c =>
        c.crewId === chat.crewId ? { ...c, unreadCount: 0 } : c
      ));
      window.dispatchEvent(new CustomEvent('messagesRead'));
    } else if (chat.type === 'member') {
      setTeamMembers(prev => prev.map(m =>
        m.id === chat.id ? { ...m, unreadCount: 0 } : m
      ));
      window.dispatchEvent(new CustomEvent('messagesRead'));
    }
    fetchTeamMessages(chat);
  };

  const handleSendMessage = async () => {
    const trimmedMessage = messageText.trim();
    if (activeTab === 'team') {
      if (!trimmedMessage && !teamAttachment) return;
    } else if (activeTab === 'customers') {
      if (!trimmedMessage && !photoFile) return;
    }
    if (sending) return;

    setSending(true);

    try {
      if (activeTab === 'team' && selectedTeamChat) {
        if (!providerId || !userId) {
          toast.error('Missing provider info');
          setSending(false);
          return;
        }
        // Send team message
        const body: any = {
          providerId,
          userId,
          content: trimmedMessage,
        };

        if (selectedTeamChat.type === 'crew' && selectedTeamChat.crewId) {
          body.crewId = selectedTeamChat.crewId;
        } else if (selectedTeamChat.type === 'member') {
          body.recipientUserId = selectedTeamChat.id;
        }
        // team type sends with no recipientUserId, no crewId

        if (teamAttachment) {
          const formData = new FormData();
          formData.append('providerId', providerId);
          formData.append('userId', userId);
          formData.append('file', teamAttachment);

          const uploadRes = await fetch('/api/provider/messages/team/upload', {
            method: 'POST',
            body: formData,
          });
          const uploadData = await uploadRes.json();

          if (!uploadRes.ok) {
            throw new Error(uploadData.error || 'Failed to upload image');
          }

          body.mediaUrl = uploadData.url;
          body.thumbnailUrl = uploadData.thumbnailUrl;
          body.mediaType = 'image';
        }

        const res = await fetch('/api/provider/messages/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('Failed to send message');

        const data = await res.json();

        // Optimistically add message to UI
        if (data.message) {
          setTeamMessages(prev => [...prev, data.message]);
        }

        setMessageText('');
        setTeamAttachment(null);
        fetchTeamConversations(providerId, userId);
      } else {
        // Send customer message
        if (!selectedConversation) return;

        // Handle photo upload if present
        let mediaUrl: string | undefined;
        let mediaType: string | undefined;

        if (photoFile) {
          const formData = new FormData();
          formData.append('providerId', providerId);
          formData.append('customerId', selectedConversation.customerId);
          formData.append('file', photoFile);

          const uploadRes = await fetch('/api/provider/messages/upload', {
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
          id: `temp-${Date.now()}`,
          conversationId: selectedConversation.id,
          senderId: providerId,
          senderType: 'provider',
          content: trimmedMessage,
          mediaUrl,
          mediaType,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setCustomerMessages(prev => [...prev, tempMessage]);

        const res = await fetch('/api/provider/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            customerId: selectedConversation.customerId,
            content: trimmedMessage,
            type: 'sms',
            mediaUrl,
            mediaType,
          }),
        });

        if (!res.ok) throw new Error('Failed to send message');

        const data = await res.json();

        // Replace temp message with actual message from server
        setCustomerMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id ? data.message : msg
        ));

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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const { file, error } = await validateAndCompressImage(e.target.files[0]);
      if (error || !file) {
        toast.error(error || 'Failed to process image');
      } else {
        setPhotoFile(file);
      }
    }
    e.target.value = '';
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

  const formatDateDivider = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'office':
        return 'Office';
      case 'field':
        return 'Field';
      default:
        return role;
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

  // Split team members into active (has messages) and pinned (no messages)
  const activeTeamMembers = teamMembers.filter(m => m.lastMessageAt);
  const pinnedTeamMembers = teamMembers.filter(m => !m.lastMessageAt);

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
    ...crewChats.filter(c => c.lastMessageAt).map(c => ({ type: 'crew' as const, data: c })),
    // Add active team members
    ...activeTeamMembers.map(m => ({ type: 'member' as const, data: m })),
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
    ...crewChats.filter(c => !c.lastMessageAt).map(c => ({ type: 'crew' as const, data: c })),
    // Team members without messages
    ...pinnedTeamMembers.map(m => ({ type: 'member' as const, data: m })),
  ];

  const totalCrewUnread = crewChats.reduce((sum, c) => sum + c.unreadCount, 0);
  const totalTeamUnread = (teamChat?.unreadCount || 0) + totalCrewUnread + teamMembers.reduce((sum, m) => sum + m.unreadCount, 0);
  const totalCustomerUnread = conversations.filter(c => c.unread).length;

  const hasSelection = activeTab === 'team'
    ? selectedTeamChat !== null
    : selectedConversation !== null;

  const currentMessages = activeTab === 'team' ? teamMessages : customerMessages;

  // Helper to check if current chat is a group (team or crew)
  const isGroupChat = selectedTeamChat?.type === 'team' || selectedTeamChat?.type === 'crew';

  // Check if message should show avatar/name (first in group or different sender or >5 min gap)
  const shouldShowSenderInfo = (messages: Message[], index: number, isTeamTab: boolean) => {
    if (index === 0) return true;
    const current = messages[index];
    const prev = messages[index - 1];

    // Different sender
    const currentSenderId = isTeamTab ? current.senderUserId : current.senderType;
    const prevSenderId = isTeamTab ? prev.senderUserId : prev.senderType;
    if (currentSenderId !== prevSenderId) return true;

    // More than 5 minutes gap
    const currentTime = new Date(current.timestamp || current.createdAt || '').getTime();
    const prevTime = new Date(prev.timestamp || prev.createdAt || '').getTime();
    if (currentTime - prevTime > 5 * 60 * 1000) return true;

    return false;
  };

  // Check if we need a date divider before this message
  const shouldShowDateDivider = (messages: Message[], index: number) => {
    if (index === 0) return true;
    const current = new Date(messages[index].timestamp || messages[index].createdAt || '');
    const prev = new Date(messages[index - 1].timestamp || messages[index - 1].createdAt || '');
    return !isSameDay(current, prev);
  };

  // Get current chat name and info for header
  const getCurrentChatInfo = () => {
    if (!selectedTeamChat) return null;

    if (selectedTeamChat.type === 'team') {
      return { name: 'Team Chat', memberCount: teamMembers.length + 1 };
    }
    if (selectedTeamChat.type === 'crew') {
      const crew = crewChats.find(c => c.crewId === selectedTeamChat.crewId);
      return crew ? { name: crew.name, color: crew.color, memberCount: crew.memberCount } : null;
    }
    if (selectedTeamChat.type === 'member') {
      const member = teamMembers.find(m => m.id === selectedTeamChat.id);
      return member ? { name: member.name, role: member.role, avatar: member.avatar } : null;
    }
    return null;
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <PageLoadingSkeleton showStats={false} tableRows={10} />

        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImage}
              alt="Full size preview"
              className="max-h-full max-w-full rounded-2xl border border-zinc-800 object-contain"
            />
          </div>
        )}
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
                  setSelectedTeamChat(null);
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
                  {/* All chats sorted by most recent message */}
                  {allChatsWithMessages.map((item) => {
                    if (item.type === 'team') {
                      const chat = item.data;
                      return (
                        <button
                          key="team-chat"
                          onClick={() => handleSelectTeamChat({ type: 'team', id: 'team' })}
                          className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                            selectedTeamChat?.type === 'team' ? 'bg-zinc-800' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-white">Team Chat</p>
                            <p className="text-xs text-zinc-400 truncate">
                              {chat.lastMessage || 'Everyone'}
                            </p>
                          </div>
                          {chat.unreadCount > 0 && (
                            <Badge className="bg-emerald-500 text-white">{chat.unreadCount}</Badge>
                          )}
                        </button>
                      );
                    }
                    if (item.type === 'crew') {
                      const crew = item.data;
                      return (
                        <button
                          key={`crew-${crew.id}`}
                          onClick={() => handleSelectTeamChat({ type: 'crew', id: crew.id, crewId: crew.crewId })}
                          className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                            selectedTeamChat?.crewId === crew.crewId ? 'bg-zinc-800' : ''
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: crew.color || '#6b7280' }}
                          >
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{crew.name}</p>
                              <span className="text-xs text-zinc-500">{crew.memberCount}</span>
                            </div>
                            <p className="text-xs text-zinc-400 truncate">
                              {crew.lastMessage || 'Crew chat'}
                            </p>
                          </div>
                          {crew.unreadCount > 0 && (
                            <Badge className="bg-emerald-500 text-white">{crew.unreadCount}</Badge>
                          )}
                        </button>
                      );
                    }
                    // member type
                    const member = item.data;
                    return (
                      <button
                        key={`member-${member.id}`}
                        onClick={() => handleSelectTeamChat({ type: 'member', id: member.id })}
                        className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                          selectedTeamChat?.type === 'member' && selectedTeamChat?.id === member.id ? 'bg-zinc-800' : ''
                        }`}
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                            {getInitials(member.name)}
                          </div>
                        )}
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
                    );
                  })}

                  {/* Chats without messages yet (Start a conversation section) */}
                  {chatsWithoutMessages.length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-zinc-900/50 border-b border-zinc-800">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Start a conversation</p>
                      </div>
                      {chatsWithoutMessages.map((item) => {
                        if (item.type === 'team') {
                          const chat = item.data;
                          return (
                            <button
                              key="team-chat-new"
                              onClick={() => handleSelectTeamChat({ type: 'team', id: 'team' })}
                              className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                                selectedTeamChat?.type === 'team' ? 'bg-zinc-800' : ''
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-medium text-white">Team Chat</p>
                                <p className="text-xs text-zinc-500">Broadcast to everyone</p>
                              </div>
                              {chat.unreadCount > 0 && (
                                <Badge className="bg-emerald-500 text-white">{chat.unreadCount}</Badge>
                              )}
                            </button>
                          );
                        }
                        if (item.type === 'crew') {
                          const crew = item.data;
                          return (
                            <button
                              key={`crew-new-${crew.id}`}
                              onClick={() => handleSelectTeamChat({ type: 'crew', id: crew.id, crewId: crew.crewId })}
                              className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                                selectedTeamChat?.crewId === crew.crewId ? 'bg-zinc-800' : ''
                              }`}
                            >
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: crew.color || '#6b7280' }}
                              >
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-white truncate">{crew.name}</p>
                                  <span className="text-xs text-zinc-500">{crew.memberCount}</span>
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
                            onClick={() => handleSelectTeamChat({ type: 'member', id: member.id })}
                            className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                              selectedTeamChat?.type === 'member' && selectedTeamChat?.id === member.id ? 'bg-zinc-800' : ''
                            }`}
                          >
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                                {getInitials(member.name)}
                              </div>
                            )}
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white truncate">{member.name}</p>
                                <span className="text-zinc-500">{getRoleIcon(member.role)}</span>
                              </div>
                              <p className="text-xs text-zinc-500">{getRoleLabel(member.role)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {teamMembers.length === 0 && crewChats.length === 0 && !teamChat && (
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
                          if (activeTab === 'team') setSelectedTeamChat(null);
                          else setSelectedConversation(null);
                        }}
                        className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {activeTab === 'team' && selectedTeamChat?.type === 'team' && (
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

                      {activeTab === 'team' && selectedTeamChat?.type === 'crew' && (() => {
                        const crew = crewChats.find(c => c.crewId === selectedTeamChat.crewId);
                        return crew ? (
                          <>
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: crew.color || '#6b7280' }}
                            >
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{crew.name}</p>
                              <p className="text-xs text-zinc-400">{crew.memberCount} members</p>
                            </div>
                          </>
                        ) : null;
                      })()}

                      {activeTab === 'team' && selectedTeamChat?.type === 'member' && (() => {
                        const member = teamMembers.find(m => m.id === selectedTeamChat.id);
                        return member ? (
                          <>
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                                {getInitials(member.name)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white">{member.name}</p>
                              <p className="text-xs text-zinc-400 capitalize">{member.role}</p>
                            </div>
                          </>
                        ) : null;
                      })()}

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

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      {/* Group info button for team/crew chats */}
                      {activeTab === 'team' && isGroupChat && selectedTeamChat && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-800 px-2 md:px-3"
                          onClick={() => fetchGroupInfo(selectedTeamChat)}
                          disabled={loadingGroupInfo}
                        >
                          <Info className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Info</span>
                        </Button>
                      )}

                      {activeTab === 'customers' && selectedConversation && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  <div className="space-y-0.5">
                    {currentMessages.map((message, index) => {
                      const isOwn = activeTab === 'team'
                        ? message.senderUserId === userId
                        : message.senderType === 'provider';
                      const isSystem = message.senderType === 'system';
                      const showSenderInfo = shouldShowSenderInfo(currentMessages, index, activeTab === 'team');
                      const showDateDivider = shouldShowDateDivider(currentMessages, index);

                      if (isSystem) {
                        return (
                          <div key={message.id} className="flex justify-center py-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-full text-xs text-zinc-400">
                              <Clock className="h-3 w-3" />
                              <span>{message.content}</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={message.id}>
                          {/* Date Divider */}
                          {showDateDivider && (
                            <div className="flex items-center gap-3 py-4">
                              <div className="flex-1 h-px bg-zinc-800"></div>
                              <span className="text-xs text-zinc-500 font-medium">
                                {formatDateDivider(message.timestamp || message.createdAt || '')}
                              </span>
                              <div className="flex-1 h-px bg-zinc-800"></div>
                            </div>
                          )}

                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showSenderInfo ? 'mt-3' : 'mt-0.5'}`}>
                            <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* Avatar for team messages - only show on first message of group */}
                              {activeTab === 'team' && !isOwn && (
                                <div className="flex-shrink-0 w-8">
                                  {showSenderInfo ? (
                                    message.senderAvatar ? (
                                      <img
                                        src={message.senderAvatar}
                                        alt={message.senderName || ''}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xs font-medium">
                                        {message.senderName ? getInitials(message.senderName) : '?'}
                                      </div>
                                    )
                                  ) : null}
                                </div>
                              )}

                              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                {/* Sender name for team messages - only on first of group */}
                                {activeTab === 'team' && !isOwn && message.senderName && showSenderInfo && (
                                  <span className="text-xs text-zinc-500 px-1 mb-1">{message.senderName}</span>
                                )}

                                {(() => {
                                  const mediaUrl = message.mediaUrl || message.photoUrl;
                                  if (!mediaUrl) return null;
                                  return (
                                    <img
                                      src={mediaUrl}
                                      alt="Attachment"
                                      className="rounded-xl border border-zinc-700 max-w-[300px] w-full object-cover cursor-pointer hover:opacity-90 transition-opacity mb-2"
                                      onClick={() => setPreviewImage(mediaUrl)}
                                    />
                                  );
                                })()}
                                {message.content && (
                                  <div
                                    className={`px-3 py-2 rounded-2xl ${
                                      isOwn
                                        ? 'bg-emerald-600 text-white rounded-br-md'
                                        : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                  </div>
                                )}
                                {/* Only show timestamp on last message of group or if it's the only message */}
                                {(index === currentMessages.length - 1 || shouldShowSenderInfo(currentMessages, index + 1, activeTab === 'team')) && (
                                  <div className="flex items-center gap-1 px-1 mt-1">
                                    <span className="text-xs text-zinc-500">
                                      {formatMessageTime(message.timestamp || message.createdAt || '')}
                                    </span>
                                    {isOwn && message.read && (
                                      <CheckCheck className="h-3 w-3 text-blue-400" />
                                    )}
                                  </div>
                                )}
                              </div>
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
                  {activeTab === 'team' && teamAttachmentPreview && (
                    <div className="mb-3 border border-emerald-600/50 bg-zinc-900/70 rounded-xl p-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={teamAttachmentPreview}
                          alt="Preview"
                          className="max-h-48 rounded-lg border border-zinc-800 object-cover"
                        />
                        <button
                          onClick={() => setTeamAttachment(null)}
                          className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                          aria-label="Remove attachment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {teamAttachment?.name && (
                        <p className="text-xs text-zinc-500 mt-2 truncate">{teamAttachment.name}</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'customers' && photoPreview && (
                    <div className="mb-3 border border-emerald-600/50 bg-zinc-900/70 rounded-xl p-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="max-h-48 rounded-lg border border-zinc-800 object-cover"
                        />
                        <button
                          onClick={() => setPhotoFile(null)}
                          className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                          aria-label="Remove photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {photoFile?.name && (
                        <p className="text-xs text-zinc-500 mt-2 truncate">{photoFile.name}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-end gap-2 md:gap-3">
                    {activeTab === 'team' ? (
                      <div className="flex gap-1 md:gap-2">
                        <button
                          onClick={() => teamAttachmentInputRef.current?.click()}
                          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                          title="Attach image"
                        >
                          <Paperclip className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => teamCameraInputRef.current?.click()}
                          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                          title="Open camera"
                        >
                          <Camera className="h-5 w-5" />
                        </button>
                        <input
                          ref={teamAttachmentInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleTeamAttachmentChange}
                        />
                        <input
                          ref={teamCameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleTeamAttachmentChange}
                        />
                      </div>
                    ) : activeTab === 'customers' ? (
                      <div className="flex gap-1 md:gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                          title="Attach photo"
                        >
                          <Paperclip className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => customerCameraInputRef.current?.click()}
                          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                          title="Open camera"
                        >
                          <Camera className="h-5 w-5" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        <input
                          ref={customerCameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
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
                    ) : null}

                    {/* Message Input */}
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={
                        (activeTab === 'team' && teamAttachment) || (activeTab === 'customers' && photoFile)
                          ? 'Add a caption...'
                          : 'Type a message...'
                      }
                      className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />

                    {/* Send Button */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        sending ||
                        (activeTab === 'team'
                          ? !messageText.trim() && !teamAttachment
                          : !messageText.trim() && !photoFile)
                      }
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

        {/* Group Info Modal */}
        {showGroupInfo && groupInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: groupInfo.color || '#10b981' }}
                  >
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{groupInfo.name}</h3>
                    <p className="text-xs text-zinc-400">{groupInfo.memberCount} members</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGroupInfo(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Members List */}
              <div className="overflow-y-auto max-h-[60vh]">
                <div className="p-2">
                  <p className="text-xs font-medium text-zinc-500 px-3 py-2">Members</p>
                  {groupInfo.members.map((member) => {
                    // Field workers are clickable to view profile
                    const isClickable = member.role === 'field' && !member.isCurrentUser;

                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          if (isClickable) {
                            setProfileWorkerId(member.id);
                          }
                        }}
                        disabled={!isClickable}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isClickable
                            ? 'hover:bg-zinc-800/50 cursor-pointer'
                            : 'cursor-default'
                        }`}
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium">
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white truncate">{member.name}</p>
                            {member.isLead && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                                <Crown className="w-3 h-3" />
                                Lead
                              </span>
                            )}
                            {member.isCurrentUser && (
                              <span className="text-xs text-zinc-500">(You)</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">{getRoleLabel(member.role)}</p>
                        </div>
                        <span className="text-zinc-500">{getRoleIcon(member.role)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Worker Profile Modal */}
        <WorkerProfileModal
          workerId={profileWorkerId}
          isOpen={!!profileWorkerId}
          onClose={() => setProfileWorkerId(null)}
          onUpdate={() => {
            // Refresh team conversations after update
            if (providerId && userId) {
              fetch(`/api/provider/messages/team/conversations?providerId=${providerId}&userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                  if (data.conversations) setTeamMembers(data.conversations);
                })
                .catch(console.error);
            }
          }}
        />
      </div>
    </ProviderLayout>
  );
}
