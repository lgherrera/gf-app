// app/components/chat/components/AudioPlayButton.tsx
'use client';

import React from 'react';
import styles from '../ChatInterface.module.css';

interface AudioPlayButtonProps {
  messageId: string;
  isPlaying: boolean;
  isLoading: boolean;
  onToggle: () => void;
}

export default function AudioPlayButton({
  messageId,
  isPlaying,
  isLoading,
  onToggle,
}: AudioPlayButtonProps) {
  return (
    <button
      className={`${styles.messagePlayButton} ${isPlaying ? styles.playing : ''}`}
      onClick={onToggle}
      disabled={isLoading}
      title={isPlaying ? 'Pausar' : 'Reproducir'}
    >
      {isLoading ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.spinner}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      ) : isPlaying ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}