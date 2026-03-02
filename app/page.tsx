// app/page.tsx
import { supabase } from '@/lib/supabase';
import { withContentFilter } from '@/lib/girlfriends';
import GFHeader from '@/app/components/GFHeader';
import GFCard from '@/app/components/GFCard';
import GFFooter from '@/app/components/GFFooter';
import CustomGirlfriends from '@/app/components/CustomGirlfriends';
import styles from './page.module.css';

interface Girlfriend {
  id: string;
  slug: string;
  name: string;
  age: number;
  description: string;
  image_url: string;
}

export default async function GirlfriendPage() {
  const { data: girlfriends, error } = await withContentFilter(
    supabase
      .from('girlfriends')
      .select('id, slug, name, age, description, image_url')
      .in('girlfriend_type', ['standard', 'premium'])
  ).order('created_at', { ascending: false }) as { data: Girlfriend[] | null; error: any };

  if (error) {
    console.error('Error fetching girlfriends:', error);
  }

  return (
    <div className={styles.page}>
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
              description={gf.description}
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
