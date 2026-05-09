/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, sendMessageStream } from './lib/gemini';
import MessageList from './components/MessageList';
import InputBar from './components/InputBar';
import LoginPage from './components/LoginPage';
import { Settings, Timer, Layers, MessageSquare, Plus, LogOut, Sun, Moon, Search, Trash2, ChevronRight } from 'lucide-react';
import { cn } from './lib/utils';

const SUGGESTIONS = [
  "Explain Quantum Computing briefly",
  "Write a Python script for a simple calculator",
  "How do I optimize my React apps?",
  "Tell me a technical joke",
  "What is Lightning OS?",
  "Plan a minimalist workspace"
];

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMessage, setActiveMessage] = useState('');
  const [tempMode, setTempMode] = useState(false);
  const [view, setView] = useState<'home' | 'chat' | 'history' | 'settings'>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('lightning_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('lightning_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    // Check local storage for persistent guest session
    const savedUser = localStorage.getItem('lightning_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
        localStorage.removeItem('lightning_user');
      }
    }
    
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lightning_user');
    setUser(null);
    setView('home');
    setMessages([]);
  };

  const handleLogin = (userData: any) => {
    localStorage.setItem('lightning_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: text, isTemp: tempMode };
    const newMessages = [...messagesRef.current, userMsg];
    
    setMessages(newMessages);
    setIsTyping(true);
    setView('chat');
    setActiveMessage('');

    try {
      let fullResponse = '';
      const stream = sendMessageStream(newMessages);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setActiveMessage(fullResponse);
      }

      const modelMsg: Message = { 
        role: 'model', 
        content: fullResponse, 
        isTemp: tempMode 
      };
      
      const finalMessages = [...newMessages, modelMsg];
      setMessages(finalMessages);
      setActiveMessage('');

      // Persistent History Logic
      if (!tempMode) {
        setHistory(prev => {
          const sessionIndex = prev.findIndex(s => s.id === currentSessionId);
          if (sessionIndex !== -1) {
            // Update existing session
            const updatedHistory = [...prev];
            updatedHistory[sessionIndex] = {
              ...updatedHistory[sessionIndex],
              messages: finalMessages,
              timestamp: Date.now()
            };
            return updatedHistory;
          } else {
            // Create new session
            const newSession: ChatSession = {
              id: currentSessionId || Math.random().toString(36).substr(2, 9),
              title: text.length > 30 ? text.substring(0, 30) + '...' : text,
              messages: finalMessages,
              timestamp: Date.now()
            };
            if (!currentSessionId) setCurrentSessionId(newSession.id);
            return [newSession, ...prev];
          }
        });
      }
    } catch (error) {
      console.error(error);
      setActiveMessage('');
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "Identity Verification Required or API limit reached. Check internal logs.", 
        isTemp: tempMode 
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [tempMode, isTyping]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setView('chat');
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setView('chat');
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    return history.filter(session => 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [history, searchQuery]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <Plus className="text-accent" size={32} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-accent/30 overflow-hidden flex flex-col transition-colors duration-500",
      theme === 'dark' ? "bg-[#05070a] text-white" : "bg-zinc-50 text-black",
      tempMode && theme === 'dark' && "bg-[#0d0905]"
    )}>
      {/* Brand Pill */}
      <div className="pt-20 flex justify-center w-full z-10 pointer-events-none sticky top-0">
        <AnimatePresence mode="wait">
          <motion.div 
            layout
            key={view === 'home' ? 'brand-large' : 'brand-small'}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "backdrop-blur-3xl border flex items-center gap-2 shadow-2xl transition-all duration-500 pointer-events-auto",
              theme === 'dark' ? "bg-zinc-900/80 border-white/10" : "bg-white/80 border-black/5",
              view === 'home' ? "px-10 py-5 rounded-[40px]" : "px-6 py-2 rounded-full scale-90 opacity-80"
            )}
          >
            <span className={cn("font-black tracking-wider flex items-center gap-2 transition-all", view === 'home' ? "text-xl" : "text-sm")}>
              <span className="text-[#facc15]">⚡</span> LIGHTNING <span className={cn(tempMode ? "text-temp" : "text-accent")}>
                {tempMode ? 'TEMP' : 'AI'}
              </span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-6 space-y-6"
            >
              <div className="w-full max-w-sm space-y-3">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (i * 0.1) }}
                    onClick={() => handleSend(s)}
                    className={cn(
                      "w-full p-5 rounded-[22px] border text-center transition-all font-medium active:scale-95 leading-tight shadow-sm",
                      theme === 'dark' ? "bg-white/[0.03] border-white/5 text-white hover:bg-white/[0.05]" : "bg-black/[0.02] border-black/5 text-black hover:bg-black/[0.04]"
                    )}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              <MessageList 
                messages={messages} 
                isTyping={isTyping} 
                activeMessage={activeMessage} 
                theme={theme}
              />
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-6 w-full max-w-2xl mx-auto overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black">History</h2>
                <button 
                  onClick={startNewChat}
                  className={cn(
                    "p-3 rounded-2xl border transition-all active:scale-90",
                    theme === 'dark' ? "bg-white text-black" : "bg-black text-white"
                  )}
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                <input 
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full py-4 pl-12 pr-4 rounded-2xl border bg-transparent outline-none transition-all",
                    theme === 'dark' ? "border-white/5 focus:border-accent/30" : "border-black/5 focus:border-black/20"
                  )}
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((session) => (
                    <motion.div
                      layout
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={cn(
                        "group p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] flex items-center gap-4",
                        theme === 'dark' ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]" : "bg-black/[0.02] border-black/5 hover:bg-black/[0.04]",
                        currentSessionId === session.id && (theme === 'dark' ? "border-accent/50 bg-accent/5" : "border-black/20 bg-black/5")
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        theme === 'dark' ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"
                      )}>
                        <MessageSquare size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-sm">{session.title}</p>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest mt-0.5">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => deleteSession(e, session.id)}
                          className={cn(
                            "p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500",
                            theme === 'dark' ? "text-white/20" : "text-black/20"
                          )}
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={16} className="opacity-20 translate-x-0 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                    <Layers size={48} className="mb-4" />
                    <p className="text-sm font-medium">No archived sessions</p>
                    <p className="text-[10px] uppercase tracking-widest mt-1">Empty cache</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full space-y-8"
            >
              <h2 className="text-3xl font-black">Settings</h2>
              
              <div className="space-y-4">
                <div className={cn("p-1 rounded-3xl border transition-colors", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-black/[0.02] border-black/5")}>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Appearance</p>
                      <p className={cn("text-xs opacity-40")}>{theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}</p>
                    </div>
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-xl",
                        theme === 'dark' ? "bg-white text-black" : "bg-black text-white"
                      )}
                    >
                      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                  </div>
                </div>

                <div className={cn("p-1 rounded-3xl border transition-colors", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-black/[0.02] border-black/5")}>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">User Identity</p>
                      <p className={cn("text-xs opacity-40 truncate max-w-[200px]")}>{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-black text-accent shrink-0">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full p-4 mt-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>

              <div className="text-center pt-8 opacity-20">
                <p className="text-[10px] uppercase font-black tracking-[0.3em]">Lightning OS x Gemini</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Layer */}
      <nav className="fixed bottom-0 inset-x-0 p-4 pb-safe pointer-events-none z-50">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          {view !== 'chat' ? (
            <div className={cn(
              "rounded-[32px] p-2 flex items-center justify-around shadow-2xl backdrop-blur-3xl border transition-colors duration-500",
              theme === 'dark' ? "bg-black/60 border-white/10" : "bg-white/80 border-black/5"
            )}>
              <NavButton 
                icon={<MessageSquare size={22} />} 
                label="Chat" 
                active={view === 'home'} 
                onClick={() => setView('chat')} 
                theme={theme}
              />
              <NavButton 
                icon={<Timer size={22} />} 
                label="Temp" 
                active={tempMode} 
                onClick={() => setTempMode(!tempMode)} 
                color={tempMode ? 'text-temp' : ''}
                theme={theme}
              />
              <div className={cn("w-px h-8 transition-colors", theme === 'dark' ? "bg-white/10" : "bg-black/5")} />
              <NavButton 
                icon={<Layers size={22} />} 
                label="All" 
                active={view === 'history'}
                onClick={() => setView('history')} 
                theme={theme}
              />
              <NavButton 
                icon={<Settings size={22} />} 
                label="Settings" 
                active={view === 'settings'}
                onClick={() => setView('settings')}
                theme={theme}
              />
            </div>
          ) : (
            <InputBar onSend={handleSend} disabled={isTyping} />
          )}
        </div>
      </nav>

      {/* Atmospheric Effects */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-20 transition-opacity duration-1000">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-all duration-1000",
          tempMode ? "bg-temp/30" : theme === 'dark' ? "bg-accent/20" : "bg-accent/40"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-all duration-1000",
          tempMode ? "bg-temp/20" : theme === 'dark' ? "bg-accent/10" : "bg-accent/20"
        )} />
      </div>

      {/* Back Button */}
      <AnimatePresence>
        {view !== 'home' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setView('home')}
            className={cn(
              "fixed top-4 left-4 z-50 w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90",
              theme === 'dark' ? "bg-zinc-900/80 border-white/10 text-white" : "bg-white/80 border-black/5 text-black"
            )}
          >
            <Plus className="rotate-45" size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ icon, label, active, onClick, color, theme }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 min-w-[70px] py-1 transition-all active:scale-90",
        active 
          ? (theme === 'dark' ? "text-white" : "text-black") 
          : (theme === 'dark' ? "text-white/40" : "text-black/40"),
        color
      )}
    >
      <div className="p-1">{icon}</div>
      <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">{label}</span>
    </button>
  );
}
