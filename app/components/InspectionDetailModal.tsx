"use client"

import { GlassCard } from "@/app/components/ui/GlassCard"
import { Check, X, CloudRain, Cloud, Sun, Wind, Thermometer, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import { Inspection } from "@/types/supabase"

interface InspectionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  inspection: Inspection | null
}

export default function InspectionDetailModal({ isOpen, onClose, inspection }: InspectionDetailModalProps) {
  if (!isOpen || !inspection) return null

  // Helper to map DB enums to Labels/Colors
  const weatherIcons: Record<string, React.ReactNode> = {
    SUNNY: <Sun className="h-5 w-5 text-yellow-500" />,
    CLOUDY: <Cloud className="h-5 w-5 text-gray-400" />,
    RAINY: <CloudRain className="h-5 w-5 text-blue-400" />,
    WINDY: <Wind className="h-5 w-5 text-gray-300" />,
  }

  const weatherLabels: Record<string, string> = {
    SUNNY: "Słonecznie",
    CLOUDY: "Pochmurno",
    RAINY: "Deszczowo",
    WINDY: "Wietrznie",
  }

  const strengthLabels: Record<string, string> = {
    WEAK: "SŁABA",
    MEDIUM: "ŚREDNIA",
    STRONG: "SILNA",
  }

  const moodLabels: Record<string, string> = {
    CALM: "SPOKOJNY",
    AGGRESSIVE: "AGRESYWNY",
  }

  const layingPatternLabels: Record<string, string> = {
    SOLID: "Zwarte",
    SPOTTY: "Rozstrzelone",
  }

  const strengthColors: Record<string, string> = {
    WEAK: "bg-red-500/20 text-red-400 border-red-500/50",
    MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    STRONG: "bg-green-500/20 text-green-400 border-green-500/50",
  }

  const moodColors: Record<string, string> = {
    CALM: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    AGGRESSIVE: "bg-red-500/20 text-red-400 border-red-500/50",
  }

  const inspectionDateTime = new Date(inspection.inspection_date)
  const relativeTime = formatDistanceToNow(inspectionDateTime, { addSuffix: true, locale: pl })

  // Safe accessors for possibly missing optional fields
  const weather = (inspection.weather_condition as string) || 'SUNNY';
  const strength = (inspection.colony_strength as string) || 'MEDIUM';
  const mood = (inspection.mood as string) || 'CALM';
  const laying = (inspection.laying_pattern as string) || 'SOLID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6 space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">Raport Przeglądu</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-neutral-400">
               <span>{format(inspectionDateTime, "dd MMM yyyy, HH:mm", { locale: pl })}</span>
               <span className="hidden sm:inline">•</span>
               <span>{relativeTime}</span>
            </div>
            {inspection.swarming_mood && (
                <div className="mt-2 inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1.5 rounded-lg text-red-400 font-bold w-fit">
                  <AlertTriangle className="h-4 w-4" />
                  UWAGA: NASTRÓJ ROJOWY
                </div>
            )}
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Environmental Conditions */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-yellow-500">Warunki</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
                <Thermometer className="h-6 w-6 text-neutral-400" />
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase">Temperatura</p>
                  <p className="text-xl font-bold text-white">{inspection.temperature ?? '--'}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
                {weatherIcons[weather] || <Sun className="h-6 w-6 text-neutral-400" />}
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase">Pogoda</p>
                  <p className="text-xl font-bold text-white">{weatherLabels[weather] || weather}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-neutral-800" />

          {/* Colony Status */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-yellow-500">Rodzina</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-neutral-500 uppercase">Siła Rodziny</span>
                <span className={`text-sm font-bold px-3 py-1 rounded border ${strengthColors[strength] || 'text-white border-neutral-600'}`}>
                  {strengthLabels[strength] || strength}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-neutral-500 uppercase">Nastrój</span>
                <span className={`text-sm font-bold px-3 py-1 rounded border ${moodColors[mood] || 'text-white border-neutral-600'}`}>
                  {moodLabels[mood] || mood}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-neutral-500 uppercase">Ramki z Czerwiem</span>
                <span className="text-sm font-bold px-3 py-1 rounded border border-neutral-600 bg-neutral-800 text-white text-center min-w-[3rem]">
                  {inspection.brood_frames_count ?? 0}
                </span>
              </div>
            </div>
          </section>

          <div className="h-px bg-neutral-800" />

          {/* Queen & Biological Status */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-yellow-500">Matka Pszczela</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/30 border border-neutral-700">
                <span className="text-sm font-bold text-neutral-300">Matka Widziana?</span>
                {inspection.is_queen_seen ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/30 border border-neutral-700">
                <span className="text-sm font-bold text-neutral-300">Matka Znakowana?</span>
                {inspection.is_queen_marked ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/30 border border-neutral-700 sm:col-span-2">
                <span className="text-sm font-bold text-neutral-300">Czerwienie</span>
                <span className="bg-neutral-800 text-white text-xs font-bold px-2 py-1 rounded border border-neutral-600">
                  {layingPatternLabels[laying] || laying}
                </span>
              </div>
              {inspection.swarming_mood && inspection.swarming_date && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-900/10 border border-red-500/30 sm:col-span-2">
                  <span className="text-sm font-bold text-red-400">Data Wyjścia Rójki</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(inspection.swarming_date), "dd MMM yyyy", { locale: pl })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="h-px bg-neutral-800" />

          {/* Inventory & Production */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-yellow-500">Miodnia i Zapasy</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700">
                  <p className="text-xs font-bold text-neutral-500 mb-1">Korpusy</p>
                  <p className="text-2xl font-bold text-white">{inspection.honey_supers_count ?? 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700">
                  <p className="text-xs font-bold text-neutral-500 mb-1">Półnadstawki</p>
                  <p className="text-2xl font-bold text-white">{inspection.half_supers_count ?? 0}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-neutral-300">Zasklepienie Miodu</span>
                  <span className="text-lg font-bold text-yellow-500">{inspection.frames_sealed_percent ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${inspection.frames_sealed_percent ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-neutral-800" />

          {/* Health & Treatments */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-yellow-500">Zdrowie</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-neutral-500 mb-2 uppercase">Wykryte Szkodniki</p>
                <div className="flex flex-wrap gap-2">
                  {inspection.pests_detected && inspection.pests_detected.length > 0 ? (
                    inspection.pests_detected.map((pest: string, index: number) => (
                      <span key={index} className="bg-red-500/20 text-red-400 border border-red-500/50 text-xs font-bold px-2 py-1 rounded">
                        {pest}
                      </span>
                    ))
                  ) : (
                    <span className="bg-green-500/20 text-green-400 border border-green-500/50 text-xs font-bold px-2 py-1 rounded">
                      Brak Szkodników
                    </span>
                  )}
                </div>
              </div>
              {inspection.treatment_applied && (
                <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
                  <p className="text-xs font-bold text-neutral-500 mb-1 uppercase">Zastosowane Leczenie</p>
                  <p className="text-sm font-semibold text-white">{inspection.treatment_applied}</p>
                </div>
              )}
            </div>
          </section>

          <div className="h-px bg-neutral-800" />

          {/* Notes & Tasks */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-yellow-500">Notatki</h3>
            <div className="space-y-4">
              {inspection.notes && (
                <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
                  <p className="text-xs font-bold text-neutral-500 mb-2 uppercase">Notatka</p>
                  <p className="text-sm leading-relaxed text-neutral-300">{inspection.notes}</p>
                </div>
              )}
              {/* Note: next_visit_tasks is array of strings in DB schema (_text), but snippet used object.
                  Schema says: next_visit_tasks ARRAY _text.
                  I will assume it is string[]. */}
              {inspection.next_visit_tasks && inspection.next_visit_tasks.length > 0 && (
                <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
                  <p className="text-xs font-bold text-neutral-500 mb-3 uppercase">Zadania na następną wizytę</p>
                  <div className="space-y-2">
                    {inspection.next_visit_tasks.map((task: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-sm border-2 border-neutral-600" />
                        <span className="text-sm text-neutral-300">
                          {task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
