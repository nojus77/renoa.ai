'use client';

import { useState } from 'react';

interface Message {
  text: string;
  isBot: boolean;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: '👋 Hi! I\'m Oakley, your home services assistant! How can I help you find the perfect pro today?',
      isBot: true,
    },
    {
      text: 'Try asking me about:\n• Finding a landscaper\n• Getting a quote\n• Emergency services',
      isBot: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();

    setMessages((prev) => [
      ...prev,
      { text: userMessage, isBot: false },
    ]);

    setInputValue('');

    setTimeout(() => {
      let response = "Thanks for your message! A real chat system would be connected here. For now, please use the 'Get Matched' button to connect with professionals. 🌳";

      if (userMessage.toLowerCase().includes('quote') || userMessage.toLowerCase().includes('price')) {
        response = "Great question! We offer free quotes. Click the 'Get Matched' button above to get started! 💰";
      } else if (userMessage.toLowerCase().includes('emergency') || userMessage.toLowerCase().includes('urgent')) {
        response = "We understand urgency! Use the 'Get Matched' button and mention it's urgent - we'll prioritize your request. ⚡";
      } else if (userMessage.toLowerCase().includes('landscap')) {
        response = "Landscaping is one of our most popular services! Click 'Get Matched' to connect with top-rated landscapers in your area. 🌿";
      }

      setMessages((prev) => [
        ...prev,
        { text: response, isBot: true },
      ]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div
        className="chatbot-button first-load"
        id="chatbotButton"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <img
          src="/images/mascot-head.png"
          className="tree-head-img"
          alt="Oakley - Tree Head Chatbot"
          width={70}
          height={70}
        />
        <div className="chat-badge" id="chatBadge" style={{ display: isOpen ? 'none' : 'flex' }}>
          1
        </div>
      </div>

      <div className={`chat-window ${isOpen ? 'open' : ''}`} id="chatWindow">
        <div className="chat-header">
          <div>
            <div style={{ fontSize: '1.125rem' }}>Chat with Oakley 🌳</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>We typically reply instantly</div>
          </div>
          <button
            className="chat-close"
            id="chatClose"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="chat-messages" id="chatMessages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${message.isBot ? 'bot' : ''}`}
              style={
                !message.isBot
                  ? {
                      marginLeft: 'auto',
                      background: '#F5EDE1',
                      color: '#06402B',
                    }
                  : undefined
              }
            >
              {message.text.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < message.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            id="chatInput"
            placeholder="Type your message..."
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>
    </div>
  );
}