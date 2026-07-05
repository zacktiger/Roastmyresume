'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw, Flame } from 'lucide-react';
import styles from './ChatInterface.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onQuickAskRef: React.MutableRefObject<((prompt: string) => void) | null>;
}

// Simple markdown-to-HTML parser for basic formatting (**bold**, code, lists, linebreaks)
function formatMessageContent(text: string): string {
  // Escape HTML tags to prevent XSS
  let escaped = text
    .replace(/\r/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold formatting: **text** -> <strong>text</strong>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Bullet items: * item -> <li>item</li>
  escaped = escaped.replace(/^\*\s+(.*?)$/gm, '<li>$1</li>');
  
  // Wrap consecutive lists in <ul> tags
  escaped = escaped.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

  // Inline Code: `code` -> <code>code</code>
  escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');

  // Paragraph returns
  escaped = escaped.replace(/\n/g, '<br />');

  return escaped;
}

export default function ChatInterface({ onQuickAskRef }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi, I'm Kshitij's AI Resume Agent! Ask me anything about Kshitij's builds (PoliCast, URL Shortener, Wildfire CNN, Sanskrit OCR), technical skills, or work history. I'm strictly bound to facts—no hallucinated claims here.\n\nWant to start with a **roast** of Kshitij's resume?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollChat = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollChat();
  }, [messages, isStreaming]);

  const sendMessage = async (textToSend: string) => {
    const userText = textToSend.trim();
    if (!userText) return;

    const userMessageId = Math.random().toString(36).substring(7);
    const assistantMessageId = Math.random().toString(36).substring(7);

    const newMessages: Message[] = [
      ...messages,
      { id: userMessageId, role: 'user', content: userText }
    ];

    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    // Add placeholder assistant message that will be populated by SSE stream
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '' }
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body returned from stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedResponse = '';
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          
          // The last element might be incomplete; save it back to buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr) {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    accumulatedResponse += parsed.text;
                    setMessages((prev) => 
                      prev.map((msg) => 
                        msg.id === assistantMessageId 
                          ? { ...msg, content: accumulatedResponse } 
                          : msg
                      )
                    );
                  } else if (parsed.error) {
                    accumulatedResponse += `\n*[Error: ${parsed.error}]*`;
                  }
                } catch {
                  // Ignore parsing errors for partial/incomplete SSE chunks
                }
              }
            }
          }
        }
      }

      // Process any residual data left in buffer at stream completion
      if (buffer && buffer.startsWith('data: ')) {
        const dataStr = buffer.slice(6).trim();
        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulatedResponse += parsed.text;
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: accumulatedResponse } 
                    : msg
                )
              );
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMessageId 
            ? { ...msg, content: "I encountered an error connecting to my vector model. Please make sure `GEMINI_API_KEY` is configured in your project's environmental settings." } 
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Expose the quick-ask function to parent components (like Command Palette)
  const triggerQuickAsk = async (prompt: string) => {
    if (isStreaming) return;
    await sendMessage(prompt);
  };

  useEffect(() => {
    onQuickAskRef.current = triggerQuickAsk;
    return () => {
      onQuickAskRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isStreaming]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const suggestionChips = [
    { text: '🔥 Roast my resume!', label: 'Roast Resume' },
    { text: 'Explain the Sanskrit OCR architecture.', label: 'Sanskrit OCR' },
    { text: 'What did Kshitij do at Tech Corp?', label: 'Work History' },
    { text: 'How does PoliCast use SSE streaming?', label: 'PoliCast Tech' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.agentInfo}>
          <div className={styles.avatarGlow}>
            <Bot size={18} />
          </div>
          <div>
            <h3 className={styles.agentName}>Resume Co-Pilot</h3>
            <span className={styles.agentStatus}>Guarded by hard content rules</span>
          </div>
        </div>
        <button 
          className={styles.resetButton}
          onClick={() => setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: "Chat logs cleared. Ask me anything about Kshitij's background, skills, or projects!"
            }
          ])}
          title="Clear Conversation"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className={styles.messageBox}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper}`}
          >
            <div className={styles.avatar}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div 
              className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.assistantBubble}`}
              dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
            />
          </div>
        ))}
        {isStreaming && (
          <div className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>
            <div className={styles.avatar}>
              <Bot size={14} />
            </div>
            <div className={`${styles.bubble} ${styles.assistantBubble} ${styles.typingBubble}`}>
              <span className={styles.typingDot}></span>
              <span className={styles.typingDot}></span>
              <span className={styles.typingDot}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.footer}>
        <div className={styles.suggestionList}>
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              className={styles.chip}
              onClick={() => sendMessage(chip.text)}
              disabled={isStreaming}
            >
              {chip.label === 'Roast Resume' && <Flame size={12} className={styles.roastIcon} />}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className={styles.inputForm}>
          <input
            type="text"
            className={styles.inputField}
            placeholder="Ask a question (e.g., 'What is his experience in PyTorch?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
          />
          <button 
            type="submit" 
            className={styles.sendButton} 
            disabled={isStreaming || !input.trim()}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
