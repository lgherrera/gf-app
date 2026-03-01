// app/[slug]/images/page.tsx
import { supabase } from '@/lib/supabase';
import { withContentFilter } from '@/lib/girlfriends';
import { notFound } from 'next/navigation';
import ImagesClient from './ImagesClient';

interface ImagesPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface Image {
  id: string;
  title: string | null;
  image_url: string;
  thumbnail_url: string | null;
  display_order: number | null;
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

async function getImages(girlfriendId: string) {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('id, title, image_url, thumbnail_url, display_order')
    .eq('girlfriend_id', girlfriendId)
    .order('display_order', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching images:', error.message);
    return [];
  }

  return data as Image[];
}

export async function generateMetadata({ params }: ImagesPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);
  
  if (!girlfriend) {
    return {
      title: 'Images Not Found',
    };
  }

  return {
    title: `${girlfriend.name} - Images`,
    description: `View images from ${girlfriend.name}`,
  };
}

export default async function ImagesPage({ params }: ImagesPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);

  if (!girlfriend) {
    notFound();
  }

  const images = await getImages(girlfriend.id);

  return (
    <ImagesClient 
      girlfriend={{
        name: girlfriend.name,
        slug: girlfriend.slug,
        avatar: girlfriend.avatar,
      }}
      images={images}
    />
  );
}