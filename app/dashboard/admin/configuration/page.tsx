import { getGlobalSettings } from '@/app/actions/admin/get-global-settings';
import ConfigurationList from './ConfigurationList';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function AdminConfigurationPage() {
  const settings = await getGlobalSettings();
  
  // Filter for boolean values (true/false)
  const booleanSettings = settings.filter(s => s.type === 'boolean' || s.value === 'true' || s.value === 'false');

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Konfiguracja Systemu</h1>
      
      <GlassCard className="p-6">
         <p className="text-white/60 mb-6 text-sm">
           Zarządzaj flagami systemowymi (włącz/wyłącz).
         </p>
         
         <ConfigurationList settings={booleanSettings} />
      </GlassCard>
    </div>
  );
}
