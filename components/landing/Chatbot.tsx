'use client';

import { useState } from 'react';
import Image from 'next/image';

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

    // Add user message
    setMessages((prev) => [
      ...prev,
      { text: userMessage, isBot: false },
    ]);

    setInputValue('');

    // Simulate bot response after a delay
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
      {/* Chatbot Button */}
      <div
        className="chatbot-button first-load"
        id="chatbotButton"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <img
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAYAAAB/HSuDAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAEAKADAAQAAAABAAAEAAAAAADT3eodAABAAElEQVR4Aey9B6CeZX33f93jWWdmbzJYkQQFJLwyHFAHjhcVaeLeFqriasW+1ioHrba1VlvUKpWK1daRWLGKOCFRlmDCThjZe+fk5Ixn3Ov/+V5PUvPHrUGS8LuTc87z3Pd9rc/9HMj3ty7n7DACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNgBIyAETACRsAIGAEjYASMgBEwAkbACBgBI2AEjIARMAJGwAgYASNwuBAoiiIoir7wcJmPzcMIGAEjYASMgBEwAkbACBgBI2AEjIAReASBxYv74uXL+8oLF86PisIh5PXVF7a/XKDbD379iOa/8FbGgF84aSeMgBEwAkbACBgBI2AEjIARMAJGwAgYgUeXgMS7RP7CYn6kkSTwf9mIv0m4H3z9gIGgzxsK5P1vGw0O7lf3HPzeXhsBI3DoCfzSX+ZDP4z1aASMgBEwAkbACBgBI2AEjMDhRqAt7vuCIOjLf9PcVq68slIvxx27dm+dvmto76gkc6UsbfWUw1K9XInS3lp3Vq6EnRPGTL2tmWRZd16rz5r1+sav61eiX2MrmmDBgkXZr7vXrhkBI/CHEzADwB/O0HowAkbACBgBI2AEjIARMAJHDIGFxcJovltR/DLRr2u9998z5aFVGyevXrPjzHvuWbVgzdaBWbv7ByvNkaRapFkUFkHEnywISrzNS1gP4iLIiyLLgjCMHHkB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

... [1 lines truncated] ..."
          className="tree-head-img"
          alt="Oakley - Tree Head Chatbot"
          width={70}
          height={70}
        />
        <div className="chat-badge" id="chatBadge" style={{ display: isOpen ? 'none' : 'flex' }}>
          1
        </div>
      </div>

      {/* Chat Window */}
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
