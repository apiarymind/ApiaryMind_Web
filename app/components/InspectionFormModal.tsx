"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertTriangle, Pill, Calendar, Thermometer, Bug, Crown } from "lucide-react";
import { getMedications, Medication } from "@/app/actions/get-medications";
import { addInspection } from "@/app/actions/add-inspection";

interface InspectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiveId: string;
}

export default function InspectionFormModal({ isOpen, onClose, hiveId }: InspectionFormModalProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState("SUNNY");
  const [temp, setTemp] = useState(20);
  const [strength, setStrength] = useState("MEDIUM");
  const [mood, setMood] = useState("CALM");
  const [broodCount, setBroodCount] = useState(5);
  const [swarming, setSwarming] = useState(false);
  const [queenSeen, setQueenSeen] = useState(true);
  const [queenMarked, setQueenMarked] = useState(true);
  const [layingPattern, setLayingPattern] = useState("SOLID");
  const [honeySupers, setHoneySupers] = useState(0);
  const [pests, setPests] = useState<string[]>([]);

  // Treatment Logic
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load medications
      setLoading(true);
      getMedications().then((data) => {
        setMedications(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMedicationId) {
      const med = medications.find(m => m.id === selectedMedicationId);
      if (med) {
         const d = new Date(date);
         d.setDate(d.getDate() + med.withdrawal_period_days);
         setWithdrawalDate(d.toLocaleDateString());
      }
    } else {
      setWithdrawalDate(null);
    }
  }, [selectedMedicationId, date, medications]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const med = medications.find(m => m.id === selectedMedicationId);
    const treatmentName = med ? med.name : undefined;
    const withdrawalDays = med ? med.withdrawal_period_days : undefined;

    const result = await addInspection({
      hive_id: hiveId,
      inspection_date: new Date(date).toISOString(),
      notes,
      weather_condition: weather,
      temperature: temp,
      colony_strength: strength,
      mood: mood,
      brood_frames_count: broodCount,
      swarming_mood: swarming,
      is_queen_seen: queenSeen,
      is_queen_marked: queenMarked,
      laying_pattern: layingPattern,
      honey_supers_count: honeySupers,
      pests_detected: pests,
      treatment_applied: treatmentName,
      withdrawal_days: withdrawalDays,
      next_visit_tasks: [] // Could add UI for this
    });

    setIsSubmitting(false);

    if (result.error) {
       alert("Błąd zapisu: " + result.error);
    } else {
       onClose();
       //Ideally trigger a toast
       // toast.success("Zapisano przegląd!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6">Nowy Przegląd</h2>

          {/* 1. Date & Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white" />
             </div>
             <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Pogoda</label>
                <select value={weather} onChange={e => setWeather(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white">
                   <option value="SUNNY">Słonecznie</option>
                   <option value="CLOUDY">Pochmurno</option>
                   <option value="RAINY">Deszczowo</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Temp (°C)</label>
                <input type="number" value={temp} onChange={e => setTemp(Number(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white" />
             </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* 2. Colony Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Siła Rodziny</label>
                <select value={strength} onChange={e => setStrength(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white">
                   <option value="WEAK">Słaba</option>
                   <option value="MEDIUM">Średnia</option>
                   <option value="STRONG">Silna</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nastrój</label>
                <select value={mood} onChange={e => setMood(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white">
                   <option value="CALM">Spokojny</option>
                   <option value="AGGRESSIVE">Agresywny</option>
                </select>
             </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* 3. Treatment Section (INTELLIGENT) */}
          <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl">
              <h3 className="font-bold text-purple-400 mb-3 flex items-center gap-2">
                  <Pill className="w-5 h-5" /> Leczenie i Profilaktyka
              </h3>

              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-purple-300/70 uppercase mb-1">Zastosowany Lek</label>
                      <select
                          value={selectedMedicationId}
                          onChange={(e) => setSelectedMedicationId(e.target.value)}
                          className="w-full bg-neutral-900 border border-purple-500/30 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500"
                      >
                          <option value="">-- Brak Leczenia --</option>
                          {medications.map(med => (
                              <option key={med.id} value={med.id}>
                                  {med.name} (Substancja: {med.active_substance})
                              </option>
                          ))}
                      </select>
                  </div>

                  {selectedMedicationId && (
                      <div className="bg-purple-500/20 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                          <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                              <p className="text-sm text-purple-200 font-bold">Uwaga: Zastosowano leczenie!</p>
                              <p className="text-xs text-purple-300 mt-1">
                                  Okres karencji wynosi <strong className="text-white">{medications.find(m => m.id === selectedMedicationId)?.withdrawal_period_days} dni</strong>.
                              </p>
                              <p className="text-xs text-purple-300 mt-1">
                                  Koniec karencji: <strong className="text-white">{withdrawalDate}</strong>.
                              </p>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* 4. Notes */}
          <div>
             <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Notatki</label>
             <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white h-24"
                placeholder="Wpisz szczegóły przeglądu..."
             />
          </div>

          <button
             type="submit"
             disabled={isSubmitting}
             className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
             {isSubmitting ? "Zapisywanie..." : "Zapisz Przegląd"}
          </button>

        </form>
      </div>
    </div>
  );
}
