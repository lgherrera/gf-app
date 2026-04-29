// app/sidebar/my-chats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import GFHeader from '@/app/components/GFHeader';
import GFFooter from '@/app/components/GFFooter';
import styles from './page.module.css';

interface ChatEntry {
  id: string;
  girlfriend_id: string;
  girlfriend_name: string;
  girlfriend_slug: string;
  girlfriend_avatar: string;
  girlfriend_occupation: string;
  last_active_at: string;
  message_count: number;
}

export default function MyChatsPage() {
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      const userId = localStorage.getItem('session_id');

      if (!userId) {
        setLoading(false);
        return;
      }

      // Get all chat sessions for this user, joined with girlfriend data
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          girlfriend_id,
          last_active_at,
          girlfriends (
            name,
            slug,
            avatar,
            occupation
          )
        `)
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        setLoading(false);
        return;
      }

      // Get message counts per session
      const chatEntries: ChatEntry[] = [];

      for (const session of sessions || []) {
        const gf = session.girlfriends as any;
        if (!gf) continue;

        // Count messages for this session
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', session.id);

        chatEntries.push({
          id: session.id,
          girlfriend_id: session.girlfriend_id,
          girlfriend_name: gf.name,
          girlfriend_slug: gf.slug,
          girlfriend_avatar: gf.avatar,
          girlfriend_occupation: gf.occupation || '',
          last_active_at: session.last_active_at,
          message_count: count || 0,
        });
      }

      setChats(chatEntries);
      setLoading(false);
    };

    fetchChats();
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
        <h1 className={styles.title}>Mis Chats</h1>

        {loading ? (
          <p className={styles.message}>Cargando...</p>
        ) : chats.length === 0 ? (
          <p className={styles.message}>Aún no tienes conversaciones.</p>
        ) : (
          <div className={styles.list}>
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={styles.row}
                onClick={() => handleClick(chat.girlfriend_slug)}
              >
                <div className={styles.avatarWrapper}>
                  <img
                    src={chat.girlfriend_avatar}
                    alt={chat.girlfriend_name}
                    className={styles.avatar}
                  />
                </div>
                <div className={styles.info}>
                  <h2 className={styles.name}>{chat.girlfriend_name}</h2>
                  <p className={styles.occupation}>{chat.girlfriend_occupation}</p>
                </div>
                <div className={styles.meta}>
                  <span className={styles.messageCount}>
                    {chat.message_count} {chat.message_count === 1 ? 'mensaje' : 'mensajes'}
                  </span>
                  <span className={styles.date}>{formatDate(chat.last_active_at)}</span>
                </div>
                <button
                  className={styles.chatButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick(chat.girlfriend_slug);
                  }}
                  type="button"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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