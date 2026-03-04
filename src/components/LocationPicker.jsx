import { useState, useEffect, useRef, useCallback } from 'react';

const LEBANON_CENTER = [33.8547, 35.8623];
const DEFAULT_ZOOM = 13;

export default function LocationPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [leaflet, setLeaflet] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import('leaflet').then(L => {
      if (!cancelled) {
        import('leaflet/dist/leaflet.css');
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        setLeaflet(L);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!leaflet || !mapRef.current || mapInstanceRef.current) return;

    const center = value?.lat ? [value.lat, value.lng] : LEBANON_CENTER;
    const map = leaflet.map(mapRef.current).setView(center, DEFAULT_ZOOM);
    mapInstanceRef.current = map;

    leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    if (value?.lat) {
      markerRef.current = leaflet.marker([value.lat, value.lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng();
        onChange({ lat: pos.lat, lng: pos.lng });
      });
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = leaflet.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          onChange({ lat: pos.lat, lng: pos.lng });
        });
      }
      onChange({ lat, lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [leaflet]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        onChange({ lat, lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else if (leaflet) {
            markerRef.current = leaflet.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
            markerRef.current.on('dragend', () => {
              const p = markerRef.current.getLatLng();
              onChange({ lat: p.lat, lng: p.lng });
            });
          }
        }
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange, leaflet]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Location</label>
        <button type="button" onClick={locateMe} disabled={loading} className="btn-secondary !py-1.5 !px-3 !text-xs">
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
          )}
          Use my location
        </button>
      </div>
      <div ref={mapRef} className="h-64 w-full rounded-xl border border-gray-300 bg-gray-100" />
      {value?.lat && (
        <p className="text-xs text-gray-500">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
