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
        
        {/* Left: Hamburger Menu */}
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

        {/* Middle: Logo */}
        <div className={styles.logoContainer}>
          <Link href="/">
            <img 
              src={currentBrand.logo} 
              alt={`${currentBrand.name} Logo`} 
              className={styles.logo}
            />
          </Link>
        </div>

        {/* Right: Plus Button */}
        <Link href="/create" className={styles.iconButton}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            width="24" 
            height="24"
          >
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
          </svg>
        </Link>
        
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}