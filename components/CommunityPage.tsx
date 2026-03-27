
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Reveal } from './Reveal';
import { Search, MessageSquare, Users, Settings, Info, Send, Smile, Paperclip, X, FileText, Heart, Shield } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, addDoc, getDoc, onSnapshot, getDownloadURL, ref, uploadBytes, deleteDoc, deleteObject, writeBatch, db, auth, storage } from '../utils/mockFirebase';

import { DEFAULT_COMMUNITY_SETTINGS, type CommunityChatMessage, type CommunityConversation, type CommunitySettings } from '../utils/settings';
import { useAuth } from '../contexts/AuthContext';

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = (user as any)?.id || '';
  const [activeTab, setActiveTab] = useState<'All' | 'Direct' | 'Groups'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [pageTitle, setPageTitle] = useState<string>(DEFAULT_COMMUNITY_SETTINGS.pageTitle);
  const [pageSubtitle, setPageSubtitle] = useState<string>(DEFAULT_COMMUNITY_SETTINGS.pageSubtitle);
  const [welcomeTitle, setWelcomeTitle] = useState<string>(DEFAULT_COMMUNITY_SETTINGS.welcomeTitle);
  const [welcomeSubtitle, setWelcomeSubtitle] = useState<string>(DEFAULT_COMMUNITY_SETTINGS.welcomeSubtitle);
  const [settingsConversations, setSettingsConversations] = useState<CommunityConversation[]>(DEFAULT_COMMUNITY_SETTINGS.conversations);
  const [dynamicConversations, setDynamicConversations] = useState<CommunityConversation[]>([]);
  const [chatHistories, setChatHistories] = useState<Record<string, CommunityChatMessage[]>>(DEFAULT_COMMUNITY_SETTINGS.histories);
  const [liveMessages, setLiveMessages] = useState<CommunityChatMessage[] | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mergedConversations = useMemo(() => {
    const byId = new Map<string, CommunityConversation>();
    settingsConversations.forEach((c) => byId.set(c.id, c));
    dynamicConversations.forEach((c) => {
      const existing = byId.get(c.id);
      byId.set(c.id, existing ? { ...existing, ...c } : c);
    });
    return Array.from(byId.values());
  }, [dynamicConversations, settingsConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedId, chatHistories, liveMessages]);

  useEffect(() => {
    const convRef = collection(db, 'community_conversations');
    const unsubscribe = onSnapshot(
      convRef,
      (snapshot) => {
        const next = snapshot.docs.map((d) => {
          const data = d.data() as any;
          const author = typeof data.author === 'string' && data.author.trim().length > 0 ? data.author : 'New Chat';
          const avatarRaw =
            typeof data.avatar === 'string' && data.avatar.trim().length > 0
              ? data.avatar
              : author.replace(/\s+/g, '').slice(0, 2).toUpperCase();
          const members = typeof data.members === 'number' && Number.isFinite(data.members) ? data.members : undefined;

          return {
            id: d.id,
            author,
            avatar: avatarRaw,
            lastText: typeof data.lastText === 'string' ? data.lastText : '',
            time: typeof data.time === 'string' ? data.time : 'Just now',
            unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : undefined,
            isGroup: !!data.isGroup,
            members,
            isSupportGroup: !!data.isSupportGroup,
          } satisfies CommunityConversation;
        });
        setDynamicConversations(next);
      },
      (error) => {
        console.error('Error listening to community conversations:', error);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'app_settings');
    const unsubscribe = onSnapshot(
      settingsRef,
      (snap) => {
        const data = snap.data() as any;
        const community = data?.community as Partial<CommunitySettings> | undefined;
        if (!community) return;

        if (typeof community.pageTitle === 'string') setPageTitle(community.pageTitle);
        if (typeof community.pageSubtitle === 'string') setPageSubtitle(community.pageSubtitle);
        if (typeof community.welcomeTitle === 'string') setWelcomeTitle(community.welcomeTitle);
        if (typeof community.welcomeSubtitle === 'string') setWelcomeSubtitle(community.welcomeSubtitle);
        if (Array.isArray(community.conversations) && community.conversations.length > 0) {
          setSettingsConversations(community.conversations as CommunityConversation[]);
        }
        if (community.histories && typeof community.histories === 'object') {
          setChatHistories(community.histories as Record<string, CommunityChatMessage[]>);
        }
      },
      (error) => {
        console.error('Error listening to community settings:', error);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setLiveMessages(null);
      return;
    }

    const messagesRef = collection(db, 'community_conversations', selectedId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((d) => {
          const data = d.data() as any;
          const senderId = typeof data.senderId === 'string' ? data.senderId : '';
          const createdAt = data.createdAt?.toDate?.();
          const time =
            typeof data.time === 'string' && data.time.trim().length > 0
              ? data.time
              : createdAt
                ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

          return {
            id: d.id,
            sender: typeof data.sender === 'string' ? data.sender : 'Unknown',
            avatar: typeof data.avatar === 'string' ? data.avatar : '',
            text: typeof data.text === 'string' ? data.text : '',
            time,
            isMe: senderId && currentUserId ? senderId === currentUserId : !!data.isMe,
            attachment: data.attachment && typeof data.attachment === 'object' ? data.attachment : undefined,
          } satisfies CommunityChatMessage;
        });
        setLiveMessages(next);
      },
      (error) => {
        console.error('Error listening to community messages:', error);
        setLiveMessages(null);
      }
    );

    return unsubscribe;
  }, [currentUserId, selectedId]);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !attachedFile) || !selectedId) return;

    const senderName = (user?.name || 'Me').trim() || 'Me';
    const avatar =
      senderName
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'ME';
    const senderId = (user as any)?.id || '';

    const newMessage: CommunityChatMessage = {
      id: Date.now().toString(),
      sender: senderName,
      avatar,
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      attachment: attachedFile || undefined
    };

    try {
      await addDoc(collection(db, 'community_conversations', selectedId, 'messages'), {
        sender: newMessage.sender,
        avatar: newMessage.avatar,
        senderId,
        text: newMessage.text,
        time: newMessage.time,
        isMe: true,
        attachment: newMessage.attachment || null,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, 'community_conversations', selectedId),
        { lastText: newMessage.text || '', time: newMessage.time, updatedAt: serverTimestamp() },
        { merge: true }
      );

      setInputText('');
      setAttachedFile(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistories(prev => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), newMessage]
      }));
      setInputText('');
      setAttachedFile(null);
      setShowEmojiPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({ name: file.name, type: file.type });
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const filteredConversations = mergedConversations.filter(m => {
    if (activeTab === 'Direct') return !m.isGroup;
    if (activeTab === 'Groups') return m.isGroup;
    return true;
  }).filter(m => m.author.toLowerCase().includes(searchQuery.toLowerCase()));

  const selectedConversation = mergedConversations.find(m => m.id === selectedId);
  const currentMessages = selectedId ? (liveMessages ?? (chatHistories[selectedId] || [])) : [];

  const commonEmojis = ['🙏', '🧘‍♀️', '✨', '🌿', '🕉️', '🔥', '💧', '🌙', '❤️', '🙌'];

  return (
    <div className="min-h-screen bg-teal-50/30 pt-32 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Reveal>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 mb-4">{pageTitle}</h1>
            <p className="text-slate-500 max-w-xl mx-auto font-light">
              {pageSubtitle}
            </p>
          </Reveal>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-teal-900/5 border border-slate-100 overflow-hidden flex flex-col md:flex-row h-[750px] relative">
          
          {/* Sidebar */}
          <div className="w-full md:w-[320px] border-r border-slate-100 flex flex-col bg-white shrink-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold text-slate-900">Messages</h2>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 mb-4">
                {(['All', 'Direct', 'Groups'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      activeTab === tab 
                        ? 'bg-teal-600 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {filteredConversations.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group ${
                    selectedId === msg.id ? 'bg-teal-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold font-serif relative ${
                      msg.isSupportGroup 
                        ? 'bg-pink-50 text-pink-600 border-2 border-pink-200' 
                        : msg.isGroup 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {msg.isSupportGroup ? (
                        <Heart size={18} className="text-pink-600" fill="currentColor" />
                      ) : (
                        msg.avatar
                      )}
                    </div>
                    {msg.unreadCount && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white font-bold ${
                        msg.isSupportGroup ? 'bg-pink-500' : 'bg-teal-500'
                      }`}>
                        {msg.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{msg.author}</h4>
                      <span className="text-[10px] text-slate-300">{msg.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate leading-relaxed">
                      {msg.lastText}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50/30 relative">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold font-serif ${
                      selectedConversation.isSupportGroup 
                        ? 'bg-pink-50 text-pink-600 border-2 border-pink-200' 
                        : selectedConversation.isGroup 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {selectedConversation.isSupportGroup ? (
                        <Heart size={18} className="text-pink-600" fill="currentColor" />
                      ) : (
                        selectedConversation.avatar
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{selectedConversation.author}</h3>
                        {selectedConversation.isSupportGroup && (
                          <Shield size={14} className="text-pink-500" />
                        )}
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${
                        selectedConversation.isSupportGroup 
                          ? 'text-pink-600' 
                          : selectedConversation.isGroup 
                          ? 'text-teal-600' 
                          : 'text-teal-600'
                      }`}>
                        {selectedConversation.isSupportGroup 
                          ? 'Support Group • Safe Space' 
                          : selectedConversation.isGroup 
                          ? 'Community Circle' 
                          : 'Direct Message'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-300 hover:text-teal-600 transition-colors"><Info size={20} /></button>
                    <button className="p-2 text-slate-300 hover:text-teal-600 transition-colors"><Settings size={20} /></button>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                   <div className="flex flex-col items-center mb-8">
                      <span className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</span>
                   </div>

                   {currentMessages.map((msg) => (
                     <div key={msg.id} className={`flex items-start gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          msg.isMe ? 'bg-slate-900 text-white' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {msg.avatar}
                        </div>
                        <div className={`flex flex-col gap-1 ${msg.isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-4 rounded-2xl border shadow-sm max-w-[85%] md:max-w-[70%] ${
                            msg.isMe 
                              ? 'bg-teal-600 border-teal-500 text-white rounded-tr-none' 
                              : 'bg-white border-slate-100 text-slate-600 rounded-tl-none'
                          }`}>
                            {msg.attachment && (
                              <div className={`flex items-center gap-3 p-3 mb-3 rounded-xl border ${msg.isMe ? 'bg-teal-500/30 border-teal-400/30' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`p-2 rounded-lg ${msg.isMe ? 'bg-teal-400' : 'bg-teal-100 text-teal-600'}`}>
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold truncate">{msg.attachment.name}</p>
                                  <p className={`text-[9px] opacity-60`}>{msg.attachment.type}</p>
                                </div>
                              </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 px-1">{msg.time}</span>
                        </div>
                     </div>
                   ))}
                   <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-slate-100 relative">
                  {/* Emoji Picker Placeholder */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-6 mb-2 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 grid grid-cols-5 gap-3 animate-fade-in-up z-20">
                      {commonEmojis.map(e => (
                        <button 
                          key={e} 
                          onClick={() => addEmoji(e)}
                          className="text-xl hover:scale-125 transition-transform"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Attachment Preview */}
                  {attachedFile && (
                    <div className="mb-4 flex items-center justify-between p-3 bg-teal-50 border border-teal-100 rounded-xl animate-fade-in-up">
                      <div className="flex items-center gap-3">
                        <FileText className="text-teal-600" size={18} />
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{attachedFile.name}</span>
                      </div>
                      <button onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className="relative bg-slate-50 rounded-2xl p-2 flex items-center gap-2">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 transition-colors ${attachedFile ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600'}`}
                    >
                      <Paperclip size={20} />
                    </button>
                    <textarea 
                      rows={1}
                      placeholder="Type your message..." 
                      className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm text-slate-900 placeholder:text-slate-300 resize-none py-2 max-h-32"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 transition-colors ${showEmojiPicker ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600'}`}
                    >
                      <Smile size={20} />
                    </button>
                    <button 
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() && !attachedFile}
                      className={`p-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${
                        inputText.trim() || attachedFile ? 'bg-teal-600 text-white shadow-teal-600/20 hover:scale-105' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-8">
                  <MessageSquare size={32} className="text-teal-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">{welcomeTitle}</h3>
                <p className="text-slate-400 max-w-sm font-light">
                  {welcomeSubtitle}
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Context (Desktop only) */}
          <div className="hidden lg:flex w-[280px] border-l border-slate-100 flex-col bg-white overflow-y-auto">
            <div className="p-8 flex flex-col items-center text-center">
              {selectedConversation ? (
                <>
                  <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center text-2xl font-bold font-serif ${
                    selectedConversation.isSupportGroup 
                      ? 'bg-pink-50 text-pink-600 border-2 border-pink-200' 
                      : selectedConversation.isGroup 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'bg-teal-100 text-teal-700'
                  }`}>
                    {selectedConversation.isSupportGroup ? (
                      <Heart size={32} className="text-pink-600" fill="currentColor" />
                    ) : (
                      selectedConversation.avatar
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <h3 className="text-xl font-serif font-bold text-slate-900">{selectedConversation.author}</h3>
                    {selectedConversation.isSupportGroup && (
                      <Shield size={18} className="text-pink-500" />
                    )}
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                    selectedConversation.isSupportGroup ? 'text-pink-600' : 'text-slate-400'
                  }`}>
                    {selectedConversation.isSupportGroup 
                      ? 'Safe Space for Support & Growth' 
                      : selectedConversation.isGroup 
                      ? `${(Array.isArray((selectedConversation as any).memberIds) && (selectedConversation as any).memberIds.length > 0
                          ? (selectedConversation as any).memberIds.length
                          : selectedConversation.members) || 0} Members Online` 
                      : 'Available to chat'}
                  </p>
                  {selectedConversation.isSupportGroup && (
                    <p className="text-xs text-slate-500 mb-8 max-w-[200px] leading-relaxed">
                      A compassionate community where you can share challenges, celebrate wins, and find encouragement from fellow practitioners and instructors.
                    </p>
                  )}
                  {!selectedConversation.isSupportGroup && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">
                      {selectedConversation.isGroup
                        ? `${(Array.isArray((selectedConversation as any).memberIds) && (selectedConversation as any).memberIds.length > 0
                            ? (selectedConversation as any).memberIds.length
                            : selectedConversation.members) || 0} Members Online`
                        : 'Available to chat'}
                    </p>
                  )}

                  <div className="w-full space-y-6 text-left pt-6 border-t border-slate-50">
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">About</h4>
                       <p className="text-xs text-slate-500 leading-relaxed">
                         {selectedConversation.isSupportGroup
                           ? "A safe, supportive space where members share challenges, victories, and encouragement. Instructors are active here to provide guidance and support. All members are welcome to ask questions, share struggles, and celebrate progress together."
                           : selectedConversation.isGroup 
                           ? "A collaborative space for all students in the 6-month transformation program to discuss techniques and progress."
                           : "Direct connection with your peer to share personal journey insights and support."
                         }
                       </p>
                    </div>
                    
                    <div className="space-y-3">
                       <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Shared Attachments</h4>
                       <div className="p-3 rounded-xl border border-slate-100 flex items-center gap-3 text-xs text-slate-500 opacity-60">
                          <FileText size={16} /> <span className="truncate">Morning_Routine.pdf</span>
                       </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-20 flex flex-col items-center">
                  <Users size={48} className="text-slate-100 mb-6" />
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Context Panel</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
