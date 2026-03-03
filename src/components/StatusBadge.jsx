const config = {
  active: { bg: 'bg-red-100', text: 'text-red-800', label: 'Active' },
  fixed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Fixed' },
  disputed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Disputed' },
};

export default function StatusBadge({ status }) {
  const c = config[status] || config.active;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
