// lib/hooks/useUser.ts
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
    async function resolveUser() {
      // Check for carrier user ID cookie (set by middleware from Groobyte JWT)
      const carrierUserId = getCookie('carrier_user_id');

      if (carrierUserId) {
        // Check if we already provisioned this user (cached in localStorage)
        const cachedAuthId = localStorage.getItem('gf_auth_id');
        const cachedCarrier = localStorage.getItem('gf_carrier_id');

        if (cachedAuthId && cachedCarrier === carrierUserId) {
          // Already provisioned, use cached supabase_auth_id
          setUserId(cachedAuthId);
          return;
        }

        // Call provision API to create/lookup auth user
        try {
          const res = await fetch('/api/auth/provision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carrierUserId }),
          });

          if (res.ok) {
            const { supabaseAuthId } = await res.json();
            if (supabaseAuthId) {
              // Cache for future page loads
              localStorage.setItem('gf_auth_id', supabaseAuthId);
              localStorage.setItem('gf_carrier_id', carrierUserId);
              setUserId(supabaseAuthId);
              return;
            }
          }
        } catch (err) {
          console.error('Provision failed:', err);
        }
      }

      // Fall back to localStorage UUID
      let id = localStorage.getItem('gf_user_id');
      if (!id) {
        id = generateUUID();
        localStorage.setItem('gf_user_id', id);
      }
      setUserId(id);
    }

    resolveUser();
  }, []);

  return userId;
}