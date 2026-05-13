// app/components/chat/hooks/useChatSession.ts

import { useState, useEffect } from 'react';

export function useChatSession(
  sessionId: string | null,
  userId: string | null,
  girlfriendId: string
) {
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        girlfriendId,
        source: process.env.NEXT_PUBLIC_APP_SOURCE || 'unknown',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) setDbSessionId(data.id);
      })
      .catch((err) => console.error('Failed to register session:', err));
  }, [sessionId, userId, girlfriendId]);

  return dbSessionId;
}