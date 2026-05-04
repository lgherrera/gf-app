// app/sidebar/my-chats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import GFHeader from '@/app/components/GFHeader';
import GFFooter from '@/app/components/GFFooter';
import styles from './page.module.css';

interface ChatEntry {
  girlfriend_id: string;
  girlfriend_name: string;
  girlfriend_slug: string;
  girlfriend_avatar: string;
  girlfriend_occupation: string;
  last_message_at: string;
  message_count: number;
}

export default function MyChatsPage() {
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ChatEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const userId = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchChats = async () => {
      // Get all distinct girlfriends this user has chatted with
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('girlfriend_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !messages || messages.length === 0) {
        console.error('Error fetching chats:', error);
        setLoading(false);
        return;
      }

      // Group by girlfriend_id: count messages and find latest timestamp
      const grouped = new Map<string, { count: number; lastAt: string }>();
      for (const msg of messages) {
        const existing = grouped.get(msg.girlfriend_id);
        if (existing) {
          existing.count++;
        } else {
          grouped.set(msg.girlfriend_id, {
            count: 1,
            lastAt: msg.created_at,
          });
        }
      }

      // Fetch girlfriend details for all IDs
      const gfIds = Array.from(grouped.keys());
      const { data: girlfriends, error: gfError } = await supabase
        .from('girlfriends')
        .select('id, name, slug, avatar, occupation')
        .in('id', gfIds);

      if (gfError || !girlfriends) {
        console.error('Error fetching girlfriends:', gfError);
        setLoading(false);
        return;
      }

      // Build the chat entries, sorted by most recent message
      const entries: ChatEntry[] = girlfriends
        .map((gf) => {
          const stats = grouped.get(gf.id);
          return {
            girlfriend_id: gf.id,
            girlfriend_name: gf.name,
            girlfriend_slug: gf.slug,
            girlfriend_avatar: gf.avatar,
            girlfriend_occupation: gf.occupation || '',
            last_message_at: stats?.lastAt || '',
            message_count: stats?.count || 0,
          };
        })
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setChats(entries);
      setLoading(false);
    };

    fetchChats();
  }, [userId]);

  const handleClick = (slug: string) => {
    router.push(`/${slug}/chat`);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !userId || isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/chat-history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, girlfriendId: deleteTarget.girlfriend_id }),
      });

      const data = await res.json();

      if (data.success) {
        setChats(prev => prev.filter(c => c.girlfriend_id !== deleteTarget.girlfriend_id));
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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
                key={chat.girlfriend_id}
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
                  <span className={styles.date}>{formatDate(chat.last_message_at)}</span>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.chatButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick(chat.girlfriend_slug);
                    }}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(chat);
                    }}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#666">
                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <GFFooter />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <>
          <div className={styles.modalBackdrop} onClick={() => setDeleteTarget(null)} />
          <div className={styles.modal}>
            <p className={styles.modalText}>
              ¿Eliminar todos los mensajes con {deleteTarget.girlfriend_name}?
            </p>
            <p className={styles.modalSubtext}>
              Tu nivel de relación se mantendrá.
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalCancel}
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className={styles.modalConfirm}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}