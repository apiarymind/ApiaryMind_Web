'use client';

import { Shield, ShieldAlert, Cloud, Sun, CloudRain, CloudSnow, CloudFog, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ApiaryStatusBarProps {
  apiaryId: string;
  locationGeo: string | null;
  hasQuarantine: boolean;
  tasksToday: number;
  hivesCount: number; // Number of hives in apiary
}

interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
}

// Mapowanie kodów WMO na ikony
function getWeatherIcon(code: number) {
  if (code === 0) return <Sun className="w-4 h-4 text-amber-600 dark:text-yellow-400" />;
  if (code >= 1 && code <= 3) return <Cloud className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
  if (code === 45 || code === 48) return <CloudFog className="w-4 h-4 text-gray-500 dark:text-gray-300" />;
  if (code >= 51 && code <= 67) return <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="w-4 h-4 text-blue-500 dark:text-blue-200" />;
  if (code >= 95 && code <= 99) return <Zap className="w-4 h-4 text-amber-500 dark:text-yellow-300" />;
  return <Cloud className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
}

export function ApiaryStatusBar({
  apiaryId,
  locationGeo,
  hasQuarantine,
  tasksToday,
  hivesCount,
}: ApiaryStatusBarProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    // Nie pobieraj pogody dla pasiek bez uli (optymalizacja)
    if (hivesCount === 0) {
      setWeatherLoading(false);
      setWeather(null);
      return;
    }

    if (!locationGeo) {
      setWeatherLoading(false);
      return;
    }

    // Parsuj współrzędne
    const parts = locationGeo.split(',');
    if (parts.length !== 2) {
      setWeatherLoading(false);
      return;
    }

    const latitude = parseFloat(parts[0].trim());
    const longitude = parseFloat(parts[1].trim());

    if (isNaN(latitude) || isNaN(longitude)) {
      setWeatherLoading(false);
      return;
    }

    // Pobierz pogodę z Open-Meteo (tylko dla pasiek z ulami)
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            apparentTemperature: Math.round(data.current.apparent_temperature),
            weatherCode: data.current.weather_code,
          });
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [locationGeo, hivesCount]); // Dodaj hivesCount jako dependency

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-300 dark:border-white/5">
      {/* Status Weterynaryjny */}
      {hasQuarantine ? (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-400 dark:border-red-500/50 text-red-800 dark:text-red-400 text-xs font-semibold animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Trwa karencja!</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/20 border border-green-400 dark:border-green-500/50 text-green-800 dark:text-green-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Brak karencji</span>
        </div>
      )}

      {/* Pogoda - TYLKO dla pasiek z ulami */}
      {hivesCount > 0 ? (
        <>
          {weatherLoading ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-600 dark:text-white/40 text-xs">
              <Cloud className="w-3.5 h-3.5 animate-pulse" />
              <span>...</span>
            </div>
          ) : weather ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-white/80 text-xs">
              {getWeatherIcon(weather.weatherCode)}
              <span className="font-semibold">{weather.temperature}°C</span>
              <span className="text-gray-600 dark:text-white/50 text-[10px]">(Odcz.: {weather.apparentTemperature}°C)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-600 dark:text-white/40 text-xs">
              <Cloud className="w-3.5 h-3.5" />
              <span>Brak danych</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-600 dark:text-white/40 text-xs">
          <span className="opacity-50">Brak uli</span>
        </div>
      )}

      {/* Zadania na dziś */}
      {tasksToday > 0 ? (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-500/20 border border-orange-400 dark:border-orange-500/50 text-orange-800 dark:text-orange-400 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Zadania na dziś: {tasksToday}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/40 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Brak zadań na dziś</span>
        </div>
      )}
    </div>
  );
}

