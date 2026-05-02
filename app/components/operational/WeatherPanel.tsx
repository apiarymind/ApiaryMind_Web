'use client';

import { Cloud, CloudRain, Sun, Wind, Thermometer, Droplets, CloudSnow, Zap, CloudFog } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WeatherPanelProps {
  locationGeo: string | null;
}

interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    windSpeed: number;
    precipitation: number;
  };
  forecast: Array<{
    date: string;
    temperature: number;
    condition: string;
    windSpeed: number;
    precipitation: number;
  }>;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    precipitation: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
}

// Mapowanie kodów WMO na opisy i typy warunków
function getWeatherFromCode(code: number): { condition: string; label: string } {
  if (code === 0) {
    return { condition: 'SUNNY', label: 'Bezchmurnie' };
  }
  if (code >= 1 && code <= 3) {
    return { condition: 'CLOUDY', label: 'Zachmurzenie umiarkowane' };
  }
  if (code === 45 || code === 48) {
    return { condition: 'FOGGY', label: 'Mgła' };
  }
  if (code >= 51 && code <= 67) {
    return { condition: 'RAINY', label: 'Deszcz' };
  }
  if (code >= 71 && code <= 77) {
    return { condition: 'SNOWY', label: 'Śnieg' };
  }
  if (code >= 95 && code <= 99) {
    return { condition: 'THUNDERSTORM', label: 'Burza' };
  }
  // Domyślnie zachmurzenie
  return { condition: 'CLOUDY', label: 'Pochmurno' };
}

/**
 * Parsuje location_geo z dwóch formatów:
 *   1. "lat,lng"  – plain string (np. "50.178,19.216")
 *   2. JSON obj   – {"lat":50.178,"lon":19.216} lub {"lat":…,"lng":…}
 *      Akceptuje też Python repr z apostrofami: {'lat':50.178,'lon':19.216}
 */
