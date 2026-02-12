// app/[slug]/videos/VideosClient.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './VideosClient.module.css';

interface Girlfriend {
  name: string;
  slug: string;
  avatar?: string;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  display_order: number;
}

interface VideosClientProps {
  girlfriend: Girlfriend;
  videos: Video[];
}

export default function VideosClient({ girlfriend, videos }: VideosClientProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
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

      {/* Videos Grid */}
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>Videos</h2>
        
        {videos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No videos available yet</p>
          </div>
        ) : (
          <div className={styles.videoGrid}>
            {videos.map((video) => (
              <div 
                key={video.id} 
                className={styles.videoCard}
                onClick={() => handleVideoClick(video)}
              >
                <div className={styles.thumbnailWrapper}>
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      className={styles.thumbnail}
                    />
                  ) : (
                    <div className={styles.thumbnailPlaceholder}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  )}
                  <div className={styles.playOverlay}>
                    <div className={styles.playButton}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className={styles.videoTitle}>{video.title}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Video Player */}
      {selectedVideo && (
        <div className={styles.videoPlayerOverlay}>
          <div className={styles.videoPlayerContainer}>
            <button 
              className={styles.closeButton}
              onClick={handleCloseVideo}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            
            <h3 className={styles.videoPlayerTitle}>{selectedVideo.title}</h3>
            
            <video
              className={styles.videoPlayer}
              src={selectedVideo.video_url}
              controls
              autoPlay
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}