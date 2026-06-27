// app/page.tsx
import { supabase } from '@/lib/supabase';
import { withContentFilter } from '@/lib/girlfriends';
import { generateDescription } from '@/lib/gf-description';
import GFHeader from '@/app/components/GFHeader';
import BannerSlider from '@/app/components/BannerSlider';
import GFCard from '@/app/components/GFCard';
import GFFooter from '@/app/components/GFFooter';
import CustomGirlfriends from '@/app/components/CustomGirlfriends';
import PageVisitTracker from '@/app/components/PageVisitTracker';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

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
  animation_url: string | null;
}

interface Slide {
  id: string;
  image_url: string;
  alt_text: string | null;
  href: string;
}

export default async function GirlfriendPage() {
  const [girlfriendsResult, slidesResult] = await Promise.all([
    withContentFilter(
      supabase
        .from('girlfriends')
        .select('id, slug, name, age, occupation, nationality, personality_traits, hobbies, likes, fears, boundaries, image_url, animation_url')
        .in('girlfriend_type', ['standard', 'premium'])
    ).order('created_at', { ascending: false }) as Promise<{ data: Girlfriend[] | null; error: any }>,

    withContentFilter(
      supabase
        .from('slider')
        .select('id, image_url, alt_text, href')
        .eq('is_active', true)
    ).order('sort_order', { ascending: true }) as unknown as Promise<{ data: Slide[] | null; error: any }>,
  ]);

  const { data: girlfriends, error } = girlfriendsResult;
  const { data: slides, error: slidesError } = slidesResult;

  if (error) {
    console.error('Error fetching girlfriends:', error);
  }
  if (slidesError) {
    console.error('Error fetching slides:', slidesError);
  }

  return (
    <div className={styles.page}>
      <PageVisitTracker page="/" />
      <GFHeader />

      <main className={styles.main}>
        {slides && slides.length > 0 && (
          <BannerSlider slides={slides} />
        )}

        <div className={styles.cardsContainer}>
          {girlfriends && girlfriends.map((gf) => (
            <GFCard
              key={gf.id}
              id={gf.id}
              slug={gf.slug}
              name={gf.name}
              age={gf.age}
              description={generateDescription(gf)}
              image_url={gf.image_url}
              animation_url={gf.animation_url}
            />
          ))}
          <CustomGirlfriends />
        </div>
      </main>

      <GFFooter />
    </div>
  );
}
