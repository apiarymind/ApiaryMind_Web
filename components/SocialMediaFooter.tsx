import Image from 'next/image';
import type { AllSocialMedia } from '@/app/actions/get-social-media-all';

export default function SocialMediaFooter({ socialMedia }: { socialMedia: AllSocialMedia[] }) {
  const allSocialMedia = socialMedia;

  // Mapowanie platform do ich właściwości
  const platformConfig: Record<string, { name: string; icon: string; color: string }> = {
    facebook: {
      name: 'Facebook',
      icon: '/assets/social/facebook.svg',
      color: '#1877F2' // Facebook blue
    },
    youtube: {
      name: 'YouTube',
      icon: '/assets/social/youtube.svg',
      color: '#FF0000' // YouTube red
    },
    tiktok: {
      name: 'TikTok',
      icon: '/assets/social/tiktok.svg',
      color: '#000000' // TikTok black
    }
  };

  // Pobierz wszystkie platformy (aktywne i nieaktywne) dla pełnego wyświetlenia
  const allPlatforms = ['facebook', 'youtube', 'tiktok'];
  
  return (
    <div className="flex items-center gap-4">
      {allPlatforms.map((platformKey) => {
        const config = platformConfig[platformKey];
        const platformData = allSocialMedia.find(sm => sm.platform_key === platformKey);
        const isActive = platformData?.is_active === true && 
                        platformData?.target_url && 
                        platformData.target_url.trim() !== '';

        if (isActive && platformData) {
          // Scenariusz A: Aktywny - klikalny link z kolorami brandowymi
          return (
            <a
              key={platformKey}
              href={platformData.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110 duration-200"
              aria-label={config.name}
            >
              <div className="w-8 h-8 relative">
                <Image
                  src={config.icon}
                  alt={config.name}
                  fill
                  className="object-contain"
                  style={{ filter: 'none' }}
                />
              </div>
            </a>
          );
        } else {
          // Scenariusz B: Nieaktywny - szara ikona, nieklikalna
          return (
            <div
              key={platformKey}
              className="w-8 h-8 relative opacity-50 cursor-default pointer-events-none"
              aria-label={`${config.name} (nieaktywny)`}
            >
              <Image
                src={config.icon}
                alt={`${config.name} (nieaktywny)`}
                fill
                className="object-contain"
                style={{ filter: 'grayscale(100%)' }}
              />
            </div>
          );
        }
      })}
    </div>
  );
}

