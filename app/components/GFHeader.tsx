// app/components/GFHeader.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import styles from './GFHeader.module.css';
import { currentBrand } from '@/app/src/config/app-config';

export default function GFHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className={styles.header}>
        
        {/* Left: Back Button */}
        <Link href="/" className={styles.iconButton}>
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        {/* Middle: Logo */}
        <div className={styles.logoContainer}>
          <Link href="/gf">
            <img 
              src={currentBrand.logo} 
              alt={`${currentBrand.name} Logo`} 
              className={styles.logo}
            />
          </Link>
        </div>

        {/* Right: Hamburger Menu */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={styles.iconButton}
          aria-label="Abrir menú"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}