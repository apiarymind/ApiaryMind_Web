import { getGlobalSettings } from '@/app/actions/admin/get-global-settings';
import CmsEditorList from './CmsEditorList';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { listDynamicPages } from '@/app/actions/dynamic-pages';
import DynamicPageEditor from './DynamicPageEditor';
import { listSurveys } from '@/app/actions/surveys';
import SurveyManager from './SurveyManager';

export default async function AdminCmsEditorPage() {
  const settings = await getGlobalSettings();
  const dynamicPages = await listDynamicPages();
  const surveys = await listSurveys();
  
  // Filter for text values (not boolean)
  const textSettings = settings.filter(s => s.type !== 'boolean' && s.value !== 'true' && s.value !== 'false');

  return (
    <div className="space-y-12 pb-12">
      
      {/* SECTION 1: Dynamic Pages */}
      <div>
         <h1 className="text-3xl font-heading font-bold text-primary mb-6">CMS - Dynamiczne Strony</h1>
         <DynamicPageEditor existingPages={dynamicPages} />
      </div>

      {/* SECTION 2: Survey System (Module 3) */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 border-t border-white/10 pt-8">Ankiety i Sondy</h2>
        <SurveyManager surveys={surveys} />
      </div>

      {/* SECTION 3: Global Text Settings (Includes Landing & News) */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 border-t border-white/10 pt-8">Ustawienia Globalne (Landing, News)</h2>
        <GlassCard className="p-6">
           <p className="text-white/60 mb-6 text-sm">
             Edytuj treści strony głównej, komunikaty panelu i inne teksty.
           </p>
           <CmsEditorList settings={textSettings} />
        </GlassCard>
      </div>
    </div>
  );
}
