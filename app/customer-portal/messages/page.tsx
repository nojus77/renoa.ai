'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { MessageSquare, Send, Loader2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  content: string;
  direction: string;
  createdAt: string;
}

interface Conversation {
  providerId: string;
  providerName: string;
  messages: Message[];
}

export default function CustomerMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/messages');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer-portal/login');
          return;
        }
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setConversations(data.conversations);

      // Auto-select first conversation if available
      if (data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error(error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await fetch('/api/customer/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedConversation.providerId,
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Refresh messages
      await fetchMessages();
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </CustomerLayout>
    );
  }

  if (conversations.length === 0) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">No Messages Yet</h2>
          <p className="text-zinc-600">Start a conversation with your service provider from a job page</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Messages</h1>
        <p className="text-zinc-600">Chat with your service providers</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden" style={{ height: '600px' }}>
        <div className="grid grid-cols-12 h-full">
          {/* Conversations List */}
          <div className="col-span-4 border-r border-zinc-200 overflow-y-auto">
            {conversations.map((conv) => {
              const lastMessage = conv.messages[conv.messages.length - 1];
              const isSelected = selectedConversation?.providerId === conv.providerId;

              return (
                <div
                  key={conv.providerId}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b border-zinc-200 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {conv.providerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">{conv.providerName}</p>
                      {lastMessage && (
                        <p className="text-sm text-zinc-600 truncate">{lastMessage.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Messages Area */}
          <div className="col-span-8 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-zinc-200 bg-zinc-50">
                  <h2 className="text-xl font-bold text-zinc-900">{selectedConversation.providerName}</h2>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message, index) => {
                    const isFromCustomer = message.direction === 'received';
                    const showDate = index === 0 ||
                      formatDate(selectedConversation.messages[index - 1].createdAt) !== formatDate(message.createdAt);

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isFromCustomer ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg p-3 ${
                            isFromCustomer
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-100 text-zinc-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isFromCustomer ? 'text-emerald-100' : 'text-zinc-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 bg-zinc-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
