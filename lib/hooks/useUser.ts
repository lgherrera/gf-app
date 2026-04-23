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

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export function useUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check for carrier auth cookie first
    const authUid = getCookie('carrier_auth_uid');
    if (authUid) {
      setUserId(authUid);
      return;
    }

    // Fall back to localStorage UUID
    let id = localStorage.getItem('gf_user_id');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('gf_user_id', id);
    }
    setUserId(id);
  }, []);

  return userId;
}