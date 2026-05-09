import { ArrowUp, Menu, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useState, useRef, useEffect } from 'react';

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const COMMON_SUGGESTIONS = [
  "Explain Quantum Computing briefly",
  "Write a Python script for a simple calculator",
  "How do I optimize my React apps?",
  "Tell me a technical joke",
  "What is Lightning OS?",
  "Plan a minimalist workspace",
  "How to improve my typing speed"
];

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [text, setText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!disabled) {
      setLoading(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (text.trim().length > 0) {
      const filtered = COMMON_SUGGESTIONS.filter(s => 
        s.toLowerCase().includes(text.toLowerCase()) && 
        s.toLowerCase() !== text.toLowerCase()
      ).slice(0, 4);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
    setSelectedIndex(-1);
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled && !loading) {
      setLoading(true);
      onSend(text);
      setText('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!disabled && !loading) {
      setLoading(true);
      onSend(suggestion);
      setText('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(filteredSuggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="fixed bottom-6 inset-x-0 px-4 z-50">
      <div className="max-w-2xl mx-auto relative">
        {/* Suggestion Overlay */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-3 left-0 right-0 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
            >
              <div className="p-2 space-y-1">
                <div className="px-3 py-1 text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2 opacity-50">
                  <Sparkles size={10} />
                  Contextual Suggestions
                </div>
                {filteredSuggestions.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all rounded-xl",
                      selectedIndex === i ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <MessageSquare size={14} className="shrink-0 opacity-40" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form 
          onSubmit={handleSubmit}
          className="flex items-center bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 pr-3 shadow-2xl relative"
        >
          <button 
            type="button"
            className="p-3 text-white/50 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <input 
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Lightning intelligence..."
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white text-base py-3 px-2 placeholder:text-white/30"
            disabled={disabled}
          />
          <button 
            type="submit"
            disabled={!text.trim() || disabled}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              text.trim() && !disabled ? "bg-white text-black scale-100" : "bg-white/10 text-white/20 scale-90"
            )}
          >
            <ArrowUp size={20} />
          </button>
        </motion.form>
      </div>
    </div>
  );
}
