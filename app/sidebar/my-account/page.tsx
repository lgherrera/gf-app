// app/sidebar/my-account/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import GFHeader from '../../components/GFHeader';
import GFFooter from '../../components/GFFooter';
import styles from './my-account.module.css';

export default function MyAccountPage() {
  const userId = useUser();
  const [msisdn, setMsisdn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`/api/user-profile?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.msisdn) {
          setMsisdn(data.msisdn);
        }
      })
      .catch((err) => console.error('Failed to fetch profile:', err))
      .finally(() => setLoading(false));
  }, [userId]);

  const displayValue = loading ? '...' : msisdn || 'MSISDN no Identificado';

  return (
    <div className={styles.page}>
      <GFHeader />

      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className={styles.title}>Mi Cuenta</h1>
        <p className={styles.badge}>{displayValue}</p>
        <div className={styles.unsubscribeBox}>
          <p className={styles.unsubscribeText}>
            PARA DESUSCRIBIR ENVÍA SALIR AL 6920
          </p>
        </div>
      </div>

      <GFFooter />
    </div>
  );
}