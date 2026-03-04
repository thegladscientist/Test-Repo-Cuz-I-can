import { Link, useLocation } from 'react-router-dom';

const sideNavItems = [
  { path: '/', label: 'Feed', icon: ListIcon },
  { path: '/map', label: 'Map', icon: MapIcon },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🕳️</span>
            <span className="text-lg font-bold text-brand-800">Pothole Reporter</span>
          </Link>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
            Lebanon
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-lg safe-area-pb">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-around">
          {sideNavItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'text-brand-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
          <Link
            to="/new"
            className="flex flex-col items-center gap-0.5"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition -mt-5 ${
              location.pathname === '/new'
                ? 'bg-brand-800 ring-4 ring-brand-200'
                : 'bg-brand-700 hover:bg-brand-800'
            }`}>
              <PinIcon />
            </span>
            <span className="text-[10px] font-semibold text-brand-700">Drop Pin</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

function ListIcon({ active }) {
  return (
    <svg className={`h-6 w-6 ${active ? 'text-brand-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function MapIcon({ active }) {
  return (
    <svg className={`h-6 w-6 ${active ? 'text-brand-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}
