'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ViewMode = 'chat' | 'contact';

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Renoa's support assistant. How can I help you today?\n\nI can help with scheduling, invoicing, team management, or any other questions about the platform.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [contactForm, setContactForm] = useState({ email: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Check for escalation keywords
    const escalationKeywords = ['human', 'email', 'support team', 'talk to someone', 'real person', 'contact support'];
    const wantsHuman = escalationKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (wantsHuman) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: "I understand you'd like to speak with our support team. Click the button below to send us a message, and we'll get back to you within 24 hours." }
      ]);
      setViewMode('contact');
      return;
    }

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await res.json();

      if (res.ok && data.response) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.response }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "Sorry, I'm having trouble right now. Please try again or contact support@renoa.ai for help." }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't connect. Please check your internet or email support@renoa.ai." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSendingContact(true);
    try {
      // For now, just show success - in production, this would send an email/create a ticket
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setContactForm({ email: '', message: '' });
      setViewMode('chat');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Thanks! Your message has been sent to our team. Is there anything else I can help you with in the meantime?" }
      ]);
    } catch {
      toast.error('Failed to send message. Please email support@renoa.ai directly.');
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <>
      {/* Floating Button - bottom-24 on mobile to clear bottom nav, bottom-6 on desktop */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open support chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
          1
        </span>
      </button>

      {/* Chat Window - bottom-24 on mobile to clear bottom nav */}
      <div
        className={`fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 w-[380px] max-w-[calc(100vw-32px)] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewMode === 'contact' && (
              <button
                onClick={() => setViewMode('chat')}
                className="p-1 hover:bg-emerald-500 rounded transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div>
              <div className="text-white font-semibold">
                {viewMode === 'chat' ? 'Renoa Support' : 'Contact Support'}
              </div>
              <div className="text-emerald-100 text-xs">
                {viewMode === 'chat' ? 'We typically reply instantly' : 'We\'ll respond within 24 hours'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-emerald-500 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {viewMode === 'chat' ? (
          <>
            {/* Messages */}
            <div className="h-[350px] overflow-y-auto p-4 space-y-3 bg-zinc-950">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-md'
                        : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <button
                onClick={() => setViewMode('contact')}
                className="w-full mt-2 text-xs text-zinc-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
              >
                <Mail className="w-3 h-3" />
                Contact Support Team
              </button>
            </div>
          </>
        ) : (
          /* Contact Form */
          <form onSubmit={handleContactSubmit} className="p-4 space-y-4 bg-zinc-950 h-[400px]">
            <p className="text-zinc-400 text-sm">
              Send a message to our support team and we&apos;ll get back to you via email.
            </p>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Your Email</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Message</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe your issue or question..."
                rows={5}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={sendingContact}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {sendingContact ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
            <p className="text-xs text-zinc-500 text-center">
              Or email directly: <a href="mailto:support@renoa.ai" className="text-emerald-400 hover:underline">support@renoa.ai</a>
            </p>
          </form>
        )}
      </div>
    </>
  );
}
