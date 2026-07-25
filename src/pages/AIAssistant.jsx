import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { MessageCircle, Send, Sparkles, User } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export default function AIAssistant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef();

  const suggestions = [t('aiAssistant.q1'), t('aiAssistant.q2'), t('aiAssistant.q3'), t('aiAssistant.q4')];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/chat`, { message: msg, session_id: sessionId });
      setSessionId(data.session_id);
      setMessages(m => [...m, { role: 'ai', content: data.response }]);
    } catch (err) {
      toast.error('Chat failed. Please ensure the backend is running.');
      setMessages(m => [...m, { role: 'ai', content: '⚠️ Unable to connect to the AI assistant. Please ensure the backend is running and your API key is configured.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div>
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mb-2">{t('aiAssistant.title')}</h1>
          <p className="text-emerald-200 max-w-2xl mx-auto">{t('aiAssistant.subtitle')}</p>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto card p-6 space-y-4 mb-4 min-h-0">
          {/* Welcome / suggestions */}
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-stone-800 mb-2">AgriSmart AI Assistant</h3>
              <p className="text-stone-500 text-sm mb-6">Ask me anything about farming, crops, diseases, or government schemes.</p>
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">{t('aiAssistant.suggestions')}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-700' : 'bg-emerald-100'}`}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-white" />
                    : <Sparkles className="w-4 h-4 text-emerald-700" />
                  }
                </div>
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="chat-bubble-ai flex items-center gap-1.5">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="card p-3 flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('aiAssistant.placeholder')}
            rows={1}
            id="chat-input"
            className="flex-1 resize-none input-field py-2.5 min-h-[44px] max-h-32 border-0 shadow-none focus:ring-0 p-0 text-sm"
            style={{ outline: 'none' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            id="chat-send-btn"
            className="btn-primary px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-stone-400 text-center mt-3">{t('aiAssistant.disclaimer')}</p>
      </div>
    </div>
  );
}
