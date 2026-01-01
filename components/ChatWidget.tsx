"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react"; // Zmieniono Rocket na Send

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Cześć! Jestem ApiaryAI. W czym mogę pomóc w Twojej pasiece?' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Dodaj wiadomość użytkownika
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // 2. Symulacja "pisania" i blokada AI
    setTimeout(() => {
        const blockedMsg: Message = {
            role: 'assistant',
            content: "AI jest zablokowane do momentu pełnego uruchomienia systemu."
        };
        setMessages(prev => [...prev, blockedMsg]);
        setIsLoading(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">

      {/* OKNO CZATU */}
      {isOpen && (
        <div className="mb-4 w-[90vw] max-w-[380px] h-[500px] rounded-3xl overflow-hidden shadow-2xl border backdrop-blur-xl flex flex-col
                        bg-white/90 border-amber-900/10 dark:bg-black/80 dark:border-white/10 animate-in slide-in-from-bottom-10 fade-in">

          {/* NAGŁÓWEK - TUTAJ JEST PSZCZOŁA (Brak robota) */}
          <div className="p-4 flex items-center justify-between bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-amber-900/10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center border border-amber-500/30 overflow-hidden p-1 shadow-sm">
                    {/* ICON FIX: Bee Image */}
                    <img src="/assets/beeAI-3d-icon.png" alt="AI" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="font-bold text-amber-950 dark:text-white flex items-center gap-2 text-sm">
                        Apiary AI <Sparkles size={14} className="text-amber-500" />
                    </h3>
                    <span className="text-[10px] text-amber-900/60 dark:text-white/60 flex items-center gap-1 uppercase tracking-wider font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                    </span>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-amber-950 dark:text-white">
              <X size={18} />
            </button>
          </div>

          {/* LISTA WIADOMOŚCI */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, index) => (
              <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 px-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amber-500 text-black font-medium rounded-br-none shadow-md'
                    : 'bg-white border border-amber-900/10 text-amber-950 rounded-bl-none shadow-sm dark:bg-white/10 dark:text-gray-100 dark:border-white/10'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white/50 dark:bg-white/10 p-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-xs text-amber-900/50 dark:text-white/50">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* POLE WPISYWANIA - TUTAJ JEST STRZAŁKA (Brak rakiety) */}
          <form onSubmit={handleSubmit} className="p-3 bg-white/50 dark:bg-black/20 border-t border-amber-900/5 dark:border-white/5">
            <div className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Zadaj pytanie..."
                  disabled={isLoading}
                  className="w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none transition-all shadow-sm
                             bg-white border border-amber-900/10 text-amber-950 placeholder:text-amber-900/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                             dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-0 disabled:cursor-not-allowed shadow-sm"
                >
                  {/* ICON FIX: Send Arrow */}
                  <Send size={16} />
                </button>
            </div>
          </form>

        </div>
      )}

      {/* PRZYCISK OTWIERANIA (Floating Button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.6)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50"
      >
        {/* Main Icon - Bee */}
        <div className={`transition-all duration-300 absolute inset-0 flex items-center justify-center ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
            <img src="/assets/beeAI-3d-icon.png" alt="Chat" className="w-8 h-8 object-contain drop-shadow-md" />
        </div>

        {/* Close Icon */}
        <X size={24} className={`text-white transition-all duration-300 absolute ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
      </button>
    </div>
  );
}
