import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    // Simulate brief login delay
    setTimeout(() => {
      onLoginSuccess({ 
        email: `${username.toLowerCase()}@lightning.ai`,
        nickname: username,
        id: Math.random().toString(36).substr(2, 9)
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,224,255,0.1),transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl relative">
            <span className="text-3xl text-[#facc15] drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">⚡</span>
            <div className="absolute -inset-1 bg-accent/20 blur-xl animate-pulse -z-10 rounded-full" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Lightning <span className="text-accent">OS</span></h1>
          <p className="text-white/40 text-sm italic">"Speed is the ultimate sophistication"</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Enter your nickname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-white/20"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
              />
            ) : (
              <>
                Initialize Session
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-6 pt-4 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
          <span>Local Sync Only</span>
          <div className="w-1 h-1 bg-white/10 rounded-full" />
          <span>V1.4.0</span>
        </div>
      </motion.div>
    </div>
  );
}
