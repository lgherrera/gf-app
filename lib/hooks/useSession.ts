// lib/hooks/useSession.ts

'use client';

import { useEffect, useState } from 'react';

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    let id = localStorage.getItem('session_id');
    
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('session_id', id);
      
      // Register new session in database
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      }).catch(err => console.error('Failed to register session:', err));
    }
    
    setSessionId(id);
  }, []);
  
  return sessionId;
}