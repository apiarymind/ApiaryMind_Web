"use client";

import { useState } from "react";

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: "Cześć! Jestem Twoim asystentem pasiecznym. W czym mogę pomóc?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");

    // Mock API call
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "To jest przykładowa odpowiedź. Backend AI nie jest jeszcze podłączony." }]);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-40 border-2 border-brown-900 overflow-hidden p-2"
        title="Asystent AI"
      >
        <img src="/assets/beeAI-3d-icon.png" alt="AI" className="w-full h-full object-contain" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-brown-800 rounded-xl shadow-2xl border border-brown-700 z-40 flex flex-col overflow-hidden max-h-[500px]">
      <div className="bg-brown-900 p-3 border-b border-brown-700 flex justify-between items-center">
        <h3 className="font-bold text-amber-500 flex items-center gap-2">🤖 Asystent ApiaryMind</h3>
        <button onClick={() => setIsOpen(false)} className="text-amber-200 hover:text-white">✕</button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-brown-900/50 h-64">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-2 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-amber-500 text-brown-900 font-medium' 
                : 'bg-brown-700 text-amber-100'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-brown-700 bg-brown-800">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-brown-900 border border-brown-700 rounded px-3 py-2 text-sm text-amber-100 focus:border-amber-500 outline-none"
            placeholder="Zapytaj o pszczoły..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="text-xl hover:scale-110 transition-transform">🚀</button>
        </div>
      </form>
    </div>
  );
}
