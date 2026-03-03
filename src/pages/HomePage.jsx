import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ReportCard from '../components/ReportCard';

export default function HomePage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter !== 'all') params.status = filter;

    Promise.all([api.getReports(params), api.getStats()])
      .then(([data, statsData]) => {
        setReports(data);
        setStats(statsData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-5">
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total" value={stats.total} color="brand" />
          <StatCard label="Active" value={stats.active} color="red" />
          <StatCard label="Fixed" value={stats.fixed} color="green" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Recent Reports</h2>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {['all', 'active', 'fixed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-brand-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="card border-red-200 bg-red-50 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🕳️</div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No potholes reported yet</h3>
          <p className="text-sm text-gray-500 mb-4">Be the first to report a pothole in your area!</p>
          <Link to="/new" className="btn-primary">Report a Pothole</Link>
        </div>
      )}

      <div className="space-y-3">
        {reports.map(r => <ReportCard key={r.id} report={r} />)}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className={`rounded-2xl border p-3 text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-70">{label}</div>
    </div>
  );
}
