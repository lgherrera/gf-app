// app/components/GalleryGrid.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import styles from './GalleryGrid.module.css';

interface ProfileImage {
  id: string;
  girlfriend_id: string;
  title: string;
  image_url: string;
  thumbnail_url: string;
  display_order: number;
  created_at: string;
  content_rating: string;
}

interface GalleryGridProps {
  images: ProfileImage[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goNext = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % sortedImages.length);
    }
  }, [selectedIndex, sortedImages.length]);

  const goPrev = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + sortedImages.length) % sortedImages.length);
    }
  }, [selectedIndex, sortedImages.length]);

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

  const selectedImage = selectedIndex !== null ? sortedImages[selectedIndex] : null;

  return (
    <>
      {/* Instagram-style grid */}
      <div className={styles.grid}>
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className={styles.gridItem}
            onClick={() => openLightbox(index)}
          >
            <Image
              src={image.thumbnail_url || image.image_url}
              alt={image.title || 'Gallery image'}
              fill
              className={styles.image}
              sizes="(max-width: 768px) 33vw, 25vw"
            />
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
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
            <Image
              src={selectedImage.image_url}
              alt={selectedImage.title || 'Gallery image'}
              fill
              className={styles.lightboxImage}
              sizes="100vw"
              priority
            />
          </div>

          <button
            className={`${styles.navBtn} ${styles.navNext}`}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Siguiente"
          >
            ›
          </button>

          {selectedImage.title && (
            <div className={styles.lightboxCaption}>
              {selectedImage.title}
            </div>
          )}
        </div>
      )}
    </>
  );
}