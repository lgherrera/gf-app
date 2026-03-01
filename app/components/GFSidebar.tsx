// app/components/GFSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import styles from './GFSidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  girlfriend: {
    slug: string;
    name: string;
    description?: string;
    image_url?: string;
  };
}

export default function GFSidebar({ isOpen, onClose, girlfriend }: SidebarProps) {
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
        </div>
      </div>
    </>
  );
}