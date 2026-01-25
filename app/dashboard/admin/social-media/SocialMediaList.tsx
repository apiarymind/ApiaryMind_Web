'use client';

import { SocialMediaSetting } from "@/app/actions/admin/get-social-media-settings";
import { updateSocialMediaSetting } from "@/app/actions/admin/update-social-media-setting";
import { useState, useTransition } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";

const PLATFORM_NAMES: Record<string, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok'
};

export default function SocialMediaList({ settings }: { settings: SocialMediaSetting[] }) {
  // Upewnij się, że wszystkie platformy są obecne
  const allPlatforms = ['facebook', 'youtube', 'tiktok'];
  const platformSettings = allPlatforms.map(key => {
    const existing = settings.find(s => s.platform_key === key);
    return existing || {
      id: '',
      platform_key: key,
      display_name: PLATFORM_NAMES[key] || key,
      target_url: null,
      is_active: false,
      sort_order: null,
      updated_at: null
    };
  });

  return (
    <div className="grid grid-cols-1 gap-6">
      {platformSettings.map((setting) => (
        <SocialMediaItem key={setting.platform_key} setting={setting} />
      ))}
    </div>
  );
}

function SocialMediaItem({ setting }: { setting: SocialMediaSetting }) {
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState(setting.target_url || '');
  const [isActive, setIsActive] = useState(setting.is_active);
  const [isDirty, setIsDirty] = useState(false);

  const platformName = PLATFORM_NAMES[setting.platform_key] || setting.platform_key;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setIsDirty(true);
    // Jeśli URL jest pusty, automatycznie wyłącz aktywność
    if (!newUrl || newUrl.trim() === '') {
      setIsActive(false);
    }
  };

  const handleToggle = () => {
    // Nie pozwól na włączenie, jeśli URL jest pusty
    if (!url || url.trim() === '') {
      return;
    }
    const newActive = !isActive;
    setIsActive(newActive);
    setIsDirty(true);
  };

  const handleSave = () => {
    // Walidacja: nie pozwól zapisać aktywnego statusu bez URL
    const finalIsActive = url && url.trim() !== '' ? isActive : false;
    
    startTransition(async () => {
      const result = await updateSocialMediaSetting(
        setting.platform_key,
        url.trim() || null,
        finalIsActive
      );
      
      if (result.success) {
        setIsDirty(false);
        if (finalIsActive !== isActive) {
          setIsActive(finalIsActive);
        }
      } else {
        alert(`Błąd: ${result.error}`);
      }
    });
  };

  const isUrlEmpty = !url || url.trim() === '';

  return (
    <GlassCard className="p-4 bg-white/20 dark:bg-black/30 !border-white/10">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-text-dark dark:text-amber-100 text-lg mb-1">
            {platformName}
          </h3>
          <p className="text-xs text-text-dark/60 dark:text-amber-200/60">
            {setting.platform_key}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-white/50 dark:bg-black/40 border border-gray-300 dark:border-brown-600 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 outline-none focus:border-primary transition-colors"
            />
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={isPending}
                className="bg-primary hover:bg-amber-400 text-brown-900 px-4 py-2 rounded text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? '...' : 'Zapisz'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-text-dark dark:text-amber-200">
              Status aktywny
            </label>
            <button
              onClick={handleToggle}
              disabled={isPending || isUrlEmpty}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                isActive && !isUrlEmpty
                  ? 'bg-primary'
                  : 'bg-gray-400 dark:bg-gray-600'
              } ${isUrlEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isUrlEmpty ? 'Wprowadź URL, aby aktywować' : ''}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                  isActive && !isUrlEmpty ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isUrlEmpty && isActive && (
            <p className="text-xs text-amber-500 dark:text-amber-400">
              ⚠️ URL jest wymagany, aby ustawić status na aktywny
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}




