// app/components/CustomGirlfriends.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/hooks/useSession';
import GFCard from './GFCard';

interface Girlfriend {
  id: string;
  slug: string;
  name: string;
  age: number;
  description: string;
  image_url: string;
  animation_url: string | null;
}

export default function CustomGirlfriends() {
  const userId = useSession();
  const [girlfriends, setGirlfriends] = useState<Girlfriend[]>([]);

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/my-girlfriends?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setGirlfriends(data))
      .catch((err) => console.error('Failed to fetch custom girlfriends:', err));
  }, [userId]);

  if (girlfriends.length === 0) return null;

  return (
    <>
      {girlfriends.map((gf) => (
        <GFCard
          key={gf.id}
          id={gf.id}
          slug={gf.slug}
          name={gf.name}
          age={gf.age}
          description={gf.description}
          image_url={gf.image_url}
          animation_url={gf.animation_url}
        />
      ))}
    </>
  );
}