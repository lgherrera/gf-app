// app/components/IntroVideoMessage.tsx

'use client';

import React, { useRef, useState } from 'react';
import styles from './IntroVideoMessage.module.css';

interface IntroVideoMessageProps {
  videoUrl: string;
  posterUrl?: string;
  onVideoEnd?: () => void;
  onVideoError?: () => void;
}

export default function IntroVideoMessage({ 
  videoUrl,
  posterUrl,
  onVideoEnd,
  onVideoError
}: IntroVideoMessageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPoster, setShowPoster] = useState(true);

  const handlePlayClick = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setShowPoster(false);
        setIsPlaying(true);
      } catch (error) {
        console.log('Play failed:', error);
        onVideoError?.();
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setShowPoster(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowPoster(true);
    onVideoEnd?.();
  };

  const handleError = () => {
    console.log('Video error occurred');
    onVideoError?.();
  };

  const handleClose = () => {
    onVideoEnd?.();
  };

  return (
    <div className={styles.messageContainer}>
      <div className={styles.videoWrapper}>
        {/* Close button */}
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close video"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Video element */}
        <video
          ref={videoRef}
          className={styles.video}
          src={videoUrl}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
          controls
          playsInline
          preload="auto"
          style={{ 
            opacity: showPoster ? 0 : 1,
            pointerEvents: showPoster ? 'none' : 'auto'
          }}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Poster overlay */}
        {showPoster && (
          <div className={styles.posterOverlay}>
            {posterUrl && (
              <img 
                src={posterUrl} 
                alt="Video thumbnail" 
                className={styles.posterImage}
              />
            )}
            <button 
              className={styles.playButton}
              onClick={handlePlayClick}
              aria-label="Play video"
            >
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="white"
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}