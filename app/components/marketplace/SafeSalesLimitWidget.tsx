"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { getSafeSalesLimit, SafeSalesLimitData } from "@/app/actions/get-safe-sales-limit";

export default function SafeSalesLimitWidget() {
  const [data, setData] = useState<SafeSalesLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getSafeSalesLimit();
        if (result.error) {
          setError(result.error);
        } else {
          setData(result.data);
        }
      } catch (err: any) {
        setError(err.message || "Nie udało się pobrać danych");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-primary/30 shadow-lg dark:shadow-none">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-primary/20 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-primary/20 rounded w-1/4 mb-4"></div>
          <div className="h-2 bg-gray-200 dark:bg-primary/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-xl p-6 shadow-lg dark:shadow-none">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
          <AlertTriangle size={20} />
          <span className="font-bold">Błąd pobierania danych</span>
        </div>
        <p className="text-red-700 dark:text-red-300/80 text-sm mt-2">{error || "Nieznany błąd"}</p>
      </div>
    );
  }

  // Handle case where there are no hives
  if (data.totalHives === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-xl p-6 shadow-lg dark:shadow-none">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400">Pozostały Bezpieczny Limit Sprzedaży (RHD)</h3>
        </div>
        <p className="text-gray-800 dark:text-white/80 text-sm">Brak uli. Przypisz ule do pasieki, aby wyliczyć limit RHD.</p>
      </div>
    );
  }

  const isOverLimit = data.soldWeightKg > data.safeLimitKg;
  const isWarning = data.usagePercentage >= 80;
  const progressColor = isOverLimit 
    ? "bg-red-500" 
    : isWarning 
    ? "bg-amber-500" 
    : "bg-green-500";
  
  const borderColor = isOverLimit
    ? "border-red-400 dark:border-red-500/30"
    : isWarning
    ? "border-amber-400 dark:border-amber-500/30"
    : "border-green-400 dark:border-green-500/30";
  
  const bgColor = isOverLimit
    ? "bg-red-50 dark:bg-red-500/10"
    : isWarning
    ? "bg-amber-50 dark:bg-amber-500/10"
    : "bg-green-50 dark:bg-green-500/10";

  return (
    <div className={`${bgColor} border ${borderColor} backdrop-blur-md rounded-xl p-6 shadow-lg dark:shadow-none`}>
      <div className="flex items-center gap-2 mb-4">
        {isOverLimit ? (
          <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-400" />
        )}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pozostały Bezpieczny Limit Sprzedaży (RHD)</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.remainingKg.toFixed(1)}
          </span>
          <span className="text-lg text-gray-700 dark:text-white/70">kg</span>
        </div>
        <p className="text-sm text-gray-700 dark:text-white/60">
          Limit: {data.safeLimitKg} kg ({data.totalHives} uli × 35 kg) | 
          Sprzedano: {data.soldWeightKg.toFixed(1)} kg
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-200 dark:bg-primary/20 rounded-full h-3 overflow-hidden">
          <div
            className={`${progressColor} h-full transition-all duration-300`}
            style={{
              width: `${Math.min(100, data.usagePercentage)}%`,
            }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-700 dark:text-white/60">
        <span>{data.usagePercentage.toFixed(1)}% wykorzystania</span>
        {isOverLimit && (
          <span className="text-red-700 dark:text-red-400 font-bold">Przekroczono limit!</span>
        )}
        {isWarning && !isOverLimit && (
          <span className="text-amber-700 dark:text-amber-400 font-bold">Zbliżasz się do limitu</span>
        )}
      </div>
    </div>
  );
}
