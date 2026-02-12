// app/page.tsx
import { supabase } from '@/lib/supabase';
import GFHeader from '@/app/components/GFHeader';
import GFCard from '@/app/components/GFCard';
import GFFooter from '@/app/components/GFFooter';
import styles from './page.module.css';

export default async function GirlfriendPage() {
  // Fetch slug along with other data
  const { data: girlfriends, error } = await supabase
    .from('girlfriends')
    .select('id, slug, name, age, description, image_url') 
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching girlfriends:', error);
  }

  return (
    <div className={styles.page}>
      <GFHeader />
      
      <main className={styles.main}>
        {girlfriends && girlfriends.length > 0 ? (
          <div className={styles.cardsContainer}>
            {girlfriends.map((gf) => (
              <GFCard
                key={gf.id}
                id={gf.id}
                slug={gf.slug} // Pass the slug to the card
                name={gf.name}
                age={gf.age}
                description={gf.description}
                image_url={gf.image_url}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No AI girlfriends available at the moment.</p>
          </div>
        )}
      </main>

      <GFFooter />

    </div>
  );
}
