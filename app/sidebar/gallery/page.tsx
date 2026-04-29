// app/sidebar/gallery/page.tsx
import { supabase } from '@/lib/supabase';
import GalleryGrid from '@/app/components/GalleryGrid';
import GFHeader from '@/app/components/GFHeader';
import GFFooter from '@/app/components/GFFooter';
import styles from './page.module.css';

interface ProfileImage {
  id: string;
  girlfriend_id: string;
  title: string;
  image_url: string;
  thumbnail_url: string;
  display_order: number;
  created_at: string;
  content_rating: string;
}

export default async function GaleriaPage() {
  const contentMode = process.env.NEXT_PUBLIC_CONTENT_MODE ?? 'sfw';

  const { data: images, error } = await supabase
    .from('gallery_images')
    .select('id, girlfriend_id, title, image_url, thumbnail_url, display_order, created_at, content_rating')
    .eq('content_rating', contentMode)
    .order('created_at', { ascending: false }) as { data: ProfileImage[] | null; error: any };

  if (error) {
    console.error('Error fetching gallery images:', error);
  }

  return (
    <div className={styles.page}>
      <GFHeader />

      <main className={styles.main}>
        <h1 className={styles.title}>Galería</h1>
        {images && images.length > 0 ? (
          <GalleryGrid images={images} />
        ) : (
          <p className={styles.empty}>No hay imágenes disponibles.</p>
        )}
      </main>

      <GFFooter />
    </div>
  );
}