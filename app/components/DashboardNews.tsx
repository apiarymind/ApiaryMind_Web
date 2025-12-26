'use client';

import { GlassCard } from '@/app/components/ui/GlassCard';
import { useState } from 'react';
import { X } from 'lucide-react';

interface DashboardNewsProps {
  content: string;
  position: 'top_banner' | 'modal_popup' | 'sidebar_widget' | 'hidden';
}

export default function DashboardNews({ content, position }: DashboardNewsProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!content || position === 'hidden' || !isVisible) return null;

  if (position === 'top_banner') {
    return (
      <div className="w-full bg-primary/20 border-b border-primary/30 backdrop-blur-md px-4 py-3 flex items-center justify-between animate-fade-in-down mb-4">
         <div className="flex items-center gap-3 text-white text-sm">
           <span className="bg-primary text-brown-900 font-bold px-2 py-0.5 rounded text-xs uppercase">Info</span>
           <span>{content}</span>
         </div>
         <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white">
           <X size={16} />
         </button>
      </div>
    );
  }

  if (position === 'modal_popup') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
         <GlassCard className="max-w-md w-full p-8 mx-4 relative bg-black/90 border-primary/50 shadow-[0_0_50px_rgba(244,181,36,0.2)]">
            <button 
              onClick={() => setIsVisible(false)} 
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-primary text-4xl mb-4 text-center">🔔</div>
            <h3 className="text-xl font-bold text-white mb-4 text-center">Komunikat</h3>
            <p className="text-white/80 text-center mb-6 leading-relaxed">
              {content}
            </p>
            <button 
              onClick={() => setIsVisible(false)}
              className="w-full bg-primary hover:bg-amber-400 text-brown-900 font-bold py-3 rounded-xl transition-colors"
            >
              Zrozumiałem
            </button>
         </GlassCard>
      </div>
    );
  }

  if (position === 'sidebar_widget') {
    return (
      <div className="px-4 py-2">
         <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 relative">
            <button 
                onClick={() => setIsVisible(false)} 
                className="absolute top-2 right-2 text-primary/40 hover:text-primary transition-colors"
            >
               <X size={12} />
            </button>
            <div className="flex items-center gap-2 mb-2">
               <span className="text-lg">📢</span>
               <span className="text-xs font-bold text-primary uppercase">Ogłoszenie</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
               {content}
            </p>
         </div>
      </div>
    );
  }

  return null;
}
