// app/components/ChatVisitTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@/lib/hooks/useUser';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export default function ChatVisitTracker({ girlfriendSlug }: { girlfriendSlug: string }) {
  const userId = useUser();
  const tracked = useRef(false);

  useEffect(() => {
    if (!userId || tracked.current) return;
    tracked.current = true;

    const msisdn = getCookie('carrier_user_id') || 'unknown';

    fetch('/api/track-page-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msisdn,
        userId,
        page: `/${girlfriendSlug}/chat`,
        girlfriendSlug,
      }),
    }).catch(console.error);
  }, [userId]);

  return null;
}