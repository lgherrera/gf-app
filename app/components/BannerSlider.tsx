// app/components/BannerSlider.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './BannerSlider.module.css';

interface Slide {
  id: string;
  image_url: string;
  alt_text: string | null;
  href: string;
}

interface BannerSliderProps {
  slides: Slide[];
}

export default function BannerSlider({ slides }: BannerSliderProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const count = slides.length;

  const goTo = useCallback((index: number) => {
    setCurrent((index + count) % count);
  }, [count]);

  // Autoplay
  useEffect(() => {
    if (count <= 1) return;
    autoplayRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, 4000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [count]);

  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, 4000);
  }, [count]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    if (touchDeltaX.current < -threshold) {
      goTo(current + 1);
      resetAutoplay();
    } else if (touchDeltaX.current > threshold) {
      goTo(current - 1);
      resetAutoplay();
    }
  };

  if (count === 0) return null;

  return (
    <div className={styles.slider}>
      <div
        ref={trackRef}
        className={styles.track}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <a
            key={slide.id}
            href={slide.href}
            className={styles.slide}
          >
            <img
              src={slide.image_url}
              alt={slide.alt_text || 'AI Girlfriend'}
              className={styles.image}
              draggable={false}
            />
          </a>
        ))}
      </div>

      {count > 1 && (
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => { goTo(i); resetAutoplay(); }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}