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
  Smile,
  ChevronDown,
  CheckCheck,
  Clock,
  Calendar,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'provider' | 'customer' | 'system';
  content: string;
  timestamp: string;
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
  const [loading, setLoading] = useState(true);

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'renoa' | 'own'>('all');
  const [messageText, setMessageText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchConversations(id);
  }, [router]);

  // Real-time polling for new messages
  useEffect(() => {
    if (!providerId) return;

    const interval = setInterval(() => {
      fetchConversations(providerId);
      if (selectedConversation) {
        fetchMessages(selectedConversation.customerId);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [providerId, selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/messages?providerId=${id}`);
      const data = await res.json();

      if (data.conversations) {
        setConversations(data.conversations);
        setFilteredConversations(data.conversations);
      }
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (customerId: string) => {
    try {
      const res = await fetch(`/api/provider/messages/${customerId}?providerId=${providerId}`);
      const data = await res.json();

      if (data.messages) {
        setMessages(data.messages);
        // Messages are automatically marked as read by the API
      }
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.customerId);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !photoFile) return;
    if (!selectedConversation) return;

    try {
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
      setMessages(prev => [...prev, tempMessage]);

      // TODO: Photo upload will be implemented when we add file storage
      if (photoFile) {
        toast.error('Photo upload coming soon!');
        setPhotoFile(null);
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
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id ? data.message : msg
      ));

      toast.success('Message sent!');
      setMessageText('');
      setPhotoFile(null);
      fetchConversations(providerId); // Refresh to update "last message" in list
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
      toast.error('Failed to send message');
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

  // Apply filters
  useEffect(() => {
    let filtered = conversations;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
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
            <p className="text-sm text-zinc-400 mt-1">Communicate with your customers</p>
          </div>
        </div>

        {/* Split View Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Conversation List */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-zinc-800 flex-col bg-zinc-900/30`}>
            {/* Search Bar */}
            <div className="p-4 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-3">
                {(['all', 'unread', 'renoa', 'own'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      filter === f
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'renoa' ? 'Renoa' : 'Own'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
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
                      className={`w-full p-4 text-left transition-colors hover:bg-zinc-800/50 ${
                        selectedConversation?.id === conv.id ? 'bg-zinc-800/70' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold">
                            {getInitials(conv.customerName)}
                          </div>
                          {conv.unread && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-zinc-900"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-zinc-100 truncate">{conv.customerName}</h3>
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
                            {conv.lastMessage}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Main Area - Conversation View */}
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-zinc-950`}>
            {selectedConversation ? (
              <>
                {/* Conversation Header - Sticky */}
                <div className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center justify-between p-3 md:p-4">
                    {/* Left: Back button (mobile) + Customer info */}
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      {/* Back button for mobile */}
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <ChevronDown className="h-5 w-5 rotate-90" />
                      </button>

                      <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm md:text-base font-semibold">
                        {getInitials(selectedConversation.customerName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-sm md:text-base text-zinc-100 truncate">{selectedConversation.customerName}</h2>
                        {selectedConversation.jobReference && (
                          <p className="text-xs text-zinc-500 truncate">{selectedConversation.jobReference}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Actions */}
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
                      {selectedConversation.jobReference && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="hidden md:flex border-zinc-700 hover:bg-zinc-800"
                          onClick={() => router.push(`/provider/calendar`)}
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          View Job
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6">
                  <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
                    {messages.map((message) => {
                      const isProvider = message.senderType === 'provider';
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
                          className={`flex ${isProvider ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isProvider ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
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
                                  isProvider
                                    ? 'bg-emerald-600 text-white rounded-br-sm'
                                    : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-1 px-2">
                              <span className="text-xs text-zinc-500">{formatMessageTime(message.timestamp)}</span>
                              {isProvider && message.read && (
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

                {/* Message Input - Sticky at bottom */}
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
                    {/* Left Actions */}
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

                    {/* Message Input */}
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                    />

                    {/* Send Button */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() && !photoFile}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-zinc-600 mt-2 hidden md:block">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : (
              // No Conversation Selected
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">Select a conversation</h3>
                  <p className="text-sm text-zinc-500">
                    Choose a conversation from the list to start messaging
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