function parseLocationGeo(raw: string | null): { lat: number; lng: number } | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();

  // ── Próba 1: plain "lat,lng" ──────────────────────────────────────────────
  const commaIdx = trimmed.indexOf(',');
  if (commaIdx !== -1 && !trimmed.startsWith('{')) {
    const lat = parseFloat(trimmed.slice(0, commaIdx).trim());
    const lng = parseFloat(trimmed.slice(commaIdx + 1).trim());
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // ── Próba 2: JSON object (standard lub Python-style apostrofy) ────────────
  try {
    const jsonStr = trimmed.replace(/'/g, '"');
    const obj = JSON.parse(jsonStr);
    if (obj && typeof obj === 'object') {
      const lat = parseFloat(obj.lat ?? obj.latitude ?? obj.y);
      const lng = parseFloat(obj.lng ?? obj.lon ?? obj.longitude ?? obj.x);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  } catch {
    // niepoprawny JSON — ignoruj
  }

  return null;
}

export function WeatherPanel({ locationGeo }: WeatherPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationGeo) {
      setLoading(false);
      setError('Brak danych lokalizacyjnych');
      return;
    }

    // Parsuj współrzędne — obsługuje "lat,lng" i JSON (w tym Python repr)
    const coords = parseLocationGeo(locationGeo);

    if (!coords) {
      setLoading(false);
      setError('Nieprawidłowy format współrzędnych');
      return;
    }

    const latitude = coords.lat;
    const longitude = coords.lng;

    // Fetch danych z Open-Meteo API
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Błąd pobierania danych pogodowych');
        }

        const data: OpenMeteoResponse = await response.json();

        // Mapuj dane z API na format komponentu
        const currentWeather = getWeatherFromCode(data.current.weather_code);
        const currentPrecipitation = data.current.precipitation || 0;

        const forecast = data.daily.time.slice(0, 7).map((date, index) => {
          const dailyCode = data.daily.weather_code[index];
          const dailyWeather = getWeatherFromCode(dailyCode);
          const maxTemp = data.daily.temperature_2m_max[index];
          const minTemp = data.daily.temperature_2m_min[index];
          // Użyj średniej z max i min jako temperatura dla dnia
          const avgTemp = Math.round((maxTemp + minTemp) / 2);
          const dailyPrecipitation = data.daily.precipitation_sum?.[index] || 0;
          const dailyWind = data.daily.wind_speed_10m_max?.[index] || data.current.wind_speed_10m;

          return {
            date: new Date(date).toISOString(),
            temperature: avgTemp,
            condition: dailyWeather.condition,
            windSpeed: Math.round(dailyWind),
            precipitation: Math.round(dailyPrecipitation * 10) / 10, // Konwersja na mm
          };
        });

        setWeather({
          current: {
            temperature: Math.round(data.current.temperature_2m),
            condition: currentWeather.condition,
            windSpeed: Math.round(data.current.wind_speed_10m),
            precipitation: Math.round(currentPrecipitation * 10) / 10, // Konwersja na mm
          },
          forecast,
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Nie udało się pobrać danych pogodowych');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [locationGeo]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'SUNNY':
        return <Sun className="w-6 h-6 text-yellow-400" />;
      case 'CLOUDY':
        return <Cloud className="w-6 h-6 text-gray-400" />;
      case 'RAINY':
        return <CloudRain className="w-6 h-6 text-blue-400" />;
      case 'SNOWY':
        return <CloudSnow className="w-6 h-6 text-blue-200" />;
      case 'FOGGY':
        return <CloudFog className="w-6 h-6 text-gray-300" />;
      case 'THUNDERSTORM':
        return <Zap className="w-6 h-6 text-yellow-300" />;
      default:
        return <Cloud className="w-6 h-6 text-gray-400" />;
    }
  };

  const getWeatherLabel = (condition: string) => {
    switch (condition) {
      case 'SUNNY':
        return 'Bezchmurnie';
      case 'CLOUDY':
        return 'Pochmurno';
      case 'RAINY':
        return 'Deszcz';
      case 'SNOWY':
        return 'Śnieg';
      case 'FOGGY':
        return 'Mgła';
      case 'THUNDERSTORM':
        return 'Burza';
      default:
        return 'Pochmurno';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 h-[400px] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Cloud className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-text-muted">Warunki Pogodowe</h3>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-amber-200/60">Ładowanie danych pogodowych...</div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Cloud className="w-12 h-12 text-amber-400/30 mx-auto mb-2" />
            <p className="text-amber-200/60 text-sm">{error}</p>
          </div>
        </div>
      ) : weather ? (
        <>
          {/* Current Weather - Large Display */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getWeatherIcon(weather.current.condition)}
                <div>
                  <p className="text-xs text-amber-200/60 uppercase">Teraz</p>
                  <p className="text-2xl font-bold text-text-muted">
                    {weather.current.temperature}°C
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-amber-200/80">
                  {getWeatherLabel(weather.current.condition)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Wind className="w-4 h-4 text-amber-400/60" />
                <span className="text-amber-200/80">
                  Wiatr: {weather.current.windSpeed} km/h
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4 text-blue-400/60" />
                <span className="text-amber-200/80">
                  Opady: {weather.current.precipitation} mm
                </span>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <p className="text-xs font-bold text-amber-200/60 uppercase mb-3">
              Prognoza 7 dni
            </p>
            <div className="space-y-2">
              {weather.forecast.map((day, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getWeatherIcon(day.condition)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-muted">
                        {formatDate(day.date)}
                      </p>
                      <p className="text-xs text-amber-200/60">
                        {getWeatherLabel(day.condition)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-amber-400/60" />
                      <span className="text-text-muted">{day.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-amber-400/60" />
                      <span className="text-amber-200/80">{day.windSpeed} km/h</span>
                    </div>
                    {day.precipitation > 0 && (
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-400/60" />
                        <span className="text-amber-200/80">{day.precipitation}mm</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-amber-200/60 text-sm">
            Brak danych pogodowych dla tej lokalizacji.
          </p>
        </div>
      )}
    </div>
  );
}

