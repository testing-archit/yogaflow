import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'Namaste! I am your AI Yoga Guide. How can I help you sequence your day or refine a posture?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken, isAuthenticated, user } = useAuth();
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!isOpen || !isAuthenticated || hasLoadedHistory) return;
      try {
        const token = await getToken();
        const res = await fetch('/api/assistant', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
          setHasLoadedHistory(true);
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
    fetchHistory();
  }, [isOpen, isAuthenticated, hasLoadedHistory, getToken]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (!isAuthenticated) {
      alert("Please sign in to chat with the Yoga Assistant.");
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = await getToken();
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage.content })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          data.messageObj || { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply }
        ]);
      } else {
        const err = await res.json();
        setMessages(prev => [
          ...prev,
          { id: 'err', role: 'assistant', content: err?.error || "I'm having trouble connecting to my inner source. Please try again." }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { id: 'err', role: 'assistant', content: "An error occurred while connecting. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300"
          aria-label="Open AI Assistant"
        >
          <Sparkles size={24} className="animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[110] w-full max-w-sm sm:max-w-md h-[500px] max-h-[80vh] flex flex-col bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-teal-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-teal-100" />
              <h3 className="font-serif font-bold tracking-wide">Flow Guide</h3>
              <span className="text-[9px] uppercase tracking-widest bg-teal-800/50 px-2 py-0.5 rounded-full ml-1 font-bold shadow-inner">Beta</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
            {messages.map(msg => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                   msg.role === 'user' 
                     ? 'bg-teal-600 text-white rounded-tr-sm'
                     : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                 }`}>
                   <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                 </div>
               </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500">
                    <Loader2 size={16} className="animate-spin text-teal-600" /> Thinking...
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
             <form onSubmit={handleSend} className="relative flex items-center">
               <input 
                 type="text"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 disabled={isLoading || !isAuthenticated}
                 placeholder={isAuthenticated ? "Ask about asanas or philosophy..." : "Please log in to chat..."}
                 className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm disabled:opacity-50"
               />
               <button 
                 type="submit"
                 disabled={!inputValue.trim() || isLoading || !isAuthenticated}
                 className="absolute right-2 top-1/2 -transform-y-1/2 w-9 h-9 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center -translate-y-1/2 disabled:opacity-50 transition-colors"
               >
                 <Send size={16} className="-ml-0.5 mt-0.5" />
               </button>
             </form>
          </div>
        </div>
      )}
    </>
  );
};
