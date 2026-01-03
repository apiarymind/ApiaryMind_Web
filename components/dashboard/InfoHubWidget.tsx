import React from 'react';
import { SystemMessage, AssociationAnnouncement } from '@/types/supabase';
import { GlassCard } from '@/app/components/ui/GlassCard';

interface InfoHubWidgetProps {
  systemMessages: SystemMessage[];
  announcements: AssociationAnnouncement[];
}

export const InfoHubWidget = ({ systemMessages, announcements }: InfoHubWidgetProps) => {
  return (
    <GlassCard className="h-full !border-yellow-500/30 !bg-yellow-500/5 flex flex-col">
       <div className="flex items-center gap-2 mb-4 pb-2 border-b border-yellow-500/20">
        <div className="text-xl">📡</div>
        <h3 className="font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider text-sm">Info Hub</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-1">
          {/* System Messages */}
          {systemMessages.map(msg => (
              <div key={msg.id} className="bg-yellow-100/50 dark:bg-amber-900/30 p-3 rounded-l border-l-4 border-yellow-500 dark:border-amber-500">
                  <h4 className="font-bold text-xs uppercase text-yellow-800 dark:text-amber-300 mb-1 flex items-center gap-2">
                     <span>SYSTEM</span>
                     {msg.priority === 'CRITICAL' && <span className="text-[10px] bg-red-500 text-white px-1 rounded">PILNE</span>}
                  </h4>
                  <p className="text-sm font-bold text-text-dark dark:text-amber-300">{msg.title}</p>
                  <p className="text-xs text-text-dark/70 dark:text-amber-200/90 mt-1">{msg.content}</p>
              </div>
          ))}

          {/* Association Announcements */}
          {announcements.map(ann => (
               <div key={ann.id} className="pl-3 border-l-2 border-gray-300 dark:border-gray-700">
                   <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 mb-1">KOŁO PSZCZELARSKIE</h4>
                   <p className="text-sm font-bold text-text-dark dark:text-white">{ann.title}</p>
                   <p className="text-xs text-text-dark/70 dark:text-gray-400 mt-1">{ann.content}</p>
               </div>
          ))}
          
           {systemMessages.length === 0 && announcements.length === 0 && (
              <p className="text-center text-xs opacity-50 py-4">Brak nowych wiadomości</p>
          )}
      </div>
    </GlassCard>
  );
};
