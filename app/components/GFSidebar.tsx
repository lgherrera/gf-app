// app/components/GFSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import styles from './GFSidebar.module.css';

const STAGE_LABELS: Record<number, string> = {
  1: 'Primera cita',
  2: 'Conocidas',
  3: 'Amigas',
  4: 'Cercanas',
  5: 'Íntimas',
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  girlfriend: {
    slug: string;
    name: string;
    description?: string;
    image_url?: string;
    occupation?: string;
    gender?: string;
    style?: string;
  };
  stage?: number;
  score?: number;
}

export default function GFSidebar({ isOpen, onClose, girlfriend, stage = 1, score = 0 }: SidebarProps) {

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className={styles.sidebarOverlay}
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Profile</h2>
          <button 
            className={styles.sidebarClose}
            onClick={onClose}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.sidebarContent}>
          {/* Profile Section */}
          <div className={styles.profileSection}>
            {girlfriend.image_url && (
              <img 
                src={girlfriend.image_url} 
                alt={girlfriend.name}
                className={styles.profileImage}
              />
            )}
            <p className={styles.profileDescription}>
              {girlfriend.description || 'No description available.'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className={styles.sidebarNav}>
            <Link 
              href={`/${girlfriend.slug}/images`}
              className={styles.sidebarLink}
              onClick={onClose}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Galería
            </Link>
          </nav>

          {/* Relationship Stage */}
          <div className={styles.stageSection}>
            <div className={styles.stageHeader}>
              <span className={styles.stageLabel}>Etapa de relación</span>
              <span className={styles.stageName}>{STAGE_LABELS[stage]}</span>
            </div>
            <div className={styles.stageDots}>
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`${styles.stageDot} ${step <= stage ? styles.stageDotActive : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Girlfriend Info */}
          {(girlfriend.name || girlfriend.occupation || girlfriend.gender || girlfriend.style) && (
            <div className={styles.infoSection}>
              {girlfriend.name && (
                <div className={styles.infoRow}>
                  <svg className={styles.infoIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Nombre</span>
                    <span className={styles.infoValue}>{girlfriend.name}</span>
                  </div>
                </div>
              )}
              {girlfriend.occupation && (
                <div className={styles.infoRow}>
                  <svg className={styles.infoIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Ocupación</span>
                    <span className={styles.infoValue}>{girlfriend.occupation}</span>
                  </div>
                </div>
              )}
              {girlfriend.gender && (
                <div className={styles.infoRow}>
                  <svg className={styles.infoIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="11" r="4"/>
                    <path d="M12 15v7"/>
                    <path d="M9 19h6"/>
                    <path d="M17 3l-5 5-5-5"/>
                  </svg>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Género</span>
                    <span className={styles.infoValue}>{girlfriend.gender}</span>
                  </div>
                </div>
              )}
              {girlfriend.style && (
                <div className={styles.infoRow}>
                  <svg className={styles.infoIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Estilo</span>
                    <span className={styles.infoValue}>{girlfriend.style}</span>
                  </div>
                </div>
              )}

              {/* Score */}
              <div className={styles.infoRow}>
                <svg className={styles.infoIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Score</span>
                  <span className={styles.infoValue}>{score} pts</span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}