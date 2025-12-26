'use client';

import { AppSetting as AppSettingType } from "@/app/actions/admin/get-global-settings";
import { updateGlobalSetting } from "@/app/actions/admin/update-global-setting";
import { useState, useTransition } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";

export default function ConfigurationList({ settings }: { settings: AppSettingType[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {settings.map((setting) => (
        <BooleanSettingItem key={setting.id} setting={setting} />
      ))}
    </div>
  );
}

function BooleanSettingItem({ setting }: { setting: AppSettingType }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(setting.value);

  const handleToggle = () => {
    const newValue = value === 'true' ? 'false' : 'true';
    setValue(newValue);
    startTransition(async () => {
      await updateGlobalSetting(setting.key, newValue);
    });
  };

  return (
    <GlassCard className="p-4 flex items-center justify-between h-full bg-white/20 dark:bg-black/30 !border-white/10">
      <div className="mr-4">
        <h3 className="font-bold text-white font-mono text-sm break-all">{setting.key}</h3>
        {setting.description && <p className="text-xs text-white/60 mt-1">{setting.description}</p>}
      </div>

      <button 
        onClick={handleToggle}
        disabled={isPending}
        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${value === 'true' ? 'bg-primary' : 'bg-gray-600'}`}
      >
        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${value === 'true' ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </GlassCard>
  );
}
