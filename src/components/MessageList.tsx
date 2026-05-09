import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';
import { Message } from '../lib/gemini';
import { useEffect, useRef } from 'react';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  activeMessage?: string;
  theme: 'dark' | 'light';
}

export default function MessageList({ messages, isTyping, activeMessage, theme }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeMessage, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 pt-20">
      <AnimatePresence initial={false}>
        {messages.map((msg, i) => (
          <motion.div
            key={`${msg.role}-${i}-${msg.isTemp ? 'temp' : 'stable'}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? (theme === 'dark' ? "bg-accent text-black ml-auto rounded-tr-none" : "bg-black text-white ml-auto rounded-tr-none")
                : (theme === 'dark' ? "bg-white/[0.03] border border-white/5 mr-auto rounded-tl-none" : "bg-white border border-black/5 mr-auto rounded-tl-none"),
              msg.isTemp && "border-temp/40 shadow-[0_0_15px_rgba(255,170,0,0.15)]"
            )}
          >
            <div className={cn(
              "prose prose-sm max-w-none break-words",
              theme === 'dark' ? "prose-invert" : "prose-zinc"
            )}>
              <ReactMarkdown>
                {msg.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}

        {/* Current Active Streaming Message */}
        {activeMessage && (
          <motion.div
            key="active-message-stream"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "max-w-[85%] p-5 rounded-3xl rounded-tl-none text-sm leading-relaxed",
              theme === 'dark' ? "bg-white/[0.03] border border-white/5 mr-auto" : "bg-white border border-black/5 mr-auto"
            )}
          >
            <div className={cn(
              "prose prose-sm max-w-none break-words",
              theme === 'dark' ? "prose-invert" : "prose-zinc"
            )}>
              <ReactMarkdown>
                {activeMessage}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}

        {isTyping && !activeMessage && (
          <motion.div
            key="typing-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mr-auto p-4 rounded-2xl rounded-tl-none",
              theme === 'dark' ? "bg-white/[0.03] border border-white/5" : "bg-black/[0.02] border-black/5"
            )}
          >
            <div className="flex space-x-2">
              <div className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} key="bottom-anchor" />
      </AnimatePresence>
    </div>
  );
}
