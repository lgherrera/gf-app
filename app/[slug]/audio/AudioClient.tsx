// app/[slug]/audio/AudioClient.tsx
'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './AudioClient.module.css';

interface Girlfriend {
  name: string;
  slug: string;
  avatar?: string;
}

interface Audio {
  id: string;
  title: string;
  audio_url: string;
  duration: number | null;
  display_order: number;
}

interface AudioClientProps {
  girlfriend: Girlfriend;
  audios: Audio[];
}

export default function AudioClient({ girlfriend, audios }: AudioClientProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const handlePlayPause = (audioId: string) => {
    const audioElement = audioRefs.current[audioId];
    if (!audioElement) return;

    // Pause all other audios
    Object.keys(audioRefs.current).forEach(id => {
      if (id !== audioId && audioRefs.current[id]) {
        audioRefs.current[id]?.pause();
      }
    });

    if (playingId === audioId) {
      audioElement.pause();
      setPlayingId(null);
    } else {
      audioElement.play();
      setPlayingId(audioId);
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      {/* Audio List */}
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>Audios</h2>
        
        {audios.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No audio available yet</p>
          </div>
        ) : (
          <div className={styles.audioList}>
            {audios.map((audio) => (
              <div key={audio.id} className={styles.audioCard}>
                <button 
                  className={styles.playButton}
                  onClick={() => handlePlayPause(audio.id)}
                  aria-label={playingId === audio.id ? 'Pause' : 'Play'}
                >
                  {playingId === audio.id ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  )}
                </button>

                <div className={styles.audioInfo}>
                  <h3 className={styles.audioTitle}>{audio.title}</h3>
                  <span className={styles.audioDuration}>
                    {formatDuration(audio.duration)}
                  </span>
                </div>

                <audio
                  ref={(el) => { audioRefs.current[audio.id] = el; }}
                  src={audio.audio_url}
                  onEnded={handleAudioEnded}
                  onError={() => console.error('Audio failed to load:', audio.audio_url)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}