// app/page.tsx
import { supabase } from '@/lib/supabase';
import { withContentFilter } from '@/lib/girlfriends';
import { generateDescription } from '@/lib/gf-description';
import GFHeader from '@/app/components/GFHeader';
import GFCard from '@/app/components/GFCard';
import GFFooter from '@/app/components/GFFooter';
import CustomGirlfriends from '@/app/components/CustomGirlfriends';
import PageVisitTracker from '@/app/components/PageVisitTracker';
import BannerSlider from '@/app/components/BannerSlider';
import styles from './page.module.css';

const contentMode = process.env.NEXT_PUBLIC_CONTENT_MODE || 'sfw';

interface Girlfriend {
  id: string;
  slug: string;
  name: string;
  age: number;
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
  const [{ data: girlfriends, error }, { data: slides }] = await Promise.all([
    withContentFilter(
      supabase
        .from('girlfriends')
        .select('id, slug, name, age, occupation, nationality, personality_traits, hobbies, likes, fears, boundaries, image_url')
        .in('girlfriend_type', ['standard', 'premium'])
    ).order('created_at', { ascending: false }) as Promise<{ data: Girlfriend[] | null; error: any }>,

    supabase
      .from('slider')
      .select('id, image_url, alt_text, href')
      .eq('is_active', true)
      .eq('content_rating', contentMode)
      .order('created_at', { ascending: false }),
  ]);

  if (error) {
    console.error('Error fetching girlfriends:', error);
  }

  return (
    <div className={styles.page}>
      <PageVisitTracker page="/" />
      <GFHeader />

      <main className={styles.main}>
        <div className={styles.cardsContainer}>
          {slides && slides.length > 0 && (
            <BannerSlider slides={slides} />
          )}
          {girlfriends && girlfriends.map((gf) => (
            <GFCard
              key={gf.id}
              id={gf.id}
              slug={gf.slug}
              name={gf.name}
              age={gf.age}
              description={generateDescription(gf)}
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
