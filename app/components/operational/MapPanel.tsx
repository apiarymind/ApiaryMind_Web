'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic import dla komponentów Leaflet (aby uniknąć problemów z SSR)
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
});

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});

const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
});

const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), {
  ssr: false,
});

// Import ikony markera (fix dla domyślnej ikony Leaflet)
import L from 'leaflet';

// Fix dla domyślnej ikony markera
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface MapPanelProps {
  locationGeo: string | null;
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
  // Musi zawierać dokładnie jeden przecinek MIĘDZY dwiema liczbami.
  // Rozbijamy tylko po pierwszym przecinku żeby nie mylić z JSON-em.
  const commaIdx = trimmed.indexOf(',');
  if (commaIdx !== -1 && !trimmed.startsWith('{')) {
    const latStr = trimmed.slice(0, commaIdx).trim();
    const lngStr = trimmed.slice(commaIdx + 1).trim();
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // ── Próba 2: JSON object (standard lub Python-style apostrofy) ────────────
  try {
    // Zamień apostrofy na cudzysłowy (Python repr → JSON)
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

export function MapPanel({ locationGeo }: MapPanelProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setCoordinates(parseLocationGeo(locationGeo));
  }, [locationGeo]);

  // Path options dla okręgu - złoty/bursztynowy kolor
  const circlePathOptions = {
    color: '#F59E0B', // Amber-500
    fillColor: '#F59E0B', // Amber-500
    fillOpacity: 0.2, // 20% przezroczystości
    weight: 2, // Grubość linii
  };

  return (
    <div className="relative h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-black/30 backdrop-blur-xl">
      {/* Glassmorphism Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-black/40 backdrop-blur-md border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-text-muted">Lokalizacja Pasieki</h3>
        </div>
        {coordinates && (
          <p className="text-xs text-amber-200/60 mt-1">
            Zasięg lotu: 5 km (oznaczony okręgiem)
          </p>
        )}
      </div>

      {/* Map Container */}
      <div className="w-full h-full" style={{ marginTop: '60px', height: 'calc(100% - 60px)' }}>
        {!isClient ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div className="text-amber-200/60">Ładowanie mapy...</div>
          </div>
        ) : coordinates ? (
          <MapContainer
            center={[coordinates.lat, coordinates.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[coordinates.lat, coordinates.lng]} />
            <Circle
              center={[coordinates.lat, coordinates.lng]}
              radius={5000} // 5 km w metrach
              pathOptions={circlePathOptions}
            />
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <MapPin className="w-16 h-16 text-amber-400/30 mx-auto mb-4" />
              <p className="text-amber-200/60 text-sm">
                {locationGeo
                  ? 'Nieprawidłowy format współrzędnych. Oczekiwany format: "szerokość,długość"'
                  : 'Brak danych lokalizacyjnych dla tej pasieki.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Flight Range Circle Overlay (Visual indicator) */}
      {coordinates && (
        <div className="absolute bottom-4 right-4 z-[1001] bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400/50 border border-amber-400"></div>
            <span className="text-xs text-amber-200/80">Zasięg 5 km</span>
          </div>
        </div>
      )}
    </div>
  );
}
