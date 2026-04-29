// app/sidebar/my-girlfriends/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import GFHeader from '@/app/components/GFHeader';
import GFFooter from '@/app/components/GFFooter';
import styles from './page.module.css';

interface CustomGirlfriend {
  id: string;
  slug: string;
  name: string;
  age: number;
  avatar: string;
  occupation: string;
  created_at: string;
}

export default function CustomGirlfriendsPage() {
  const [girlfriends, setGirlfriends] = useState<CustomGirlfriend[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCustomGirlfriends = async () => {
      const id = localStorage.getItem('session_id');

      if (!id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('girlfriends')
        .select('id, slug, name, age, avatar, occupation, created_at')
        .eq('created_by', id)
        .eq('girlfriend_type', 'custom')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching custom girlfriends:', error);
      } else {
        setGirlfriends(data || []);
      }
      setLoading(false);
    };

    fetchCustomGirlfriends();
  }, []);

  const handleClick = (slug: string) => {
    router.push(`/${slug}/chat`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.page}>
      <GFHeader />

      <main className={styles.main}>
        <h1 className={styles.title}>Mis Pololas</h1>

        {loading ? (
          <p className={styles.message}>Cargando...</p>
        ) : girlfriends.length === 0 ? (
          <p className={styles.message}>Aún no has creado ninguna novia personalizada.</p>
        ) : (
          <div className={styles.list}>
            {girlfriends.map((gf) => (
              <div
                key={gf.id}
                className={styles.row}
                onClick={() => handleClick(gf.slug)}
              >
                <div className={styles.avatarWrapper}>
                  <img
                    src={gf.avatar}
                    alt={gf.name}
                    className={styles.avatar}
                  />
                </div>
                <div className={styles.info}>
                  <h2 className={styles.name}>{gf.name}</h2>
                  <p className={styles.occupation}>{gf.occupation}</p>
                </div>
                <div className={styles.meta}>
                  <span className={styles.age}>{gf.age} años</span>
                  <span className={styles.date}>{formatDate(gf.created_at)}</span>
                </div>
                <button
                  className={styles.trashButton}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  type="button"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <GFFooter />
    </div>
  );
}