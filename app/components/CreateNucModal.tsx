"use client";

import { useState, useEffect } from "react";
import { X, Package, AlertCircle, CheckCircle } from "lucide-react";
import { createNucFromHive, CreateNucData } from "@/app/actions/create-nuc-from-hive";

interface CreateNucModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentHiveId: string;
  parentHiveName: string;
  inspectionId?: string;
}

export default function CreateNucModal({
  isOpen,
  onClose,
  parentHiveId,
  parentHiveName,
  inspectionId,
}: CreateNucModalProps) {
  const [nucName, setNucName] = useState("");
  const [framesRemoved, setFramesRemoved] = useState<number>(3); // Default 3 frames
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNucName("");
      setFramesRemoved(3);
      setNotes("");
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nucName.trim()) {
      setError("Nazwa odkładu jest wymagana");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const data: CreateNucData = {
      parentHiveId,
      nucName: nucName.trim(),
      framesRemoved: framesRemoved > 0 ? framesRemoved : undefined,
      notes: notes.trim() || undefined,
      inspectionId,
    };

    const result = await createNucFromHive(data);

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(result.message || "Odkład utworzony pomyślnie!");
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError(result.error || "Wystąpił błąd podczas tworzenia odkładu");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl shadow-2xl max-w-lg w-full border border-neutral-700/50 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Utwórz Odkład</h2>
              <p className="text-sm text-neutral-400">z ula: {parentHiveName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-in slide-in-from-top duration-300">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in slide-in-from-top duration-300">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Nuc Name */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Nazwa Odkładu *
            </label>
            <input
              type="text"
              value={nucName}
              onChange={(e) => setNucName(e.target.value)}
              placeholder="np. Odkład 1, Nuc A"
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              disabled={isSubmitting || !!success}
              required
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Ten odkład automatycznie odziedziczy typ ramki od ula rodzica
            </p>
          </div>

          {/* Frames Removed */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Liczba Zabranych Ramek (opcjonalnie)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={framesRemoved}
              onChange={(e) => setFramesRemoved(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              disabled={isSubmitting || !!success}
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Ile ramek zabrano z ula rodzica do odkładu?
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Notatki (opcjonalnie)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Dodatkowe informacje o odkładzie..."
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
              disabled={isSubmitting || !!success}
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <h4 className="text-sm font-semibold text-amber-300 mb-2">ℹ️ Co się stanie?</h4>
            <ul className="text-xs text-neutral-300 space-y-1">
              <li>• Zostanie utworzony nowy ul typu &ldquo;Odkład&rdquo;</li>
              <li>• Odziedziczy standard ramki od ula rodzica</li>
              <li>• Zostanie połączony z tym ulem w historii</li>
              <li>• Początkowy przegląd zostanie automatycznie dodany</li>
              {inspectionId && (
                <li>• Notatka o utworzeniu zostanie dodana do przeglądu</li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!success}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-900 font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-neutral-900/30 border-t-neutral-900 rounded-full animate-spin" />
                  Tworzenie...
                </span>
              ) : success ? (
                "Utworzono!"
              ) : (
                "Utwórz Odkład"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
