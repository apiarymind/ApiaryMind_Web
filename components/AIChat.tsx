"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, Send, Sparkles } from "lucide-react";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Powitanie
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Cześć! Jestem BiBi, twój asystent AI. W czym mogę pomóc w Twojej pasiece?' }
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

    // 2. Symulacja blokady
    setTimeout(() => {
        const blockedMsg: Message = { 
            role: 'assistant', 
            content: "Obecnie jestem zablokowany. Czekam na pełne uruchomienie systemu." 
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
                        bg-white/80 border-amber-900/10 dark:bg-black/80 dark:border-white/10 animate-in slide-in-from-bottom-10 fade-in transition-all">
          
          {/* NAGŁÓWEK */}
          <div className="p-4 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-b border-amber-900/5 dark:border-white/5">
            <div className="flex items-center gap-3">
                {/* POPRAWKA 2: Usunięto szare tło (bg-white/50) i ramkę */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden transition-transform hover:scale-105 relative">
                    <Image src="/assets/beeAI-3d-icon.png" alt="AI Pszczoła" fill className="object-cover drop-shadow-sm" />
                </div>
                <div>
                    <h3 className="font-bold text-amber-950 dark:text-white flex items-center gap-2 text-base">
                        BiBi <Sparkles size={16} className="text-amber-500" />
                    </h3>
                    <span className="text-[11px] text-amber-900/60 dark:text-white/60 flex items-center gap-1 uppercase tracking-wider font-bold">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50"></span> Online
                    </span>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-amber-950 dark:text-white">
              <X size={20} />
            </button>
          </div>

          {/* LISTA WIADOMOŚCI */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
            {messages.map((m, index) => (
              <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-3 px-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black font-medium rounded-br-sm shadow-md shadow-amber-500/20' 
                    : 'bg-white/80 backdrop-blur-sm border border-amber-900/5 text-amber-950 rounded-bl-sm shadow-sm dark:bg-white/10 dark:text-gray-100 dark:border-white/10'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
                <div className="flex justify-start animate-in fade-in">
                    <div className="bg-white/50 dark:bg-white/10 p-3 rounded-2xl rounded-bl-sm flex items-center gap-2 text-xs text-amber-900/50 dark:text-white/50">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* POLE WPISYWANIA */}
          <form onSubmit={handleSubmit} className="p-3 bg-white/40 dark:bg-black/40 border-t border-amber-900/5 dark:border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Zadaj pytanie..."
                  disabled={isLoading}
                  className="w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none transition-all shadow-sm
                             bg-white/80 border border-amber-900/10 text-amber-950 placeholder:text-amber-900/40 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20
                             dark:bg-black/50 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-0 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={18} /> 
                </button>
            </div>
          </form>

        </div>
      )}

      {/* POPRAWKA 1: PRZYCISK OTWIERANIA - TERAZ JEST SZKLANY (Glassmorphism) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        // Zmieniono bg-gradient na backdrop-blur i przezroczyste tła
        className="group relative w-14 h-14 rounded-full backdrop-blur-xl bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center overflow-hidden"
      >
        {/* Ikona pszczoły */}
        <div className={`transition-all duration-500 absolute inset-0 flex items-center justify-center ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100 drop-shadow-md'}`}>
            <Image src="/assets/beeAI-3d-icon.png" alt="Chat" width={36} height={36} className="object-contain" />
        </div>
        
        {/* Ikona zamknięcia (X) - kolor dopasowuje się do tła */}
        <X size={24} className={`text-amber-950 dark:text-white transition-all duration-500 absolute ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
      </button>
    </div>
  );
}