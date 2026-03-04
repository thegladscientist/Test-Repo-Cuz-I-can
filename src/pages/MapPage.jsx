import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const LEBANON_CENTER = [33.8547, 35.8623];
const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444'
};

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getReports({ limit: 500 })
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || !mapRef.current) return;
      import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current).setView(LEBANON_CENTER, 9);
      mapInstance.current = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      reports.forEach(r => {
        const color = SEVERITY_COLORS[r.severity] || SEVERITY_COLORS.medium;
        const circle = L.circleMarker([r.latitude, r.longitude], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);

        circle.bindPopup(`
          <div style="min-width:180px">
            <strong style="display:block;margin-bottom:4px">${r.severity.toUpperCase()} Pothole</strong>
            <p style="margin:0 0 6px;font-size:13px;color:#555">${r.description.substring(0, 80)}${r.description.length > 80 ? '...' : ''}</p>
            ${r.address ? `<p style="margin:0 0 4px;font-size:12px;color:#888">${r.address}</p>` : ''}
            <p style="margin:0;font-size:12px;color:#888">${r.confirmations} confirmation${r.confirmations !== 1 ? 's' : ''}</p>
          </div>
        `);

        circle.on('click', () => {
          navigate(`/report/${r.id}`);
        });
      });
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [reports, navigate]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Pothole Map</h2>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-500" />Low</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-yellow-500" />Med</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-500" />High</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500" />Crit</span>
        </div>
      </div>

      <div className="relative h-[calc(100vh-220px)] overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <svg className="h-8 w-8 animate-spin text-brand-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </div>
    </div>
  );
}
