'use server'

import { createClient } from '@/utils/supabase/server';
import { getApiaryWeather, WeatherData } from './get-weather';

// Definicja typu potrzebna dla Frontendu
export interface Apiary {
  id: string;
  name: string;
  type: string | null;
  location: string | null; // location_geo z bazy (mapowane dla kompatybilności z frontendem)
  hives?: { count: number }[]; // Opcjonalnie do wyświetlania licznika
  weather?: {
    temp: number;
    condition: string; // np. 'cloudy', 'sunny', 'rain'
    description?: string;
  };
}

/**
 * Generuje mock danych pogodowych (używany gdy pasieka nie ma location_geo)
 */
function generateMockWeather(): WeatherData {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isSummer = currentMonth >= 6 && currentMonth <= 8;
  const isWinter = currentMonth >= 12 || currentMonth <= 2;
  const isSpring = currentMonth >= 3 && currentMonth <= 5;
  const isAutumn = currentMonth >= 9 && currentMonth <= 11;

  let baseTemp = 15; // Średnia temperatura bazowa
  const conditions = ['sunny', 'cloudy', 'partly_cloudy', 'rain', 'fog'];
  let preferredConditions = ['sunny', 'partly_cloudy'];

  if (isSummer) {
    baseTemp = 20 + Math.floor(Math.random() * 15); // 20-35°C
    preferredConditions = ['sunny', 'partly_cloudy', 'cloudy'];
  } else if (isWinter) {
    baseTemp = -5 + Math.floor(Math.random() * 10); // -5 do 5°C
    preferredConditions = ['cloudy', 'fog', 'partly_cloudy'];
  } else if (isSpring) {
    baseTemp = 10 + Math.floor(Math.random() * 15); // 10-25°C
    preferredConditions = ['partly_cloudy', 'sunny', 'rain'];
  } else if (isAutumn) {
    baseTemp = 5 + Math.floor(Math.random() * 15); // 5-20°C
    preferredConditions = ['cloudy', 'rain', 'partly_cloudy'];
  }

  const condition = preferredConditions[Math.floor(Math.random() * preferredConditions.length)];

  // Mapowanie na polskie nazwy
  const conditionLabels: Record<string, string> = {
    sunny: 'Słonecznie',
    cloudy: 'Pochmurno',
    partly_cloudy: 'Częściowo zachmurzone',
    rain: 'Deszczowo',
    fog: 'Mgła',
  };

  return {
    temperature: baseTemp,
    condition: conditionLabels[condition] || condition,
    description: conditionLabels[condition]?.toLowerCase() || condition,
    source: 'Mock (Symulacja)',
  };
}

export async function getUserApiaries(): Promise<{ data: Apiary[] | null; error: string | null }> {
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'Nie jesteś zalogowany' };
    }

    // Pobieramy pasieki wraz z liczbą uli (count) i location_geo
    // NAPRAWKA: Używamy owner_id zamiast user_id (zgodnie ze schematem bazy)
    // NAPRAWKA: Filtrujemy usunięte pasieki (Best Practice)
    // DODANE: Pobieramy location_geo dla danych pogodowych
    const { data, error } = await supabase
      .from('apiaries')
      .select(`
        id,
        name,
        type,
        location_geo,
        hives:hives(count)
      `)
      .eq('owner_id', user.id)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) {
      console.error('Błąd pobierania pasiek:', error);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Wzbogacenie danych o informacje pogodowe
    // Dla każdej pasieki pobierz pogodę (lub użyj mocka, jeśli nie ma location_geo)
    const apiariesWithWeather: Apiary[] = await Promise.all(
      data.map(async (apiary: any) => {
        let weatherData: WeatherData | null = null;

        // Jeśli pasieka ma location_geo, pobierz prawdziwe dane pogodowe
        if (apiary.location_geo) {
          const weatherResult = await getApiaryWeather(apiary.location_geo);
          if (weatherResult.data) {
            weatherData = weatherResult.data;
          } else {
            // Jeśli nie udało się pobrać pogody, użyj mocka
            console.warn(`Nie udało się pobrać pogody dla pasieki ${apiary.id}:`, weatherResult.error);
            weatherData = generateMockWeather();
          }
        } else {
          // Jeśli pasieka nie ma location_geo, użyj mocka
          weatherData = generateMockWeather();
        }

        // Mapowanie danych pogodowych do formatu oczekiwanego przez frontend
        const weather = weatherData
          ? (() => {
              // Konwersja polskich nazw na angielskie kody dla spójności
              const conditionMap: Record<string, string> = {
                'słonecznie': 'sunny',
                'pochmurno': 'cloudy',
                'częściowo zachmurzone': 'partly_cloudy',
                'deszczowo': 'rain',
                'mgła': 'fog',
                'sunny': 'sunny',
                'cloudy': 'cloudy',
                'partly_cloudy': 'partly_cloudy',
                'rain': 'rain',
                'fog': 'fog',
              };

              const normalizedCondition = weatherData.condition.toLowerCase();
              const conditionCode = conditionMap[normalizedCondition] || normalizedCondition.replace(/\s+/g, '_');

              return {
                temp: weatherData.temperature,
                condition: conditionCode, // np. 'cloudy', 'sunny', 'rain'
                description: weatherData.description,
              };
            })()
          : undefined;

        return {
          id: apiary.id,
          name: apiary.name,
          type: apiary.type,
          location: apiary.location_geo, // Mapowanie location_geo -> location dla kompatybilności
          hives: apiary.hives,
          weather: weather,
        };
      })
    );

    return { data: apiariesWithWeather, error: null };

  } catch (err) {
    console.error('Nieoczekiwany błąd podczas pobierania pasiek:', err);
    return { data: null, error: 'Błąd serwera podczas pobierania pasiek' };
  }
}
