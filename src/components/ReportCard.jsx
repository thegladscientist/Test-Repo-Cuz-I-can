import { Link } from 'react-router-dom';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import TimeAgo from './TimeAgo';

export default function ReportCard({ report }) {
  const thumb = report.photos?.[0];
  const hasDescription = report.description && report.description.trim().length > 0;

  return (
    <Link to={`/report/${report.id}`} className="card block transition hover:shadow-md hover:border-brand-200">
      <div className="flex gap-4">
        {thumb && (
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
            <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SeverityBadge severity={report.severity} />
            <StatusBadge status={report.status} />
            {!hasDescription && !thumb && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">Quick pin</span>
            )}
          </div>
          {hasDescription ? (
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{report.description}</p>
          ) : (
            <p className="text-sm italic text-gray-400">
              {report.address || `Pothole at ${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {report.address && hasDescription && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                {report.address}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              {report.reporter_name}
            </span>
            <TimeAgo date={report.created_at} />
            {report.confirmations > 0 && (
              <span className="flex items-center gap-1 font-medium text-brand-700">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                {report.confirmations} confirmed
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
