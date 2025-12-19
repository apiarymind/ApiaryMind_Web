'use client';

import { AppSetting as AppSettingType } from "@/app/actions/admin/get-global-settings";
import { updateGlobalSetting } from "@/app/actions/admin/update-global-setting";
import { useState, useTransition } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";

export default function SettingsList({ settings }: { settings: AppSettingType[] }) {
  // Use a Grid Layout as requested
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {settings.map((setting) => (
        <SettingItem key={setting.id} setting={setting} />
      ))}
    </div>
  );
}

function SettingItem({ setting }: { setting: AppSettingType }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(setting.value);
  const [isDirty, setIsDirty] = useState(false);

  const handleToggle = () => {
    const newValue = value === 'true' ? 'false' : 'true';
    setValue(newValue);
    startTransition(async () => {
      await updateGlobalSetting(setting.key, newValue);
      setIsDirty(false);
    });
  };

  const handleSaveInput = () => {
    startTransition(async () => {
      await updateGlobalSetting(setting.key, value);
      setIsDirty(false);
    });
  };

  return (
    <GlassCard className="p-4 flex flex-col justify-between h-full bg-white/20 dark:bg-black/30 !border-white/10">
      <div className="mb-4">
        <h3 className="font-bold text-text-dark dark:text-amber-100 font-mono text-sm break-all">{setting.key}</h3>
        {setting.description && <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">{setting.description}</p>}
      </div>

      <div className="flex items-center justify-end">
        {setting.type === 'boolean' ? (
          <button 
            onClick={handleToggle}
            disabled={isPending}
            // OFF: Gray (bg-gray-400 or similar), ON: Brand Gold (bg-primary)
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${value === 'true' ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'}`}
          >
            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${value === 'true' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        ) : (
          <div className="flex gap-2 w-full">
             <input 
               type="text" 
               value={value} 
               onChange={(e) => { setValue(e.target.value); setIsDirty(true); }}
               className="flex-1 bg-white/50 dark:bg-black/40 border border-gray-300 dark:border-brown-600 rounded px-2 py-1 text-sm text-text-dark dark:text-amber-100 outline-none focus:border-primary transition-colors"
             />
             {isDirty && (
               <button 
                 onClick={handleSaveInput} 
                 disabled={isPending}
                 className="bg-primary hover:bg-amber-400 text-brown-900 px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm"
               >
                 {isPending ? '...' : 'Save'}
               </button>
             )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
