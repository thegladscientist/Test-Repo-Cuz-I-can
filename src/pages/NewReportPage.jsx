import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useUserName } from '../hooks/useUserName';

const LEBANON_CENTER = [33.8547, 35.8623];

const SEVERITY_QUICK = [
  { value: 'low', emoji: '🟢', label: 'Low' },
  { value: 'medium', emoji: '🟡', label: 'Med' },
  { value: 'high', emoji: '🟠', label: 'High' },
  { value: 'critical', emoji: '🔴', label: 'Crit' },
];

export default function NewReportPage() {
  const navigate = useNavigate();
  const [userName] = useUserName();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [severity, setSeverity] = useState('medium');
  const [locating, setLocating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(null);

  const placeMarker = useCallback((lat, lng) => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng();
        setLocation({ lat: pos.lat, lng: pos.lng });
      });
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
    setLocation({ lat, lng });
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;

    import('leaflet').then(L => {
      if (cancelled || !mapRef.current) return;
      import('leaflet/dist/leaflet.css');
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      leafletRef.current = L;

      const map = L.map(mapRef.current).setView(LEBANON_CENTER, 9);
      mapInstance.current = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      map.on('click', (e) => {
        placeMarker(e.latlng.lat, e.latlng.lng);
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            placeMarker(pos.coords.latitude, pos.coords.longitude);
            setLocating(false);
          },
          () => setLocating(false),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setLocating(false);
      }
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, [placeMarker]);

  const handleRecenter = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async () => {
    if (!location) {
      setError('Tap the map or use GPS to set location');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('severity', severity);
      fd.append('latitude', location.lat);
      fd.append('longitude', location.lng);
      fd.append('reporter_name', userName.trim() || 'Anonymous');

      const report = await api.createReport(fd);
      setSubmitted(report);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
          <svg className="h-10 w-10 text-brand-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pin Dropped!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Pothole reported. You can add details anytime.
          </p>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/report/${submitted.id}`)}
            className="btn-primary flex-1"
          >
            Add Details
          </button>
          <button
            onClick={() => {
              setSubmitted(null);
              setSubmitting(false);
              setLocation(null);
              if (markerRef.current && mapInstance.current) {
                mapInstance.current.removeLayer(markerRef.current);
                markerRef.current = null;
              }
            }}
            className="btn-secondary flex-1"
          >
            Report Another
          </button>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">Drop a Pin</h2>
        <p className="text-sm text-gray-500">Tap the map or use GPS. Add details later.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">{error}</div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm" style={{ height: 'calc(100vh - 340px)', minHeight: 280 }}>
        {locating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <svg className="h-7 w-7 animate-spin text-brand-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <span className="text-xs font-medium text-gray-600">Getting your location...</span>
            </div>
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />

        <button
          onClick={handleRecenter}
          className="absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition"
          title="Use my location"
        >
          <svg className="h-5 w-5 text-brand-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </button>
      </div>

      {location && (
        <p className="text-center text-xs text-gray-400">
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-center text-sm font-medium text-gray-600">How bad is it?</label>
        <div className="flex justify-center gap-2">
          {SEVERITY_QUICK.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={`flex flex-col items-center rounded-xl px-4 py-2 text-xs font-semibold transition border-2 ${
                severity === opt.value
                  ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !location}
        className="btn-primary w-full !py-3.5 !text-base"
      >
        {submitting ? (
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            Drop Pin
          </>
        )}
      </button>
    </div>
  );
}
