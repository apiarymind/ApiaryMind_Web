'use client';

import { AppSetting as AppSettingType } from "@/app/actions/admin/get-global-settings";
import { updateGlobalSetting } from "@/app/actions/admin/update-global-setting";
import { useState, useTransition } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";

export default function CmsEditorList({ settings }: { settings: AppSettingType[] }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {settings.map((setting) => (
        <TextSettingItem key={setting.id} setting={setting} />
      ))}
    </div>
  );
}

function TextSettingItem({ setting }: { setting: AppSettingType }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(setting.value);
  const [isDirty, setIsDirty] = useState(false);

  const handleSaveInput = () => {
    startTransition(async () => {
      await updateGlobalSetting(setting.key, value);
      setIsDirty(false);
    });
  };

  const isLongText = value.length > 50 || setting.key.toLowerCase().includes('description') || setting.key.toLowerCase().includes('content');

  return (
    <GlassCard className="p-6 flex flex-col gap-4 bg-white/20 dark:bg-black/30 !border-white/10">
      <div>
        <h3 className="font-bold text-white font-mono text-sm break-all">{setting.key}</h3>
        {setting.description && <p className="text-xs text-white/60 mt-1">{setting.description}</p>}
      </div>

      <div className="w-full">
         {isLongText ? (
           <textarea 
             value={value} 
             onChange={(e) => { setValue(e.target.value); setIsDirty(true); }}
             rows={4}
             className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-colors resize-y"
           />
         ) : (
           <input 
             type="text" 
             value={value} 
             onChange={(e) => { setValue(e.target.value); setIsDirty(true); }}
             className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-colors"
           />
         )}
      </div>
      
      {isDirty && (
         <div className="flex justify-end">
           <button 
             onClick={handleSaveInput} 
             disabled={isPending}
             className="bg-primary hover:bg-amber-400 text-brown-900 px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg"
           >
             {isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
           </button>
         </div>
      )}
    </GlassCard>
  );
}
