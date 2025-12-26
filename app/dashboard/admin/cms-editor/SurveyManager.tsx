'use client';

import { useState } from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { createSurvey, deleteSurvey, activateSurvey, Survey } from '@/app/actions/surveys';
import { useRouter } from 'next/navigation';

export default function SurveyManager({ surveys }: { surveys: Survey[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ question: '', link: '' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.question || !form.link) return;
    setLoading(true);
    await createSurvey(form.question, form.link);
    setForm({ question: '', link: '' });
    setLoading(false);
    router.refresh();
  };

  const handleActivate = async (id: number) => {
    setLoading(true);
    await activateSurvey(id);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Usunąć ankietę?')) return;
    setLoading(true);
    await deleteSurvey(id);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Dodaj Ankietę</h3>
        <div className="space-y-4">
           <input 
             type="text" 
             placeholder="Pytanie ankiety..."
             value={form.question}
             onChange={e => setForm({...form, question: e.target.value})}
             className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary"
           />
           <input 
             type="text" 
             placeholder="Link do ankiety..."
             value={form.link}
             onChange={e => setForm({...form, link: e.target.value})}
             className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary"
           />
           <button 
             onClick={handleCreate} 
             disabled={loading}
             className="bg-primary hover:bg-amber-400 text-brown-900 font-bold py-2 px-6 rounded-full w-full"
           >
             Dodaj
           </button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Lista Ankiet</h3>
        <ul className="space-y-3">
          {surveys.map(s => (
            <li key={s.id} className={`p-4 rounded-xl border flex items-center justify-between ${s.is_active ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}>
               <div>
                  <div className="font-bold text-white text-sm">{s.question}</div>
                  <div className="text-xs text-white/40 truncate max-w-[200px]">{s.link}</div>
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => handleActivate(s.id)}
                   disabled={loading || s.is_active}
                   className={`text-xs px-2 py-1 rounded border ${s.is_active ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/10 text-white/60 hover:text-white'}`}
                 >
                   {s.is_active ? 'Aktywna' : 'Aktywuj'}
                 </button>
                 <button 
                   onClick={() => handleDelete(s.id)}
                   disabled={loading}
                   className="text-red-400 hover:text-red-300"
                 >
                   🗑️
                 </button>
               </div>
            </li>
          ))}
          {surveys.length === 0 && <p className="text-white/40 text-sm">Brak ankiet.</p>}
        </ul>
      </GlassCard>
    </div>
  );
}
