import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, X, Send, Sparkles, Bot, User } from 'lucide-react';
import axios from 'axios';

// Animated typing indicator
const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    <Bot className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

// Page name from path
function getPageName(pathname) {
  if (pathname === '/') return 'Landing Page';
  if (pathname.startsWith('/results')) return 'Assessment Results Page';
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/upload') return 'Upload Reports Page';
  if (pathname === '/history') return 'Results & History Page';
  if (pathname === '/profile') return 'Profile Page';
  if (pathname === '/community') return 'Community Page';
  if (pathname === '/consult') return 'Consult Page';
  if (pathname === '/login' || pathname === '/signup') return 'Authentication Page';
  return 'CycleSync';
}

// Build a user-aware, context-sensitive greeting
function getGreeting(name, path, hasAssessments) {
  const n = name?.split(' ')[0];

  if (path === '/' || path === '/login' || path === '/signup') {
    return `Hi there! 🌸 I'm your CycleSync wellness assistant. I can help you learn about PCOS, hormonal health, and how to use this app. What would you like to know?`;
  }

  const hello = n ? `Hi ${n}! 💛` : `Hey there! 💛`;

  const contextMap = {
    '/dashboard': hasAssessments
      ? `${hello} Welcome to your dashboard. Feel free to ask me anything about PCOS management, wellness tips, or how to use any of the features here!`
      : `${hello} Welcome to your dashboard! I see you're just getting started — try uploading your first report to get a personalized health assessment. Ask me anything!`,
    '/upload': `${hello} Ready to upload your reports? I can help explain what types of documents work best — ultrasound scans, blood tests, or both. Just ask!`,
    '/history': `${hello} Looking at your assessment history? I can help you understand trends or compare past results.`,
    '/profile': `${hello} Need help with your profile? Your health information helps the AI provide more accurate screening.`,
    '/results': hasAssessments
      ? `${hello} I can help you understand your screening results — ask me about risk levels, hormone values, or what the recommendations mean!`
      : `${hello} I'm here to help you understand your results. Ask me anything about PCOS screening!`,
    '/consult': `${hello} Looking for a specialist? I can help you understand when to see a gynecologist, endocrinologist, or other specialist for PCOS.`,
    '/community': `${hello} Welcome to the community! Share your experiences or ask me any PCOS-related questions.`,
  };

  return contextMap[path] || `${hello} I'm your CycleSync AI assistant. Ask me anything about PCOS, wellness, or how to use the app!`;
}

// Dynamic quick suggestions based on context
function getQuickSuggestions(path, hasAssessments) {
  if (path === '/dashboard') {
    return hasAssessments
      ? ['What does my risk score mean?', 'Tips for managing PCOS', 'How to improve my health score?', 'Best foods for PCOS?']
      : ['What is PCOS?', 'How does the screening work?', 'What reports should I upload?', 'Common PCOS symptoms'];
  }
  if (path === '/upload') {
    return ['What reports can I upload?', 'What is a USG scan?', 'Which blood tests for PCOS?', 'How does AI analysis work?'];
  }
  if (path === '/results' || path.startsWith('/results')) {
    return ['Explain my risk level', 'What do my hormone values mean?', 'Should I see a doctor?', 'Diet tips for my condition'];
  }
  if (path === '/consult') {
    return ['When should I see a gynecologist?', 'What is an endocrinologist?', 'How to prepare for a PCOS consultation?', 'Questions to ask my doctor'];
  }
  if (path === '/community') {
    return ['Tips for PCOS management', 'Exercise recommendations', 'Mental health with PCOS', 'Success stories inspiration'];
  }
  if (path === '/history') {
    return ['How to read my trends?', 'Is my condition improving?', 'What affects risk score?', 'When to retest?'];
  }
  // Default
  return ['What is PCOS?', 'How can I manage PCOS naturally?', 'What are PCOS symptoms?', 'Diet and exercise tips'];
}

