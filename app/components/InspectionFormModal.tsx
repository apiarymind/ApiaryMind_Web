'use client';

import { useState, useEffect } from 'react';
import { Inspection } from '@/types/supabase';
import { X, Save, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface InspectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousInspection?: Inspection | null;
  hiveId: string;
}

export default function InspectionFormModal({ isOpen, onClose, previousInspection, hiveId }: InspectionFormModalProps) {
  const [formData, setFormData] = useState({
    inspection_date: new Date().toISOString().split('T')[0],
    is_queen_seen: false,
    brood_frames_count: 0,
    colony_strength: 'MEDIUM',
    mood: 'CALM',
    notes: ''
  });

  const [alert, setAlert] = useState<{ type: 'YELLOW' | 'RED' | null; message: string }>({ type: null, message: '' });

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      // Default values or reset
      setFormData({
        inspection_date: new Date().toISOString().split('T')[0],
        is_queen_seen: false, // Defaulting to false as per common check flow, or true if preferred
        brood_frames_count: previousInspection?.brood_frames_count ?? 0, // Default to previous count
        colony_strength: 'MEDIUM',
        mood: 'CALM',
        notes: ''
      });
    }
  }, [isOpen, previousInspection]);

  // SMART QUEEN ALERT LOGIC
  useEffect(() => {
    // Only run logic if queen is NOT seen
    if (!formData.is_queen_seen && previousInspection) {
      const prevBrood = previousInspection.brood_frames_count || 0;
      const currentBrood = formData.brood_frames_count;

      const HIGH_BROOD_THRESHOLD = 5; // "e.g., 6" (User said 5 or 6 is still High)
      const DROP_THRESHOLD = 3;       // "e.g., <= 3"

      // Scenario A: Queen hidden, brood stable
      // Prev High, Curr High
      if (prevBrood >= HIGH_BROOD_THRESHOLD && currentBrood >= HIGH_BROOD_THRESHOLD) {
         setAlert({
            type: 'YELLOW',
            message: "Matka niewidoczna, ale czerw stabilny. Prawdopodobnie się ukryła. Do obserwacji."
         });
         return;
      }

      // Scenario B: Critical Drop
      // Prev High, Curr Low
      if (prevBrood >= HIGH_BROOD_THRESHOLD && currentBrood <= DROP_THRESHOLD) {
         setAlert({
            type: 'RED',
            message: "ALARM: Drastyczny spadek czerwiu! Matka prawdopodobnie nie żyje. ZAMÓW NOWĄ!"
         });
         return;
      }
    }

    // Default: Clear alert if conditions not met or queen is seen
    setAlert({ type: null, message: '' });

  }, [formData.is_queen_seen, formData.brood_frames_count, previousInspection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900">
           <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Nowy Przegląd</h2>
           <button onClick={onClose} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-neutral-500" />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">

           {/* Date */}
           <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Data Przeglądu</label>
              <input
                 type="date"
                 value={formData.inspection_date}
                 onChange={(e) => setFormData(prev => ({ ...prev, inspection_date: e.target.value }))}
                 className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
              />
           </div>

           {/* Queen Seen Toggle */}
           <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
               <div>
                  <span className="block font-bold text-neutral-900 dark:text-white">Czy widziałeś matkę?</span>
                  <span className="text-xs text-neutral-500">Zaznacz, jeśli udało się ją zlokalizować.</span>
               </div>
               <button
                  onClick={() => setFormData(prev => ({ ...prev, is_queen_seen: !prev.is_queen_seen }))}
                  className={`relative w-14 h-8 rounded-full transition-colors ${formData.is_queen_seen ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
               >
                  <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.is_queen_seen ? 'translate-x-6' : 'translate-x-0'}`} />
               </button>
           </div>

           {/* Brood Frames */}
           <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Ilość ramek z czerwiem</label>
              <div className="flex items-center gap-4">
                 <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.brood_frames_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, brood_frames_count: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                 />
                 <span className="text-sm text-neutral-500 whitespace-nowrap">
                    (Poprzednio: {previousInspection?.brood_frames_count ?? '--'})
                 </span>
              </div>
           </div>

           {/* SMART ALERT DISPLAY */}
           {alert.type && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top-2
                 ${alert.type === 'RED'
                    ? 'bg-red-500/10 border-red-500/50 text-red-500'
                    : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400'
                 }`}
              >
                 {alert.type === 'RED' ? <AlertOctagon className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
                 <div>
                    <h4 className="font-bold uppercase text-sm">{alert.type === 'RED' ? 'ALARM KRYTYCZNY' : 'OSTRZEŻENIE'}</h4>
                    <p className="text-sm mt-1 font-medium leading-relaxed">{alert.message}</p>
                 </div>
              </div>
           )}

           {/* Notes */}
           <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Notatki</label>
              <textarea
                 rows={3}
                 value={formData.notes}
                 onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                 className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                 placeholder="Dodatkowe obserwacje..."
              />
           </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex justify-end gap-3">
           <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 dark:text-neutral-400 font-bold hover:text-neutral-900 dark:hover:text-white transition-colors"
           >
              Anuluj
           </button>
           <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
              onClick={() => {
                 console.log("Saving inspection...", formData);
                 onClose();
              }}
           >
              <Save className="w-4 h-4" />
              Zapisz Przegląd
           </button>
        </div>
      </div>
    </div>
  );
}
