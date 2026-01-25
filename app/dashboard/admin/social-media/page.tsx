import { getSocialMediaSettings } from '@/app/actions/admin/get-social-media-settings';
import SocialMediaList from './SocialMediaList';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function AdminSocialMediaPage() {
  const settings = await getSocialMediaSettings();

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Media Społecznościowe</h1>
      
      <GlassCard className="p-6">
        <p className="text-text-dark/60 dark:text-amber-200/60 mb-6 text-sm">
          Zarządzaj linkami do mediów społecznościowych wyświetlanymi w stopce strony. 
          Jeśli pole URL jest puste, status automatycznie zostanie ustawiony na nieaktywny.
        </p>
        
        <SocialMediaList settings={settings} />
      </GlassCard>
    </div>
  );
}




