'use client';

import { AppSetting as AppSettingType } from "@/app/actions/admin/get-global-settings";
import { updateGlobalSetting } from "@/app/actions/admin/update-global-setting";
import { useState, useTransition } from "react";

export default function SettingsList({ settings }: { settings: AppSettingType[] }) {
  return (
    <div className="space-y-4">
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
    <div className="bg-brown-800 p-4 rounded-xl border border-brown-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-amber-100 font-mono text-sm">{setting.key}</h3>
        {setting.description && <p className="text-xs text-amber-200/60 mt-1">{setting.description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {setting.type === 'boolean' ? (
          <button 
            onClick={handleToggle}
            disabled={isPending}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${value === 'true' ? 'bg-green-600' : 'bg-brown-600'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${value === 'true' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        ) : (
          <div className="flex gap-2">
             <input 
               type="text" 
               value={value} 
               onChange={(e) => { setValue(e.target.value); setIsDirty(true); }}
               className="bg-brown-900 border border-brown-600 rounded px-2 py-1 text-sm text-amber-100 w-48"
             />
             {isDirty && (
               <button 
                 onClick={handleSaveInput} 
                 disabled={isPending}
                 className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-xs font-bold"
               >
                 {isPending ? '...' : 'Save'}
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
