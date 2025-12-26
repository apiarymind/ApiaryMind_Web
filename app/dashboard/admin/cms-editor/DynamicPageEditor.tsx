'use client';

import { useState } from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { saveDynamicPage, deleteDynamicPage } from '@/app/actions/dynamic-pages';
import { useRouter } from 'next/navigation';

export default function DynamicPageEditor({ existingPages }: { existingPages: any[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: '',
    slug: '',
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEdit = (page: any) => {
    setFormData({
       id: page.id,
       slug: page.slug,
       title: page.title,
       content: page.content_html
    });
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę stronę?")) return;
    setLoading(true);
    try {
       const result = await deleteDynamicPage(id);
       if (result.success) {
          router.refresh();
          if (formData.id === id) {
             setFormData({ id: '', slug: '', title: '', content: '' });
          }
       } else {
          setError(result.error || "Błąd usuwania");
       }
    } catch (e) {
       setError("Błąd połączenia");
    } finally {
       setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.title || !formData.content) {
       setError("Wypełnij wszystkie pola");
       return;
    }
    
    setLoading(true);
    setError('');

    try {
      const result = await saveDynamicPage(formData.slug, formData.title, formData.content);
      if (!result.success) {
         setError(result.error || "Wystąpił błąd");
      } else {
         alert("Strona zapisana!");
         setFormData({ id: '', slug: '', title: '', content: '' }); // Reset
         router.refresh();
      }
    } catch (e) {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List of Pages */}
      <div className="lg:col-span-1">
        <GlassCard className="p-6 h-full">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Moje Strony</h3>
              <button 
                onClick={() => setFormData({ id: '', slug: '', title: '', content: '' })}
                className="text-xs bg-primary text-brown-900 px-2 py-1 rounded font-bold hover:bg-amber-400 transition-colors"
              >
                + Nowa
              </button>
           </div>
           
           {existingPages.length === 0 ? (
             <p className="text-white/40 italic">Brak stron dynamicznych</p>
           ) : (
             <ul className="space-y-3">
               {existingPages.map(page => (
                 <li key={page.id} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group relative">
                    <div onClick={() => handleEdit(page)} className="cursor-pointer">
                        <div className="font-bold text-white text-sm">{page.title}</div>
                        <div className="text-xs text-primary truncate">/{page.slug}</div>
                    </div>
                    <button 
                      onClick={() => handleDelete(page.id)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Usuń"
                    >
                      🗑️
                    </button>
                 </li>
               ))}
             </ul>
           )}
        </GlassCard>
      </div>

      {/* Editor */}
      <div className="lg:col-span-2">
         <GlassCard className="p-8">
            <h2 className="text-2xl font-bold text-primary mb-6">
               {formData.id ? "Edytuj Stronę" : "Dodaj Nową Stronę"}
            </h2>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1">Adres URL (slug)</label>
                  <input 
                    type="text" 
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                    placeholder="np. nowa-oferta"
                    disabled={!!formData.id} // Disable slug editing for simplicity on update, or allow if logic supports it
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors disabled:opacity-50"
                  />
                  {formData.id && <p className="text-[10px] text-white/40 mt-1">Slug nie może być zmieniony w trybie edycji.</p>}
               </div>

               <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1">Tytuł strony</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Wprowadź tytuł..."
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors"
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1">Treść Strony</label>
                  <textarea 
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    rows={12}
                    placeholder="Wpisz treść HTML lub tekst..."
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors resize-y font-mono text-sm"
                  />
               </div>
               
               {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

               <div className="flex justify-end pt-4 gap-4">
                  {formData.id && (
                     <button 
                       onClick={() => setFormData({ id: '', slug: '', title: '', content: '' })}
                       className="text-white/60 hover:text-white px-4 py-2"
                     >
                       Anuluj
                     </button>
                  )}
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-primary hover:bg-amber-400 text-brown-900 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? "Zapisywanie..." : "Zapisz Stronę"}
                  </button>
               </div>
            </div>
         </GlassCard>
      </div>
    </div>
  );
}
