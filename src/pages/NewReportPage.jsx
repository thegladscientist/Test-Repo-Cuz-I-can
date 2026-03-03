import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import LocationPicker from '../components/LocationPicker';
import { useUserName } from '../hooks/useUserName';

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', desc: 'Minor, passable', color: 'border-green-400 bg-green-50 text-green-800' },
  { value: 'medium', label: 'Medium', desc: 'Noticeable bump', color: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
  { value: 'high', label: 'High', desc: 'Risk of damage', color: 'border-orange-400 bg-orange-50 text-orange-800' },
  { value: 'critical', label: 'Critical', desc: 'Dangerous, avoid', color: 'border-red-400 bg-red-50 text-red-800' },
];

export default function NewReportPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useUserName();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    description: '',
    severity: 'medium',
    address: '',
  });
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setPhotos(prev => [...prev, ...files].slice(0, 5));
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
  };

  const removePhoto = (idx) => {
    setPhotos(p => p.filter((_, i) => i !== idx));
    setPreviews(p => {
      URL.revokeObjectURL(p[idx]);
      return p.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('Please select a location on the map');
      return;
    }
    if (!form.description.trim()) {
      setError('Please add a description');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('description', form.description.trim());
      fd.append('severity', form.severity);
      fd.append('latitude', location.lat);
      fd.append('longitude', location.lng);
      fd.append('address', form.address.trim());
      fd.append('reporter_name', userName.trim() || 'Anonymous');
      photos.forEach(p => fd.append('photos', p));

      const report = await api.createReport(fd);
      navigate(`/report/${report.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900">Report a Pothole</h2>

      {error && (
        <div className="card border-red-200 bg-red-50 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Your Name</label>
        <input
          type="text"
          className="input-field"
          placeholder="Anonymous"
          value={userName}
          onChange={e => setUserName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Description *</label>
        <textarea
          className="input-field min-h-[80px] resize-y"
          placeholder="Describe the pothole location and condition..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Severity *</label>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, severity: opt.value }))}
              className={`rounded-xl border-2 p-3 text-left transition ${
                form.severity === opt.value ? opt.color : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              <span className="block text-sm font-semibold">{opt.label}</span>
              <span className="block text-xs opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <LocationPicker value={location} onChange={setLocation} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Street / Area Name</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Hamra Street, Beirut"
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Photos (up to 5)</label>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-brand-400 hover:text-brand-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg>
              <span className="text-[10px] font-medium mt-0.5">Add Photo</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Submitting...
          </>
        ) : (
          'Submit Report'
        )}
      </button>
    </form>
  );
}
