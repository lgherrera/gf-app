// app/page.tsx
import { supabase } from '@/lib/supabase';
import { withContentFilter } from '@/lib/girlfriends';
import { generateDescription } from '@/lib/gf-description';
import GFHeader from '@/app/components/GFHeader';
import GFCard from '@/app/components/GFCard';
import GFFooter from '@/app/components/GFFooter';
import CustomGirlfriends from '@/app/components/CustomGirlfriends';
import PageVisitTracker from '@/app/components/PageVisitTracker';
import styles from './page.module.css';

interface Girlfriend {
  id: string;
  slug: string;
  name: string;
  age: number;
  description: string | null;
  occupation: string;
  nationality: string | null;
  personality_traits: string[] | null;
  hobbies: string[] | null;
  likes: string[] | null;
  fears: string[] | null;
  boundaries: string[] | null;
  image_url: string;
}

export default async function GirlfriendPage() {
  const { data: girlfriends, error } = await withContentFilter(
    supabase
      .from('girlfriends')
      .select('id, slug, name, age, description, occupation, nationality, personality_traits, hobbies, likes, fears, boundaries, image_url')
      .in('girlfriend_type', ['standard', 'premium'])
  ).order('created_at', { ascending: false }) as { data: Girlfriend[] | null; error: any };

  if (error) {
    console.error('Error fetching girlfriends:', error);
  }

  return (
    <div className={styles.page}>
      <PageVisitTracker page="/" />
      <GFHeader />

      <main className={styles.main}>
        <div className={styles.cardsContainer}>
          {girlfriends && girlfriends.map((gf) => (
            <GFCard
              key={gf.id}
              id={gf.id}
              slug={gf.slug}
              name={gf.name}
              age={gf.age}
              description={gf.description || generateDescription(gf)}
              image_url={gf.image_url}
            />
          ))}
          <CustomGirlfriends />
        </div>
      </main>

      <GFFooter />
    </div>
  );
}
