// app/[slug]/gallery/page.tsx
import { supabase } from '@/lib/supabase';
import { withContentFilter } from '@/lib/girlfriends';
import { notFound } from 'next/navigation';
import GalleryClient from './GalleryClient';

interface GalleryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface GalleryItem {
  id: string;
  title: string | null;
  image_url: string;
  thumbnail_url: string | null;
  display_order: number | null;
  media_type: string;
}

async function getGirlfriend(slug: string) {
  const { data, error } = await withContentFilter(
    supabase
      .from('girlfriends')
      .select('id, name, slug, avatar')
      .eq('slug', slug)
  ).single();

  if (error) {
    console.error('Error fetching girlfriend:', error.message);
    return null;
  }

  return data;
}

async function getGalleryItems(girlfriendId: string) {
  const { data, error } = await withContentFilter(
    supabase
      .from('gf_gallery')
      .select('id, title, image_url, thumbnail_url, display_order, media_type')
      .eq('girlfriend_id', girlfriendId)
  ).order('display_order', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching gallery:', error.message);
    return [];
  }

  return data as GalleryItem[];
}

export async function generateMetadata({ params }: GalleryPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);

  if (!girlfriend) {
    return {
      title: 'Gallery Not Found',
    };
  }

  return {
    title: `${girlfriend.name} - Galería`,
    description: `Galería de ${girlfriend.name}`,
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);

  if (!girlfriend) {
    notFound();
  }

  const items = await getGalleryItems(girlfriend.id);

  return (
    <GalleryClient
      girlfriend={{
        name: girlfriend.name,
        slug: girlfriend.slug,
        avatar: girlfriend.avatar,
      }}
      items={items}
    />
  );
}