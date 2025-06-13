import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage } from '../types';
import { SparklesIcon, PaperAirplaneIcon, XMarkIcon, LightBulbIcon, TrashIcon, ExclamationTriangleIcon } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';

const API_KEY = typeof process !== 'undefined' && process.env && process.env.API_KEY ? process.env.API_KEY : undefined;

interface GeminiChatWidgetProps {
  currentPagePath: string;
  currentPageTitle?: string;
  pageContextData?: any;
}

const GeminiChatWidget: React.FC<GeminiChatWidgetProps> = ({ currentPagePath, currentPageTitle, pageContextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);
  const greetingTimeoutRef = useRef<number | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping, scrollToBottom]);

  useEffect(() => {
    if (!API_KEY) {
      console.warn("API_KEY for Gemini is not set. Chat widget will be disabled.");
      setMessages([{
        id: 'system-init-error',
        sender: 'system',
        text: 'Gemini AI Assistant is unavailable (API key missing).',
        timestamp: new Date(),
        error: true
      }]);
      return;
    }
    aiRef.current = new GoogleGenAI({ apiKey: API_KEY });
  }, []);

  useEffect(() => {
    if (isOpen && aiRef.current) {
      const greetedThisSession = sessionStorage.getItem('widsAiGreeted');
      if (!greetedThisSession) {
        if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
        
        greetingTimeoutRef.current = window.setTimeout(() => {
          const greetingText = `Hello! I'm your WIDS AI Assistant. You're on the "${currentPageTitle || currentPagePath}" page. How can I help?`;
          setMessages(prev => [...prev, {
              id: `greeting-${Date.now()}`,
              sender: 'bot',
              text: greetingText,
              timestamp: new Date()
          }]);
          sessionStorage.setItem('widsAiGreeted', 'true');
        }, 1500);
      }
      // Proactive suggestion for critical health
      if(currentPagePath === '/overview' && pageContextData?.systemHealth === 'Critical' && messages.length > 0 && !messages[messages.length - 1].id.startsWith('bot_proactive_critical')) {
        setTimeout(() => {
           setMessages(prev => [...prev, {
              id: `bot_proactive_critical-${Date.now()}`,
              sender: 'bot',
              text: "I see the system health is critical. Would you like me to summarize potential issues or suggest checks?",
              timestamp: new Date()
          }]);
        }, 2500); // Delay after greeting or if panel already open
      }

    }
    
    if (isOpen) {
      setHasUnreadMessages(false); 
    }

    return () => {
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
    };
  }, [isOpen, currentPagePath, currentPageTitle, pageContextData, messages]); // Added messages to dep array for proactive logic


  const constructContextualPrompt = (query: string): string => {
    let contextString = "No specific page data available.";
    if (pageContextData) {
      try {
        // Be more selective or summarize if pageContextData is very large
        let dataToSummarize = pageContextData;
        if (currentPagePath === '/overview' && pageContextData.criticalAlertsContext !== undefined) {
            dataToSummarize = { systemHealth: pageContextData.systemHealth, criticalAlerts: pageContextData.criticalAlertsContext };
        } else if (currentPagePath.startsWith('/models/') && pageContextData.id) { // Model Detail
            dataToSummarize = { modelId: pageContextData.id, status: pageContextData.status, accuracy: pageContextData.accuracy };
        }
        // Add more specific summarizations for other pages
        
        contextString = JSON.stringify(dataToSummarize, null, 2);
        if (contextString.length > 1500) { 
            contextString = contextString.substring(0, 1500) + "\n... (context truncated)";
        }
      } catch (e) {
        contextString = "Error serializing page context.";
      }
    }

    return `System Instruction: You are a helpful AI assistant for the WIDS (WiFi Intrusion Detection System) Dashboard.
Current Page Path: ${currentPagePath}
Current Page Title: ${currentPageTitle || 'N/A'}
Page Context (JSON Summary):
\`\`\`json
${contextString}
\`\`\`
User Query: ${query}
Please provide a concise and helpful answer based on the provided context and your general knowledge about WIDS and cybersecurity. Format your response using basic markdown (bold with **, italics with *, inline code with \`). If the query is outside this scope, politely state so.`;
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || userInput;
    if (!textToSend.trim() || isLoading || !aiRef.current) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    if (!queryText) setUserInput(''); 
    
    setIsLoading(true);
    setIsBotTyping(true);

    try {
      const fullPrompt = constructContextualPrompt(textToSend);
      
      const response: GenerateContentResponse = await aiRef.current.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [{ role: "user", parts: [{text: fullPrompt}] }],
      });
      
      const botResponseText = response.text;
      
      const newBotMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText || "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newBotMessage]);
      if (!isOpen) {
        setHasUnreadMessages(true);
      }

    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: `Error: ${error.message || "Could not reach the AI assistant."}`,
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      if (!isOpen) { 
        setHasUnreadMessages(true);
      }
    } finally {
      setIsLoading(false);
      setIsBotTyping(false);
    }
  };
  
  const getSuggestedPrompts = (): string[] => {
    const genericPrompts = ["Summarize page", "Key metrics?", "Explain WIDS"];
    let contextualPrompts: string[] = [];

    if (currentPagePath.startsWith('/overview')) {
      contextualPrompts = ["System health?", "Attack trends?"];
    } else if (currentPagePath.startsWith('/models/')) {
      contextualPrompts = ["Model performance?", "Hyperparams?"];
    } else if (currentPagePath.startsWith('/datasets/')) { 
      contextualPrompts = ["Dataset summary?", "Column details?"];
    } else if (currentPagePath.startsWith('/model-management')) {
      contextualPrompts = ["Training steps?", "Model status?"];
    } else if (currentPagePath.startsWith('/meta-learning')) {
      contextualPrompts = ["Adaptation speed?", "Few-shot acc?"];
    }
    
    const allSuggestions = [...new Set([...contextualPrompts, ...genericPrompts])];
    return allSuggestions.slice(0, 3); 
  };

  const handleClearChat = () => {
    setMessages([]);
    // Optionally, resend the initial greeting if desired, or keep it fully clear.
    // For now, just clearing. The session greeting won't reappear.
  }

  if (!API_KEY) { 
      return null;
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) { 
            setHasUnreadMessages(false);
          }
        }}
        className="gemini-chat-widget-fab bg-accent-purple hover:bg-accent-purple/80 text-white p-2.5 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-opacity-50 transition-transform duration-200 hover:scale-110"
        aria-label="Toggle AI Assistant"
        aria-expanded={isOpen}
      >
        <SparklesIcon className="w-6 h-6" />
        {hasUnreadMessages && !isOpen && (
          <span className="gemini-chat-widget-fab-unread-dot" aria-label="Unread messages"></span>
        )}
      </button>

      <div className={`gemini-chat-panel bg-secondary-dark rounded-lg shadow-2xl flex flex-col border border-tertiary-dark ${!isOpen ? 'hidden' : ''}`}>
        <header className="flex items-center justify-between p-3 border-b border-tertiary-dark">
          <h3 className="text-md font-semibold text-text-primary flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-accent-purple"/>
            WIDS AI Assistant
          </h3>
          <div className="flex items-center space-x-1">
            <button 
                onClick={handleClearChat}
                className="p-1 text-text-secondary hover:text-text-primary rounded-md"
                title="Clear Chat History"
                aria-label="Clear chat history"
            >
                <TrashIcon className="w-4 h-4"/>
            </button>
            <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 text-text-secondary hover:text-text-primary rounded-md"
                aria-label="Close chat panel"
            >
                <XMarkIcon className="w-5 h-5"/>
            </button>
          </div>
        </header>

        <div className="flex-grow p-3 space-y-3 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-2.5 shadow text-sm ${
                msg.sender === 'user' ? 'chat-bubble-user' :
                msg.sender === 'bot' ? 'chat-bubble-bot' :
                'chat-bubble-system' // This class should style system/error messages
              }`}>
                {msg.sender === 'system' && msg.error && <ExclamationTriangleIcon className="w-4 h-4 inline mr-1.5 mb-0.5 text-danger" />}
                {msg.sender === 'bot' ? <MarkdownRenderer content={msg.text} /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                {msg.sender !== 'system' && (
                    <p className={`text-xs mt-1.5 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-text-secondary text-left'} text-opacity-80`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
              </div>
            </div>
          ))}
          {isBotTyping && ( // Improved typing indicator
            <div className="flex justify-start">
              <div className="max-w-[85%] p-2.5 shadow chat-bubble-bot">
                <div className="flex items-center space-x-1.5">
                    <span className="block w-2 h-2 bg-text-secondary/70 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="block w-2 h-2 bg-text-secondary/70 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="block w-2 h-2 bg-text-secondary/70 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {isOpen && !isLoading && !isBotTyping && messages.filter(m => m.sender !== 'system').length > 0 && ( 
            <div className="px-3 pb-1 pt-1 border-t border-tertiary-dark flex flex-wrap gap-1.5">
                {getSuggestedPrompts().map(prompt => (
                    <button
                        key={prompt}
                        onClick={() => handleSendMessage(prompt)}
                        className="suggested-prompt-chip flex items-center space-x-1"
                        aria-label={`Use suggested prompt: ${prompt}`}
                    >
                       <LightBulbIcon className="w-3.5 h-3.5 opacity-70"/> 
                       <span>{prompt}</span>
                    </button>
                ))}
            </div>
        )}

        <footer className="p-3 border-t border-tertiary-dark">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder={isLoading || isBotTyping ? "AI is thinking..." : "Ask about WIDS..."}
              className="flex-1 p-2.5 bg-primary-dark border border-tertiary-dark rounded-lg text-sm text-text-primary focus:ring-1 focus:ring-accent-blue focus:border-accent-blue"
              disabled={isLoading || isBotTyping || !aiRef.current}
              aria-label="Chat input"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || isBotTyping || !userInput.trim() || !aiRef.current}
              className="p-2.5 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PaperAirplaneIcon className="w-5 h-5" />}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default GeminiChatWidget;