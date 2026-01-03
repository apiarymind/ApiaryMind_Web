import { getGlobalSettings } from '@/app/actions/admin/get-global-settings';
import CmsEditorList from './CmsEditorList';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { listDynamicPages } from '@/app/actions/dynamic-pages';
import DynamicPageEditor from './DynamicPageEditor';
import VideoManager from './VideoManager';
import VisualCMSEditor from './VisualCMSEditor';
import PageManager from './PageManager';
import FeatureToggles from './FeatureToggles';

export default async function AdminCmsEditorPage() {
  const settings = await getGlobalSettings();
  const dynamicPages = await listDynamicPages();
  
  // Filter for text values (not boolean)
  const textSettings = settings.filter(s => s.type !== 'boolean' && s.value !== 'true' && s.value !== 'false');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-amber-950 dark:text-white mb-2">Zarządzanie Treścią</h1>
        <p className="text-amber-900/70 dark:text-gray-400">
          Edytuj strony, treści i elementy witryny bez znajomości programowania
        </p>
      </div>

      {/* SECTION 1: Feature Toggles */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white mb-2">Włącz/Wyłącz Elementy</h2>
          <p className="text-sm text-amber-900/70 dark:text-gray-400">
            Kontroluj widoczność elementów na stronie głównej
          </p>
        </div>
        <FeatureToggles />
      </div>

      {/* SECTION 2: Pages Manager - Main Section */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white mb-2">Strony</h2>
          <p className="text-sm text-amber-900/70 dark:text-gray-400">
            Twórz i zarządzaj stronami. Publikuj lub ukryj strony jednym kliknięciem.
          </p>
        </div>
        <PageManager />
      </div>

      {/* SECTION 3: Visual CMS Editor (Drag & Drop) - Collapsible */}
      <details id="visual-cms-editor" className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10 dark:border-white/5 overflow-hidden">
        <summary className="p-6 cursor-pointer hover:bg-white/5 transition-colors">
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white inline-block">
            Edytor Wizualny (Drag & Drop)
          </h2>
          <p className="text-sm text-amber-900/70 dark:text-gray-400 mt-1">
            Zaawansowane edytowanie stron poprzez przeciąganie bloków
          </p>
        </summary>
        <div className="p-6 pt-0 border-t border-white/10 dark:border-white/5">
          <VisualCMSEditor />
        </div>
      </details>

      {/* SECTION 4: Video CMS */}
      <details className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10 dark:border-white/5 overflow-hidden">
        <summary className="p-6 cursor-pointer hover:bg-white/5 transition-colors">
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white inline-block">
            Zarządzanie Wideo
          </h2>
          <p className="text-sm text-amber-900/70 dark:text-gray-400 mt-1">
            Dodawaj i zarządzaj filmami edukacyjnymi
          </p>
        </summary>
        <div className="p-6 pt-0 border-t border-white/10 dark:border-white/5">
          <VideoManager />
        </div>
      </details>

      {/* SECTION 5: Global Text Settings */}
      <details className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10 dark:border-white/5 overflow-hidden">
        <summary className="p-6 cursor-pointer hover:bg-white/5 transition-colors">
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white inline-block">
            Ustawienia Tekstowe
          </h2>
          <p className="text-sm text-amber-900/70 dark:text-gray-400 mt-1">
            Edytuj teksty strony głównej, komunikatów i innych elementów
          </p>
        </summary>
        <div className="p-6 pt-0 border-t border-white/10 dark:border-white/5">
          <CmsEditorList settings={textSettings} />
        </div>
      </details>

      {/* SECTION 6: Dynamic Pages (HTML Editor) - Advanced */}
      <details className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10 dark:border-white/5 overflow-hidden">
        <summary className="p-6 cursor-pointer hover:bg-white/5 transition-colors">
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white inline-block">
            Strony HTML (Zaawansowane)
          </h2>
          <p className="text-sm text-amber-900/70 dark:text-gray-400 mt-1">
            Edytuj strony z bezpośrednim dostępem do kodu HTML
          </p>
        </summary>
        <div className="p-6 pt-0 border-t border-white/10 dark:border-white/5">
          <DynamicPageEditor existingPages={dynamicPages} />
        </div>
      </details>
    </div>
  );
}
