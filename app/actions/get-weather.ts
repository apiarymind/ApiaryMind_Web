"use server";

export interface WeatherData {
  temperature: number; // Celsius
  condition: string; // e.g., "Pochmurno", "Słonecznie", "Deszczowo"
  description?: string;
  source: string; // e.g., "OpenWeather"
}

/**
 * Map WMO weather codes to Polish condition descriptions
 * Same logic as used in Dashboard components
 */
function getWeatherFromCode(code: number): string {
  if (code === 0) return "Słonecznie";
  if (code >= 1 && code <= 3) return "Zachmurzenie umiarkowane";
  if (code === 45 || code === 48) return "Mgła";
  if (code >= 51 && code <= 67) return "Deszcz";
  if (code >= 71 && code <= 77) return "Śnieg";
  if (code >= 95 && code <= 99) return "Burza";
  return "Pochmurno";
}

/**
 * Get current weather for a location (latitude, longitude)
 * Uses Open-Meteo API (same as Dashboard) - FREE, no API key required
 * This is the REAL weather data source used throughout the application
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<{ data: WeatherData | null; error: string | null }> {
  try {
    // Use Open-Meteo API (same as Dashboard components)
    // This is a free, open weather API - no key required
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check if we have valid weather data
    if (!data.current || typeof data.current.temperature_2m !== 'number') {
      throw new Error("Nieprawidłowa odpowiedź z API pogodowego");
    }

    // Map weather code to condition description (same as Dashboard)
    const weatherCode = data.current.weather_code || 0;
    const condition = getWeatherFromCode(weatherCode);
    const temperature = Math.round(data.current.temperature_2m);

    return {
      data: {
        temperature: temperature,
        condition: condition,
        description: condition.toLowerCase(),
        source: "Open-Meteo",
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching weather from Open-Meteo:", error);
    return {
      data: null,
      error: error.message || "Nie udało się pobrać danych pogodowych",
    };
  }
}

/**
 * Get weather for an apiary by its location_geo (GPS coordinates string)
 */
export async function getApiaryWeather(
  locationGeo: string | null
): Promise<{ data: WeatherData | null; error: string | null }> {
  if (!locationGeo) {
    return {
      data: null,
      error: "Pasieka nie ma zdefiniowanej lokalizacji GPS",
    };
  }

  try {
    // Parse location_geo - assuming format "lat,lon" or JSON
    let lat: number, lon: number;

    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(locationGeo);
      lat = typeof parsed === "object" ? parsed.lat || parsed.latitude || parsed[0] : parseFloat(parsed);
      lon = typeof parsed === "object" ? parsed.lon || parsed.longitude || parsed[1] : parseFloat(parsed);
    } catch {
      // Try parsing as "lat,lon" string
      const parts = locationGeo.split(",").map((p) => parseFloat(p.trim()));
      if (parts.length >= 2) {
        lat = parts[0];
        lon = parts[1];
      } else {
        return {
          data: null,
          error: "Nieprawidłowy format lokalizacji GPS",
        };
      }
    }

    if (isNaN(lat) || isNaN(lon)) {
      return {
        data: null,
        error: "Nieprawidłowe współrzędne GPS",
      };
    }

    return await getCurrentWeather(lat, lon);
  } catch (error: any) {
    console.error("Error parsing apiary location:", error);
    return {
      data: null,
      error: error.message || "Błąd podczas przetwarzania lokalizacji",
    };
  }
}
