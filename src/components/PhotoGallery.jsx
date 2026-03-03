import { useState } from 'react';

export default function PhotoGallery({ photos }) {
  const [lightbox, setLightbox] = useState(null);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {photos.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightbox(src)}
            className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200 transition hover:ring-brand-400"
          >
            <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30" onClick={() => setLightbox(null)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
          <img src={lightbox} alt="Full size" className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </>
  );
}
