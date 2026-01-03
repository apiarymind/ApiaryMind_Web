'use client'

import { useState, useEffect } from 'react';
import { getVisualCMSPages, saveVisualCMSPage, deleteVisualCMSPage, CMSPage } from '@/app/actions/visual-cms';
import { Edit2, Trash2, Eye, EyeOff, Plus, Globe, FileText, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PageManager() {
  const router = useRouter();
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    setError(null);
    const result = await getVisualCMSPages();
    if (result.error) {
      setError(result.error);
    } else {
      setPages(result.data || []);
    }
    setLoading(false);
  };

  const handleTogglePublished = async (page: CMSPage) => {
    const updatedPage = {
      ...page,
      published: !page.published,
    };
    
    setLoading(true);
    const result = await saveVisualCMSPage(updatedPage);
    if (result.success) {
      await loadPages();
    } else {
      setError(result.error || 'Błąd aktualizacji');
    }
    setLoading(false);
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę stronę? Ta operacja jest nieodwracalna.')) {
      return;
    }

    setLoading(true);
    const result = await deleteVisualCMSPage(pageId);
    if (result.success) {
      await loadPages();
    } else {
      setError(result.error || 'Błąd usuwania');
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && pages.length === 0) {
    return (
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-8 border border-white/10 dark:border-white/5">
        <div className="text-center text-white/60">Ładowanie stron...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white">Zarządzanie Stronami</h2>
          <p className="text-sm text-amber-900/70 dark:text-gray-400 mt-1">
            Twórz, edytuj i zarządzaj widocznością stron
          </p>
        </div>
        <button
          onClick={() => {
            // Scroll to Visual CMS Editor section
            const editorSection = document.getElementById('visual-cms-editor');
            if (editorSection) {
              (editorSection as HTMLDetailsElement).open = true;
              editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nowa Strona
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Pages List */}
      {pages.length === 0 ? (
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-8 border border-white/10 dark:border-white/5 text-center">
          <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60 mb-4">Brak utworzonych stron</p>
          <button
            onClick={() => {
              // Scroll to Visual CMS Editor section
              const editorSection = document.getElementById('visual-cms-editor');
              if (editorSection) {
                (editorSection as HTMLDetailsElement).open = true;
                editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Utwórz Pierwszą Stronę
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border transition-colors ${
                page.published
                  ? 'border-green-500/30 dark:border-green-500/30'
                  : 'border-white/10 dark:border-white/5'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Page Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-amber-950 dark:text-white flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      {page.title || 'Bez tytułu'}
                    </h3>
                    {page.published ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Opublikowana
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold rounded border border-gray-500/30 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Nieopublikowana
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-white/60">
                    <p>
                      <span className="font-medium">URL:</span>{' '}
                      <code className="bg-white/5 px-2 py-1 rounded text-amber-400">/cms/{page.slug}</code>
                    </p>
                    <p>
                      <span className="font-medium">Bloki:</span> {page.blocks?.length || 0}
                    </p>
                    {page.updated_at && (
                      <p>
                        <span className="font-medium">Ostatnia edycja:</span> {formatDate(page.updated_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublished(page)}
                    className={`p-2 rounded-lg transition-colors ${
                      page.published
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30'
                    }`}
                    title={page.published ? 'Ukryj stronę' : 'Opublikuj stronę'}
                  >
                    {page.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      // Scroll to Visual CMS Editor and open it
                      const editorSection = document.getElementById('visual-cms-editor');
                      if (editorSection) {
                        (editorSection as HTMLDetailsElement).open = true;
                        editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // Store page ID in sessionStorage to select it in VisualCMSEditor
                        sessionStorage.setItem('cms_selected_page', page.id);
                        // Small delay before reload to allow scroll
                        setTimeout(() => window.location.reload(), 500);
                      }
                    }}
                    className="p-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors border border-amber-500/30"
                    title="Edytuj stronę"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <a
                    href={`/cms/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-500/30"
                    title="Podgląd strony"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30"
                    title="Usuń stronę"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

