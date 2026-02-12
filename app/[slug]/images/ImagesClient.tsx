// app/[slug]/images/ImagesClient.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import styles from './ImagesClient.module.css';

interface Girlfriend {
  name: string;
  slug: string;
  avatar?: string;
}

interface Image {
  id: string;
  title: string | null;
  image_url: string;
  thumbnail_url: string | null;
  display_order: number;
}

interface ImagesClientProps {
  girlfriend: Girlfriend;
  images: Image[];
}

export default function ImagesClient({ girlfriend, images }: ImagesClientProps) {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href={`/${girlfriend.slug}/chat`} className={styles.iconButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        <div className={styles.headerCenter}>
          {girlfriend.avatar && (
            <img src={girlfriend.avatar} alt={girlfriend.name} className={styles.avatar} />
          )}
          <h1 className={styles.headerTitle}>{girlfriend.name}</h1>
        </div>

        <div className={styles.iconButton} style={{ visibility: 'hidden' }}>
          {/* Spacer for layout balance */}
        </div>
      </header>

      {/* Images Grid */}
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>Imagenes</h2>
        
        {images.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No images available yet</p>
          </div>
        ) : (
          <div className={styles.imageGrid}>
            {images.map((image) => (
              <div key={image.id} className={styles.imageCard}>
                <div className={styles.imageWrapper}>
                  <img 
                    src={image.thumbnail_url || image.image_url} 
                    alt={image.title || 'Image'}
                    className={styles.image}
                    onError={(e) => {
                      console.error('Image failed to load:', image.image_url);
                      e.currentTarget.src = image.image_url; // Fallback to full image
                    }}
                  />
                </div>
                {image.title && (
                  <h3 className={styles.imageTitle}>{image.title}</h3>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}