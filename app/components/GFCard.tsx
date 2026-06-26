// app/components/GFCard.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './GFCard.module.css';

interface GFCardProps {
  id: string;
  slug: string;
  name: string;
  age: number;
  description: string;
  image_url: string;
  animation_url?: string | null;
}

export default function GFCard({ 
  id, 
  slug,
  name, 
  age, 
  description, 
  image_url,
  animation_url,
}: GFCardProps) {
  const chatUrl = `/${slug}/chat`;
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!animation_url || !cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [animation_url]);

  useEffect(() => {
    if (!videoRef.current || !animation_url) return;

    const shouldPlay = isVisible || isHovered;

    if (shouldPlay) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setVideoReady(false);
    }
  }, [isVisible, isHovered, animation_url]);

  return (
    <div 
      ref={cardRef} 
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={chatUrl} className={styles.imageContainer} style={{ display: 'block' }}>
        <Image
          src={image_url}
          alt={`${name}, ${age}`}
          fill
          sizes="(max-width: 500px) 100vw, 500px"
          className={styles.image}
          priority
        />

        {animation_url && (
          <video
            ref={videoRef}
            src={animation_url}
            className={`${styles.video} ${videoReady ? styles.videoVisible : ''}`}
            loop
            muted
            playsInline
            preload="none"
            onCanPlayThrough={() => setVideoReady(true)}
          />
        )}
        
        <div className={styles.chateaBadge}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={styles.chateaIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          CHATEA
        </div>
        
        <div className={styles.gradient} />
        
        <div className={styles.textOverlay}>
          <h2 className={styles.name}>{name}, {age}</h2>
          <p className={styles.description}>{description}</p>
        </div>
      </Link>
    </div>
  );
}