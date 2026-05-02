// app/sidebar/gallery/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import GFHeader from '@/app/components/GFHeader';
import GFFooter from '@/app/components/GFFooter';
import { useUser } from '@/lib/hooks/useUser';
import styles from './page.module.css';

interface GeneratedImage {
  id: string;
  girlfriend_id: string | null;
  prompt: string;
  image_url: string;
  aspect_ratio: string | null;
  model: string | null;
  created_at: string;
}

export default function MyGalleryPage() {
  const userId = useUser();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Fetch user's generated images
  useEffect(() => {
    if (!userId) return;

    fetch(`/api/generated-images?userId=${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch images");
        return res.json();
      })
      .then((data) => setImages(data.images || []))
      .catch((err) => {
        console.error("Error fetching gallery:", err);
        setError("No se pudieron cargar las imágenes.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Lightbox controls
  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goNext = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  }, [selectedIndex, images.length]);

  const goPrev = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  }, [selectedIndex, images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex, goNext, goPrev]);

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <div className={styles.page}>
      <GFHeader />

      <main className={styles.main}>
        <h1 className={styles.title}>Mis Creaciones</h1>

        {loading ? (
          <p className={styles.empty}>Cargando...</p>
        ) : error ? (
          <p className={styles.empty}>{error}</p>
        ) : images.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className={styles.emptyText}>Aún no has creado imágenes.</p>
            <p className={styles.emptySubtext}>Genera imágenes desde el chat con tu polola.</p>
          </div>
        ) : (
          <>
            <p className={styles.count}>{images.length} {images.length === 1 ? 'imagen' : 'imágenes'}</p>
            <div className={styles.grid}>
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={styles.gridItem}
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={image.image_url}
                    alt={image.prompt}
                    className={styles.image}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <GFFooter />

      {/* Lightbox */}
      {selectedImage && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <button
            className={styles.closeBtn}
            onClick={closeLightbox}
            aria-label="Cerrar"
          >
            ✕
          </button>

          <button
            className={`${styles.navBtn} ${styles.navPrev}`}
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Anterior"
          >
            ‹
          </button>

          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.image_url}
              alt={selectedImage.prompt}
              className={styles.lightboxImage}
            />
          </div>

          <button
            className={`${styles.navBtn} ${styles.navNext}`}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Siguiente"
          >
            ›
          </button>

          {selectedImage.prompt && (
            <div className={styles.lightboxCaption}>
              {selectedImage.prompt}
            </div>
          )}
        </div>
      )}
    </div>
  );
}