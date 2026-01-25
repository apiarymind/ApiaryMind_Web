'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface ApiaryLocationProps {
  locationGeo: string | null;
}

interface NominatimResponse {
  address?: {
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    quarter?: string;
    municipality?: string;
  };
}

export function ApiaryLocation({ locationGeo }: ApiaryLocationProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationGeo) {
      setLoading(false);
      return;
    }

    // Parsuj współrzędne
    const parts = locationGeo.split(',');
    if (parts.length !== 2) {
      setLoading(false);
      setAddress(locationGeo); // Fallback do współrzędnych
      return;
    }

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    if (isNaN(lat) || isNaN(lng)) {
      setLoading(false);
      setAddress(locationGeo); // Fallback do współrzędnych
      return;
    }

    // Pobierz adres z Nominatim
    const fetchAddress = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pl`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'ApiaryMind-Web/1.0',
          },
        });

        if (response.ok) {
          const data: NominatimResponse = await response.json();
          
          if (data.address) {
            // Kaskadowa logika wyboru nazwy miejscowości
            const locationName =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.suburb ||
              data.address.quarter ||
              data.address.municipality ||
              'Nieznana lokalizacja';
            
            const state = data.address.state || '';

            // Formatuj adres: 📍 ${locationName}, woj. ${state}
            if (locationName && locationName !== 'Nieznana lokalizacja') {
              if (state) {
                // Formatuj nazwę województwa (usuń "województwo" jeśli jest)
                const stateFormatted = state.replace(/^województwo\s+/i, '').toLowerCase();
                setAddress(`${locationName}, woj. ${stateFormatted}`);
              } else {
                setAddress(locationName);
              }
            } else if (state) {
              const stateFormatted = state.replace(/^województwo\s+/i, '').toLowerCase();
              setAddress(`woj. ${stateFormatted}`);
            } else {
              setAddress(locationGeo); // Fallback
            }
          } else {
            setAddress(locationGeo); // Fallback
          }
        } else {
          setAddress(locationGeo); // Fallback
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        setAddress(locationGeo); // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [locationGeo]);

  if (!locationGeo) {
    return null;
  }

  return (
    <div className="text-xs text-gray-700 dark:text-amber-200/60 flex items-center gap-1">
      <MapPin className="w-3.5 h-3.5 text-gray-800 dark:text-gray-400" />
      <span className="truncate">
        {loading ? 'Ładowanie...' : address || locationGeo}
      </span>
    </div>
  );
}