export default function ChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userName, setUserName] = useState('');
  const [hasAssessments, setHasAssessments] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();
  const prevUserIdRef = useRef(null);

  // Fetch user's name and check if they have assessments
  useEffect(() => {
    if (!user?.id) {
      setUserName('');
      setHasAssessments(false);
      setMessages([]);
      return;
    }

    // If user changed, reset chat
    if (prevUserIdRef.current && prevUserIdRef.current !== user.id) {
      setMessages([]);
      setUserName('');
      setHasAssessments(false);
    }
    prevUserIdRef.current = user.id;

    // Fetch profile name
    axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/profile/${user.id}`)
      .then(res => {
        setUserName(res.data?.full_name || '');
      })
      .catch(() => setUserName(''));

    // Check if user has assessments
    axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/assessments/${user.id}`)
      .then(res => {
        setHasAssessments(Array.isArray(res.data) && res.data.length > 0);
      })
      .catch(() => setHasAssessments(false));
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 400);
  }, [isOpen]);

  const addGreeting = useCallback(() => {
    const path = location.pathname.startsWith('/results') ? '/results' : location.pathname;
    const greeting = getGreeting(userName, path, hasAssessments);
    setMessages([{ role: 'assistant', content: greeting }]);
  }, [location.pathname, userName, hasAssessments]);

  const handleOpen = () => {
    setIsAnimating(true);
    setIsOpen(true);
    if (messages.length === 0) addGreeting();
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 300);
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const pageContext = `Page: ${getPageName(location.pathname)}\nUser Name: ${userName || 'Not set yet'}\nHas previous assessments: ${hasAssessments ? 'Yes' : 'No'}`;

      const res = await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/chat`, {
        message: trimmed,
        pageContext,
        userName: userName || null,
        userId: user?.id || null,
        chatHistory: messages.slice(-20)
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment. 💛"
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Dynamic suggestions based on current page
  const path = location.pathname.startsWith('/results') ? '/results' : location.pathname;
  const quickActions = getQuickSuggestions(path, hasAssessments);

  return (
    <div className="chatbot-widget fixed bottom-4 right-4 z-[9999] md:bottom-6 md:right-6">
      {/* Chat Panel */}
      <div
        className={`
          absolute bottom-16 right-0 w-[340px] sm:w-[380px] max-h-[520px]
          bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out origin-bottom-right
          ${isOpen && !isAnimating ? 'scale-100 opacity-100 translate-y-0' : ''}
          ${isOpen && isAnimating ? 'scale-95 opacity-0 translate-y-4' : ''}
          ${!isOpen && isAnimating ? 'scale-90 opacity-0 translate-y-4' : ''}
          ${!isOpen && !isAnimating ? 'scale-0 opacity-0 pointer-events-none' : ''}
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">CycleSync AI</h3>
              <p className="text-white/70 text-[11px]">Your wellness companion</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px] bg-gray-50/50 dark:bg-gray-950/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: `chatSlideIn 0.3s ease-out both` }}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={`
                  max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 rounded-bl-md'
                  }
                `}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {isTyping && <TypingDots />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions — always visible, dynamic per page */}
        {!isTyping && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            {quickActions.map((action, i) => (
              <button
                key={`${path}-${i}`}
                onClick={() => sendMessage(action)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors border border-pink-100 dark:border-pink-800 font-medium"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-1 border dark:border-gray-700 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100 dark:focus-within:ring-pink-900/30 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about PCOS, wellness..."
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm py-2 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all flex-shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
            AI wellness assistant • Not medical advice
          </p>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-300 ease-out
          hover:shadow-xl hover:scale-105 active:scale-95
          ${isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-0'
            : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
          }
        `}
        style={{
          animation: !isOpen ? 'chatPulse 3s ease-in-out infinite' : 'none'
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white transition-transform duration-300" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white transition-transform duration-300" />
        )}
      </button>

      {/* Tooltip when closed */}
      {!isOpen && (
        <div className="absolute bottom-16 right-0 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg">
          Chat with CycleSync AI ✨
        </div>
      )}
    </div>
  );
}
