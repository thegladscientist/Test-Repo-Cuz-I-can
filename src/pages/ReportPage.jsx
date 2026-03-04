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

  const reload = () => {
    api.getReport(id).then(setReport).catch(e => setError(e.message));
  };

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

  const needsDetails = !report.description && (!report.photos || report.photos.length === 0);

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

        {report.description ? (
          <p className="text-base text-gray-900 leading-relaxed">{report.description}</p>
        ) : (
          <p className="text-sm italic text-gray-400">No description added yet</p>
        )}

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

      {needsDetails && (
        <div className="card border-brand-200 bg-brand-50">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100">
              <svg className="h-5 w-5 text-brand-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-800">Quick pin — add details when you can</h3>
              <p className="mt-0.5 text-xs text-brand-700/70">Add a description, photos, or address below to help others identify this pothole.</p>
            </div>
          </div>
        </div>
      )}

      <EditDetailsSection report={report} onUpdate={reload} />
      <ConfirmSection reportId={id} userName={userName} onUpdate={setReport} />
      <CommentsSection reportId={id} comments={report.comments || []} userName={userName} onUpdate={setReport} />
    </div>
  );
}

function EditDetailsSection({ report, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(report.description || '');
  const [address, setAddress] = useState(report.address || '');
  const [severity, setSeverity] = useState(report.severity);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const needsDetails = !report.description && (!report.photos || report.photos.length === 0);

  const handlePhotoChange = (e) => {
    const maxNew = 5 - (report.photos?.length || 0);
    const files = Array.from(e.target.files).slice(0, maxNew);
    setPhotos(prev => [...prev, ...files].slice(0, maxNew));
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, maxNew));
  };

  const removeNewPhoto = (idx) => {
    setPhotos(p => p.filter((_, i) => i !== idx));
    setPreviews(p => {
      URL.revokeObjectURL(p[idx]);
      return p.filter((_, i) => i !== idx);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      if (description.trim() !== (report.description || '')) fd.append('description', description.trim());
      if (address.trim() !== (report.address || '')) fd.append('address', address.trim());
      if (severity !== report.severity) fd.append('severity', severity);
      photos.forEach(p => fd.append('photos', p));

      await api.updateReport(report.id, fd);
      setPhotos([]);
      setPreviews([]);
      setOpen(false);
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`card w-full text-left transition hover:shadow-md hover:border-brand-200 ${
          needsDetails ? 'border-brand-300 ring-1 ring-brand-200' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
          <span className="text-sm font-semibold text-gray-700">
            {needsDetails ? 'Add details, photos & description' : 'Edit details'}
          </span>
          <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </div>
      </button>
    );
  }

  const existingPhotosCount = report.photos?.length || 0;
  const canAddMore = existingPhotosCount + photos.length < 5;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Edit Details</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
        <textarea
          className="input-field min-h-[70px] resize-y"
          placeholder="Describe the pothole..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Street / Area</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Hamra Street, Beirut"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">Severity</label>
        <div className="flex gap-2">
          {[
            { v: 'low', l: 'Low', c: 'border-green-400 bg-green-50 text-green-800' },
            { v: 'medium', l: 'Medium', c: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
            { v: 'high', l: 'High', c: 'border-orange-400 bg-orange-50 text-orange-800' },
            { v: 'critical', l: 'Critical', c: 'border-red-400 bg-red-50 text-red-800' },
          ].map(opt => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setSeverity(opt.v)}
              className={`flex-1 rounded-lg border-2 py-1.5 text-xs font-semibold transition ${
                severity === opt.v ? opt.c : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          Photos ({existingPhotosCount + photos.length}/5)
        </label>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewPhoto(i)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {canAddMore && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-brand-400 hover:text-brand-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handlePhotoChange} />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
        {saving ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        ) : (
          'Save Changes'
        )}
      </button>
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
