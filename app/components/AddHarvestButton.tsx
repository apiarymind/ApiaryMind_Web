"use client";

import { useState, useEffect } from "react";
import { Droplet, Loader2 } from "lucide-react";
import HoneyHarvestModal from "./hives/HoneyHarvestModal";
import { Hive } from "@/app/actions/get-hives";
import { createClient } from "@/utils/supabase/client";

interface AddHarvestButtonProps {
  hiveId: string; // ID ula (z detali)
  isDisabled?: boolean;
  disabledReason?: string;
}

export default function AddHarvestButton({ hiveId, isDisabled = false, disabledReason }: AddHarvestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hive, setHive] = useState<Hive | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobierz dane ula gdy modal się otwiera
  useEffect(() => {
    async function fetchHive() {
      if (!isOpen || hive) return; // Jeśli już mamy dane, nie pobieraj ponownie
      
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('hives')
          .select(`
            id,
            hive_number,
            apiary_id,
            inspections (
              inspection_date,
              colony_strength,
              honey_supers_count,
              frames_sealed_percent
            )
          `)
          .eq('id', hiveId)
          .single();

        if (fetchError) {
          console.error('Error fetching hive:', fetchError);
          setError('Nie udało się pobrać danych ula');
          return;
        }

        // Przetwórz dane do formatu Hive
        const inspections = data.inspections || [];
        const latestInspection = inspections.length > 0
          ? inspections.sort((a: any, b: any) => 
              new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
            )[0]
          : null;

        const hiveData: Hive = {
          id: data.id,
          hive_number: data.hive_number,
          apiary_id: data.apiary_id,
          latest_inspection: latestInspection ? {
            inspection_date: latestInspection.inspection_date,
            colony_strength: latestInspection.colony_strength,
            honey_supers_count: latestInspection.honey_supers_count,
            frames_sealed_percent: latestInspection.frames_sealed_percent,
          } : null,
        } as Hive;

        setHive(hiveData);
      } catch (err: any) {
        console.error('Unexpected error fetching hive:', err);
        setError(err.message || 'Wystąpił nieoczekiwany błąd');
      } finally {
        setIsLoading(false);
      }
    }

    fetchHive();
  }, [isOpen, hiveId, hive]);

  const handleClose = () => {
    setIsOpen(false);
    // Wyczyść dane po zamknięciu (aby przy ponownym otwarciu były świeże)
    setHive(null);
  };

  return (
    <>
      <button
        onClick={() => {
          if (!isDisabled) setIsOpen(true);
        }}
        disabled={isDisabled}
        title={isDisabled ? disabledReason : "Dodaj miodobranie dla tego ula"}
        className={`flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all ${
          isDisabled ? "opacity-50 cursor-not-allowed hover:bg-amber-600" : ""
        }`}
      >
        <Droplet className="w-5 h-5" />
        Dodaj Miodobranie
      </button>

      {/* Użyj inteligentnego modalu gdy dane są gotowe */}
      {isOpen && (
        <>
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-white">Ładowanie danych ula...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-neutral-900 border border-red-500/30 rounded-2xl p-8 max-w-md">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Zamknij
                </button>
              </div>
            </div>
          )}

          {hive && !isLoading && !error && (
            <HoneyHarvestModal
              isOpen={true}
              onClose={handleClose}
              selectedHives={[hive]} // Pojedynczy ul jako tablica
            />
          )}
        </>
      )}
    </>
  );
}
