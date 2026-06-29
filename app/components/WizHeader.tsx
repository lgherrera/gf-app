// app/components/WizHeader.tsx
'use client';

import Link from 'next/link';
import styles from './WizHeader.module.css';

const logoSrc = process.env.NEXT_PUBLIC_CONTENT_MODE === 'nsfw'
  ? '/gf_logo.jpg'
  : '/friends_logo.jpg';

export default function WizHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <img 
            src={logoSrc}
            alt="Logo" 
            className={styles.logo}
          />
        </Link>
      </div>
    </header>
  );
}