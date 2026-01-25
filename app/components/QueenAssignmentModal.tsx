"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Check, Scan } from "lucide-react";
import { assignQueenByCode, createQueenAndAssign } from "@/app/actions/queen-management";
import { useRouter } from "next/navigation";

interface QueenAssignmentModalProps {
  isOpen: boolean;
  hiveId: string;
  onClose: () => void;
}

export default function QueenAssignmentModal({ isOpen, hiveId, onClose }: QueenAssignmentModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"PASSPORT" | "MANUAL">("PASSPORT");
  const [passportCode, setPassportCode] = useState("");
  const [manualYear, setManualYear] = useState<number>(new Date().getFullYear());
  const [manualColor, setManualColor] = useState("YELLOW");
  const [manualLineage, setManualLineage] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorOptions = useMemo(
    () => [
      { id: "WHITE", label: "Biały", className: "bg-white border-gray-300 text-gray-800" },
      { id: "YELLOW", label: "Żółty", className: "bg-yellow-300 border-yellow-400 text-gray-900" },
      { id: "RED", label: "Czerwony", className: "bg-red-400 border-red-500 text-white" },
      { id: "GREEN", label: "Zielony", className: "bg-green-400 border-green-500 text-white" },
      { id: "BLUE", label: "Niebieski", className: "bg-blue-400 border-blue-500 text-white" },
    ],
    []
  );

  useEffect(() => {
    if (!manualYear) return;
    const digit = manualYear % 10;
    const autoColor =
      digit === 1 || digit === 6
        ? "WHITE"
        : digit === 2 || digit === 7
          ? "YELLOW"
          : digit === 3 || digit === 8
            ? "RED"
            : digit === 4 || digit === 9
              ? "GREEN"
              : "BLUE";
    setManualColor(autoColor);
  }, [manualYear]);

  const handleAssignPassport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await assignQueenByCode(hiveId, passportCode);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Nie udało się przypisać matki.");
      return;
    }

    onClose();
    router.refresh();
  };

  const handleAssignManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!manualYear || manualYear < 2000) {
      setError("Podaj poprawny rok.");
      setLoading(false);
      return;
    }

    if (!manualLineage.trim()) {
      setError("Podaj rasę lub linię.");
      setLoading(false);
      return;
    }

    const result = await createQueenAndAssign({
      hiveId,
      year: manualYear,
      markingColor: manualColor,
      lineage: manualLineage.trim(),
      description: manualDescription.trim() || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Nie udało się dodać matki.");
      return;
    }

    onClose();
    router.refresh();
  };

  const handleScanPrompt = () => {
    const value = window.prompt("Wklej kod z QR");
    if (value) {
      setPassportCode(value.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 space-y-5">
          <h2 className="text-xl font-bold text-white">Przypisz Matkę do Ula</h2>

          <div className="flex gap-2 rounded-lg bg-neutral-800 p-1">
            <button
              type="button"
              onClick={() => setMode("PASSPORT")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                mode === "PASSPORT" ? "bg-amber-500 text-black" : "text-neutral-300 hover:text-white"
              }`}
            >
              Mam paszport / kod
            </button>
            <button
              type="button"
              onClick={() => setMode("MANUAL")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                mode === "MANUAL" ? "bg-amber-500 text-black" : "text-neutral-300 hover:text-white"
              }`}
            >
              Własna / inna
            </button>
          </div>

          {mode === "PASSPORT" && (
            <form onSubmit={handleAssignPassport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Kod 6-znakowy</label>
                <input
                  type="text"
                  value={passportCode}
                  onChange={(e) => setPassportCode(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white"
                  placeholder="Wpisz kod z paszportu"
                />
              </div>
              <button
                type="button"
                onClick={handleScanPrompt}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Scan className="w-4 h-4" />
                Skanuj QR
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Przypisz Matkę
              </button>
            </form>
          )}

          {mode === "MANUAL" && (
            <form onSubmit={handleAssignManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Rok</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={manualYear}
                  onChange={(e) => setManualYear(Number(e.target.value))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Oznaczenie (kolor)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setManualColor(option.id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${option.className} ${
                        manualColor === option.id ? "ring-2 ring-amber-500" : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Rasa / Linia</label>
                <input
                  type="text"
                  value={manualLineage}
                  onChange={(e) => setManualLineage(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white"
                  placeholder="np. Buckfast / Linia A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Opis / Pochodzenie</label>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white h-20"
                  placeholder="Opcjonalnie"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Dodaj Własną
              </button>
            </form>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
