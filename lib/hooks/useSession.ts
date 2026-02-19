// lib/hooks/useSession.ts

'use client';

import { useEffect, useState } from 'react';

function generateUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('session_id');

    if (!id) {
      id = generateUUID();
      localStorage.setItem('session_id', id);

      // Register new session in database
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: id,
          source: process.env.NEXT_PUBLIC_APP_SOURCE || 'unknown',
        }),
      }).catch(err => console.error('Failed to register session:', err));
    }

    setSessionId(id);
  }, []);

  return sessionId;
}