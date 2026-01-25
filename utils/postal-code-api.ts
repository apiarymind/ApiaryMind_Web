/**
 * Helper function to fetch location data from Polish postal code
 * Uses kodpocztowy.intami.pl API or fallback API
 */

export interface PostalCodeLocation {
  city?: string;
  voivodeship?: string;
  district?: string;
}

/**
 * Strict normalization map: API response (lowercase keys) -> Our System Value (exact dropdown values)
 */
const NORMALIZED_VOIVODESHIPS: Record<string, string> = {
  'dolnośląskie': 'Dolnośląskie',
  'dolnoslaskie': 'Dolnośląskie',
  'kujawsko-pomorskie': 'Kujawsko-pomorskie',
  'kujawsko pomorskie': 'Kujawsko-pomorskie',
  'lubelskie': 'Lubelskie',
  'lubuskie': 'Lubuskie',
  'łódzkie': 'Łódzkie',
  'lodzkie': 'Łódzkie',
  'małopolskie': 'Małopolskie',
  'malopolskie': 'Małopolskie',
  'mazowieckie': 'Mazowieckie',
  'opolskie': 'Opolskie',
  'podkarpackie': 'Podkarpackie',
  'podlaskie': 'Podlaskie',
  'pomorskie': 'Pomorskie',
  'śląskie': 'Śląskie',
  'slaskie': 'Śląskie',
  'świętokrzyskie': 'Świętokrzyskie',
  'swietokrzyskie': 'Świętokrzyskie',
  'warmińsko-mazurskie': 'Warmińsko-mazurskie',
  'warminsko-mazurskie': 'Warmińsko-mazurskie',
  'wielkopolskie': 'Wielkopolskie',
  'zachodniopomorskie': 'Zachodniopomorskie',
};

/**
 * Normalize voivodeship name to match our dropdown options
 * @param voivodeship - Raw voivodeship string from API
 * @returns Normalized voivodeship string that matches our dropdown, or null if no match
 */
function normalizeVoivodeship(voivodeship: string): string | null {
  if (!voivodeship) return null;
  
  // Step 1: Trim whitespace
  let cleaned = voivodeship.trim();
  
  // Step 2: Remove common prefixes
  cleaned = cleaned
    .replace(/^woj\.\s*/i, '')
    .replace(/^województwo\s*/i, '')
    .trim();
  
  // Step 3: Convert to lowercase for lookup
  const lowerKey = cleaned.toLowerCase();
  
  // Step 4: Look up in normalized map
  const normalizedValue = NORMALIZED_VOIVODESHIPS[lowerKey];
  if (normalizedValue) {
    return normalizedValue;
  }
  
  // Step 5: Try partial match (in case API returns something like "woj. mazowieckie" or "Mazowieckie")
  for (const [key, value] of Object.entries(NORMALIZED_VOIVODESHIPS)) {
    if (lowerKey.includes(key) || key.includes(lowerKey)) {
      return value;
    }
  }
  
  // No match found - return null to allow manual selection
  return null;
}

/**
 * Normalize city name (capitalize first letter of each word)
 * @param city - Raw city string from API
 * @returns Normalized city string with proper capitalization
 */
function normalizeCity(city: string): string {
  if (!city) return '';
  
  // Trim whitespace
  const trimmed = city.trim();
  
  // Capitalize first letter of each word
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetch location data from Polish postal code
 * @param zipCode - Postal code in format XX-XXX
 * @returns Location data or null if not found
 */
export async function fetchLocationByZip(zipCode: string): Promise<PostalCodeLocation | null> {
  try {
    // Remove dashes for API call (some APIs expect format without dash)
    const codeWithoutDash = zipCode.replace(/-/g, '');
    
    if (codeWithoutDash.length !== 5) {
      return null;
    }
    
    // Try kodpocztowy.intami.pl API first
    try {
      const response = await fetch(`https://kodpocztowy.intami.pl/api/${codeWithoutDash}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        let city = '';
        let voivodeship = '';
        
        if (Array.isArray(data) && data.length > 0) {
          // API returns array of locations
          const location = data[0];
          city = location.miejscowosc || location.city || location.place || '';
          voivodeship = location.województwo || location.wojewodztwo || location.voivodeship || location.state || '';
        } else if (data.miejscowosc || data.city || data.place) {
          // API returns single object
          city = data.miejscowosc || data.city || data.place || '';
          voivodeship = data.województwo || data.wojewodztwo || data.voivodeship || data.state || '';
        }
        
        if (city || voivodeship) {
          const normalizedVoivodeship = voivodeship ? normalizeVoivodeship(voivodeship) : null;
          const normalizedCity = city ? normalizeCity(city) : undefined;
          return {
            city: normalizedCity,
            voivodeship: normalizedVoivodeship || undefined,
          };
        }
      }
    } catch (e) {
      // Fallback to alternative API if first one fails
      console.warn('Primary postal code API failed, trying fallback...', e);
    }
    
    // Fallback: Try alternative API (example: kodpocztowy.it API)
    try {
      const response = await fetch(`https://api.kodpocztowy.it/${codeWithoutDash}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        let city = '';
        let voivodeship = '';
        
        if (data.miejscowosc || data.city) {
          city = data.miejscowosc || data.city || '';
          voivodeship = data.województwo || data.wojewodztwo || data.voivodeship || '';
        }
        
        if (city || voivodeship) {
          const normalizedVoivodeship = voivodeship ? normalizeVoivodeship(voivodeship) : null;
          const normalizedCity = city ? normalizeCity(city) : undefined;
          return {
            city: normalizedCity,
            voivodeship: normalizedVoivodeship || undefined,
          };
        }
      }
    } catch (e) {
      console.warn('Fallback postal code API failed', e);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching location by postal code:', error);
    return null;
  }
}
