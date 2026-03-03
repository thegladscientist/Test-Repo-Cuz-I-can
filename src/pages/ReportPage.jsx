import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import PhotoGallery from '../components/PhotoGallery';
import TimeAgo from '../components/TimeAgo';
import { useUserName } from '../hooks/useUserName';

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName] = useUserName();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.getReport(id)
      .then(setReport)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!report || !mapRef.current || mapInstance.current) return;

    import('leaflet').then(L => {
      if (!mapRef.current) return;
      import('leaflet/dist/leaflet.css');
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, { zoomControl: false, dragging: false, scrollWheelZoom: false })
        .setView([report.latitude, report.longitude], 16);
      mapInstance.current = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM',
        maxZoom: 19
      }).addTo(map);

      L.marker([report.latitude, report.longitude]).addTo(map);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [report]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="h-8 w-8 animate-spin text-brand-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="card border-red-200 bg-red-50 text-center text-sm text-red-600">{error}</div>
        <Link to="/" className="btn-secondary block text-center">Back to Feed</Link>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        Back to Feed
      </Link>

      <div className="card space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
          <TimeAgo date={report.created_at} />
        </div>

        <p className="text-base text-gray-900 leading-relaxed">{report.description}</p>

        <PhotoGallery photos={report.photos} />

        <div ref={mapRef} className="h-40 w-full rounded-xl border border-gray-200 bg-gray-100" />

        {report.address && (
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            {report.address}
          </p>
        )}

        <div className="flex items-center gap-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
          <span>Reported by <strong className="text-gray-700">{report.reporter_name}</strong></span>
          <span className="flex items-center gap-1 font-medium text-brand-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            {report.confirmations} confirmation{report.confirmations !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <ConfirmSection reportId={id} userName={userName} onUpdate={setReport} />
      <CommentsSection reportId={id} comments={report.comments || []} userName={userName} onUpdate={setReport} />
    </div>
  );
}

function ConfirmSection({ reportId, userName, onUpdate }) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async (stillThere) => {
    setConfirming(true);
    try {
      await api.confirmReport(reportId, userName || 'Anonymous', stillThere);
      const updated = await api.getReport(reportId);
      onUpdate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Is this pothole still there?</h3>
      <div className="flex gap-3">
        <button
          onClick={() => handleConfirm(true)}
          disabled={confirming}
          className="btn-primary flex-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
          Yes, still there
        </button>
        <button
          onClick={() => handleConfirm(false)}
          disabled={confirming}
          className="btn-secondary flex-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          No, it's fixed
        </button>
      </div>
    </div>
  );
}

function CommentsSection({ reportId, comments, userName, onUpdate }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api.addComment(reportId, text.trim(), userName || 'Anonymous');
      setText('');
      const updated = await api.getReport(reportId);
      onUpdate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        Comments ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-gray-400 italic">No comments yet. Be the first to comment!</p>
      )}

      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="rounded-xl bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700">{c.author_name}</span>
              <TimeAgo date={c.created_at} />
            </div>
            <p className="text-sm text-gray-600">{c.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handlePost} className="flex gap-2">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Add a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" disabled={posting || !text.trim()} className="btn-primary !px-4">
          {posting ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
          )}
        </button>
      </form>
    </div>
  );
}
