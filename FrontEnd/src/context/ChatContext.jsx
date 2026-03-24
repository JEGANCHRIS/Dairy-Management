import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import api from '../utils/api.jsx';
import { toast } from 'react-toastify';
import { parseCartCommand } from '../utils/speechUtils';

const ChatContext = createContext(null);

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
};

const getOrCreateSessionId = () => {
  let id = sessionStorage.getItem('chatSessionId');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('chatSessionId', id);
  }
  return id;
};

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen]           = useState(false);
  const [messages, setMessages]       = useState([{
    id: 'welcome', role: 'assistant',
    content: "👋 Hi! I'm your **Dairy Assistant**.\n• Ask about products, prices & recipes\n• Track your orders\n• 🎤 Voice: say **\"add 2 medium milk\"** to add to cart",
    timestamp: new Date(),
  }]);
  const [isTyping, setIsTyping]       = useState(false);
  const [ttsEnabled, setTtsEnabled]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const sessionIdRef  = useRef(getOrCreateSessionId());
  const isFirstMsgRef = useRef(true);
  const cartActionRef = useRef(null);

  useEffect(() => { return () => {}; }, []);

  const setCartAction = useCallback((fn) => { cartActionRef.current = fn; }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => { if (!prev) setUnreadCount(0); return !prev; });
  }, []);

  const addMessage = useCallback((role, content, isRealReply = false) => {
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role, content, timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    if (role === 'assistant' && isRealReply) setUnreadCount(prev => prev + 1);
    return msg;
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    addMessage('user', text.trim());

    // Check if typed message is a cart command — handle it directly without Ollama
    const cartCmd = parseCartCommand(text.trim());
    if (cartCmd && cartActionRef.current) {
      setIsTyping(true);
      try {
        const result = await cartActionRef.current(cartCmd);
        if (result) {
          // Check if result is a clarification request (multiple products found)
          if (result?.type === 'clarify') {
            addMessage('assistant', result, true);
          } else {
            addMessage('assistant', result, true);
          }
        }
      } finally {
        setIsTyping(false);
      }
      return;
    }

    setIsTyping(true);

    if (isFirstMsgRef.current) {
      isFirstMsgRef.current = false;
      toast.info('🤖 Loading AI model, first reply may take ~20s...', {
        position: 'top-right', autoClose: 8000, closeOnClick: true, pauseOnHover: false,
        theme: document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light',
      });
    }

    try {
      const { data } = await api.post('/gemini/chat', {
        message: text.trim(),
        sessionId: sessionIdRef.current,
      });
      addMessage('assistant', data.reply, true);
      return data.reply;
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      addMessage('assistant', `⚠️ ${msg}`);
    } finally {
      setIsTyping(false);
    }
  }, [addMessage]);

  const handleCartVoiceAction = useCallback(async (action) => {
    if (cartActionRef.current) {
      const result = await cartActionRef.current(action);
      if (result) {
        addMessage('assistant', result, true);
      }
    }
  }, [addMessage]);

  // Called when user clicks a product option in a clarification message
  const addToCartDirect = useCallback(async (product, quantity) => {
    if (cartActionRef.current) {
      const result = await cartActionRef.current({ action: 'addResolved', product, quantity });
      if (result) addMessage('assistant', result, true);
    }
  }, [addMessage]);

  const clearMessages = useCallback(async () => {
    try { await api.delete(`/gemini/history?sessionId=${sessionIdRef.current}`); } catch (_) {}
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('chatSessionId', newId);
    sessionIdRef.current = newId;
    setMessages([{ id: 'welcome-new', role: 'assistant', content: '🗑️ Chat cleared! How can I help you?', timestamp: new Date() }]);
    setUnreadCount(0);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await api.get(`/gemini/history?sessionId=${sessionIdRef.current}`);
      if (data.success && data.data?.length > 0 && data.data[0].messages?.length > 0) {
        const loaded = data.data[0].messages.map((m, i) => ({
          id: `hist_${i}`, role: m.role, content: m.content, timestamp: new Date(m.timestamp),
        }));
        setMessages(loaded);
      }
    } catch (_) {}
  }, []);

  return (
    <ChatContext.Provider value={{
      isOpen, toggleChat,
      messages, isTyping, unreadCount, setUnreadCount,
      sendMessage, addMessage, clearMessages, loadHistory,
      ttsEnabled, setTtsEnabled,
      sessionId: sessionIdRef.current,
      setCartAction, handleCartVoiceAction, addToCartDirect,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
