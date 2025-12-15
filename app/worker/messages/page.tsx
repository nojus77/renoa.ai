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
} from 'lucide-react';
import { toast } from 'sonner';

// Renoa Design System Colors
const LIME_GREEN = '#C4F542';

interface Message {
  id: string;
  customerId: string;
  customerName: string;
  senderId: string;
  senderType: 'worker' | 'customer' | 'system';
  content: string;
  timestamp: string;
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

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

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
      if (selectedConversation) {
        fetchMessages(selectedConversation.customerId);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [userId, selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const fetchMessages = async (customerId: string) => {
    try {
      const res = await fetch(`/api/worker/messages/${customerId}?userId=${userId}`);
      const data = await res.json();

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.customerId);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;

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
    setMessages(prev => [...prev, tempMessage]);
    setMessageText('');

    try {
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
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? data.message : msg
      ));

      // Refresh conversation list to update last message
      fetchConversations(userId);
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
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
        {!selectedConversation && (
          <div className="sticky top-0 z-20 bg-black border-b border-[#2A2A2A] px-4 py-4">
            <h1 className="text-xl font-bold text-white mb-3">Messages</h1>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C4F542] transition-colors"
              />
            </div>
          </div>
        )}

        {/* Conversation List or Chat View */}
        {!selectedConversation ? (
          // Conversation List
          <div className="flex-1 overflow-y-auto pb-20">
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
          </div>
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="sticky top-0 z-20 bg-black border-b border-[#2A2A2A] px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

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
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <MessageSquare className="h-12 w-12 text-zinc-600 mb-3" />
                  <p className="text-zinc-500">No messages yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isWorker = message.senderType === 'worker';
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
                      className={`flex ${isWorker ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] flex flex-col gap-1 ${isWorker ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            isWorker
                              ? 'rounded-br-sm text-black'
                              : 'bg-[#2A2A2A] text-white rounded-bl-sm'
                          }`}
                          style={isWorker ? { backgroundColor: LIME_GREEN } : undefined}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-xs text-zinc-600">{formatMessageTime(message.timestamp)}</span>
                          {isWorker && message.read && (
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
              {/* Quick Replies */}
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

              {/* Message Input */}
              <div className="p-4 pt-2">
              <div className="flex items-end gap-2">
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
                  className="flex-1 px-4 py-2.5 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C4F542] transition-colors resize-none"
                  style={{ minHeight: '42px', maxHeight: '100px' }}
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
