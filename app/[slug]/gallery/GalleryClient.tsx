// app/[slug]/gallery/GalleryClient.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './GalleryClient.module.css';

interface Girlfriend {
  name: string;
  slug: string;
  avatar?: string;
}

interface GalleryItem {
  id: string;
  title: string | null;
  image_url: string;
  thumbnail_url: string | null;
  display_order: number | null;
  media_type: string;
}

interface GalleryClientProps {
  girlfriend: Girlfriend;
  items: GalleryItem[];
}

export default function GalleryClient({ girlfriend, items }: GalleryClientProps) {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href={`/${girlfriend.slug}/chat`} className={styles.iconButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className={styles.headerCenter}>
          {girlfriend.avatar && (
            <img src={girlfriend.avatar} alt={girlfriend.name} className={styles.avatar} />
          )}
          <h1 className={styles.headerTitle}>{girlfriend.name}</h1>
        </div>

        <div className={styles.iconButton} style={{ visibility: 'hidden' }} />
      </header>

      {/* Gallery Grid */}
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>Galería</h2>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay contenido disponible aún</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <div
                key={item.id}
                className={styles.card}
                onClick={() => setActiveItem(item)}
              >
                <div className={styles.mediaWrapper}>
                  {item.media_type === 'video' ? (
                    <>
                      <video
                        src={item.image_url}
                        className={styles.media}
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className={styles.playBadge}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.thumbnail_url || item.image_url}
                      alt={item.title || 'Image'}
                      className={styles.media}
                    />
                  )}
                </div>
                {item.title && <h3 className={styles.itemTitle}>{item.title}</h3>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div className={styles.lightbox} onClick={() => setActiveItem(null)}>
          <button className={styles.closeButton} onClick={() => setActiveItem(null)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {activeItem.media_type === 'video' ? (
              <video
                src={activeItem.image_url}
                className={styles.lightboxMedia}
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={activeItem.image_url}
                alt={activeItem.title || 'Image'}
                className={styles.lightboxMedia}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}