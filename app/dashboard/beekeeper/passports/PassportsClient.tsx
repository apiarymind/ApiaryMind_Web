"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { Download, Check, Ban, RefreshCw } from "lucide-react";
import { getProductionManifests } from "@/app/actions/production-exit-updated";
import { downloadManifestPDF } from "@/app/actions/generate-pdf";
import { getPassportQueens, updateQueenStatuses } from "@/app/actions/queen-management";
import { BreedingManifest, Queen } from "@/types/supabase";

export default function PassportsClient() {
  const [manifests, setManifests] = useState<BreedingManifest[]>([]);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [loadingManifests, setLoadingManifests] = useState(true);

  const [queens, setQueens] = useState<Queen[]>([]);
  const [queenError, setQueenError] = useState<string | null>(null);
  const [loadingQueens, setLoadingQueens] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingManifests(true);
    getProductionManifests()
      .then((result) => {
        if (result.error) {
          setManifestError(result.error);
        } else {
          setManifests(result.data || []);
        }
      })
      .finally(() => setLoadingManifests(false));
  }, []);

  const loadQueens = () => {
    setLoadingQueens(true);
    getPassportQueens()
      .then((result) => {
        if (result.error) {
          setQueenError(result.error);
        } else {
          setQueens(result.data || []);
        }
      })
      .finally(() => setLoadingQueens(false));
  };

  useEffect(() => {
    loadQueens();
  }, []);

  const shortCode = (id: string) => id.slice(0, 6).toUpperCase();

  const handleDownload = async (manifestId: string) => {
    const result = await downloadManifestPDF(manifestId);
    if (!result.success || !result.pdfBlob) {
      setManifestError(result.error || "Nie udało się pobrać PDF.");
      return;
    }
    const link = document.createElement("a");
    link.href = result.pdfBlob;
    link.download = `manifest-${shortCode(manifestId)}.pdf`;
    link.click();
  };

  const handleScan = async () => {
    const input = scanInput.trim();
    setScanError(null);
    if (!input) return;

    const match = queens.find((q) => {
      const code = shortCode(q.id);
      const marking = (q.marking_code || "").toLowerCase();
      return q.id.startsWith(input) || code === input.toUpperCase() || marking === input.toLowerCase();
    });

    if (!match) {
      setScanError("Nie znaleziono paszportu o podanym kodzie.");
      return;
    }

    const result = await updateQueenStatuses([match.id], "ARCHIVED");
    if (!result.success) {
      setScanError(result.error || "Nie udało się zaktualizować statusu.");
      return;
    }

    setQueens((prev) =>
      prev.map((q) => (q.id === match.id ? { ...q, status: "ARCHIVED" } : q))
    );
    setSelectedIds((prev) => (prev.includes(match.id) ? prev : [...prev, match.id]));
    setScanInput("");
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    const result = await updateQueenStatuses(selectedIds, status);
    if (!result.success) {
      setQueenError(result.error || "Nie udało się zaktualizować statusów.");
      return;
    }
    setQueens((prev) =>
      prev.map((q) => (selectedIds.includes(q.id) ? { ...q, status } : q))
    );
    setSelectedIds([]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const statusLabel = (status?: string | null) => {
    switch ((status || "IN_TRANSIT").toUpperCase()) {
      case "ARCHIVED":
        return "DOSTĘPNA";
      case "DECEASED":
        return "USZKODZONA";
      case "IN_TRANSIT":
        return "W TRANSPORCIE";
      default:
        return status || "NIEZNANY";
    }
  };

  const statusBadge = (status?: string | null) => {
    const label = statusLabel(status);
    const isAvailable = label === "DOSTĘPNA";
    const isDamaged = label === "USZKODZONA";
    const className = isAvailable
      ? "bg-green-500/20 text-green-300 border-green-500/40"
      : isDamaged
        ? "bg-red-500/20 text-red-300 border-red-500/40"
        : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    return <span className={`text-xs font-bold px-2 py-1 rounded border ${className}`}>{label}</span>;
  };

  const manifestsByDate = useMemo(
    () => [...manifests].sort((a, b) => (b.generated_at || "").localeCompare(a.generated_at || "")),
    [manifests]
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paszporty</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Paszport = manifest wysyłkowy. Jest aktywny i widoczny także po dodaniu matki do ula.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manifesty wysyłkowe</h2>
        {manifestError && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-sm text-red-300">
            {manifestError}
          </div>
        )}
        {loadingManifests ? (
          <div className="text-sm text-gray-500">Ładowanie manifestów...</div>
        ) : manifestsByDate.length === 0 ? (
          <div className="text-sm text-gray-500">Brak wygenerowanych manifestów.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {manifestsByDate.map((manifest) => {
              const series = manifest.series;
              const mother = series?.breeding_mother;
              return (
                <div
                  key={manifest.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase text-gray-500">Kod paszportu</div>
                      <div className="text-2xl font-bold text-amber-600">{shortCode(manifest.id)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Wygenerowano: {new Date(manifest.generated_at).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                      {manifest.qr_code_payload ? (
                        <QRCode value={manifest.qr_code_payload} size={90} />
                      ) : (
                        <div className="text-xs text-gray-400">Brak QR</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Ilość:</span>{" "}
                      <span className="font-semibold">{manifest.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Przeznaczenie:</span>{" "}
                      <span className="font-semibold">{manifest.destination_type || "Brak"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Seria:</span>{" "}
                      <span className="font-semibold">{series?.name || series?.id?.slice(0, 8) || "Brak"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start serii:</span>{" "}
                      <span className="font-semibold">
                        {series?.start_date ? new Date(series.start_date).toLocaleDateString("pl-PL") : "Brak"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                    <div className="text-xs uppercase text-gray-500 mb-2">Dane hodowlane</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Matka:</span>{" "}
                        <span className="font-semibold">{mother?.name || "Brak"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Linia:</span>{" "}
                        <span className="font-semibold">{mother?.line || "Brak"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rasa:</span>{" "}
                        <span className="font-semibold">{mother?.breed || "Brak"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rocznik:</span>{" "}
                        <span className="font-semibold">{mother?.year || "Brak"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Metoda:</span>{" "}
                        <span className="font-semibold">{mother?.insemination_method || "Brak"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Matka założycielka:</span>{" "}
                        <span className="font-semibold">{mother?.mother_ref_number || "Brak"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Linia ojca:</span>{" "}
                        <span className="font-semibold">{mother?.father_line || "Brak"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">WNI:</span>{" "}
                        <span className="font-semibold">{mother?.breeder_wni || "Brak"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Świadectwo:</span>{" "}
                        <span className="font-semibold">{mother?.certificate_number || "Brak"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDownload(manifest.id)}
                      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Pobierz manifest PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Odbiór partii (Paszporty)</h2>
        <p className="text-sm text-gray-500">
          Lista posortowana po ID. Zeskanowanie ustawia status DOSTĘPNA / W PASIECE.
        </p>

        {queenError && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-sm text-red-300">
            {queenError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            className="w-full sm:max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
            placeholder="Wpisz ID / short code / oznakowanie"
          />
          <button
            onClick={handleScan}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg"
          >
            Zeskanuj
          </button>
          <button
            onClick={loadQueens}
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold px-4 py-2 rounded-lg inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Odśwież
          </button>
        </div>

        {scanError && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-sm text-red-300">
            {scanError}
          </div>
        )}

        {loadingQueens ? (
          <div className="text-sm text-gray-500">Ładowanie paszportów...</div>
        ) : queens.length === 0 ? (
          <div className="text-sm text-gray-500">Brak paszportów do odbioru.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkUpdate("ARCHIVED")}
                disabled={selectedIds.length === 0}
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Oznacz jako dostępne
              </button>
              <button
                onClick={() => handleBulkUpdate("DECEASED")}
                disabled={selectedIds.length === 0}
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                Pomiń (uszkodzone)
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
              {queens.map((queen) => (
                <div key={queen.id} className="flex items-center justify-between p-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(queen.id)}
                      onChange={() => toggleSelection(queen.id)}
                      className="accent-amber-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {shortCode(queen.id)} • {queen.marking_code || "Brak oznakowania"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {queen.year ? `Rocznik ${queen.year}` : "Brak rocznika"} • {queen.lineage || "Brak linii"}
                      </div>
                    </div>
                  </label>
                  {statusBadge(queen.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
