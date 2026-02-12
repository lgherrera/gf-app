// app/[slug]/videos/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import VideosClient from './VideosClient';

interface VideosPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  display_order: number;
}

async function getGirlfriend(slug: string) {
  const { data, error } = await supabase
    .from('girlfriends')
    .select('id, name, slug, avatar')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching girlfriend:', error.message);
    return null;
  }

  return data;
}

async function getVideos(girlfriendId: string) {
  console.log('Fetching videos for girlfriend_id:', girlfriendId);
  
  const { data, error, count } = await supabase
    .from('profile_videos')
    .select('id, title, video_url, thumbnail_url, display_order', { count: 'exact' })
    .eq('girlfriend_id', girlfriendId)
    .order('display_order', { ascending: true });

  console.log('Query result:', { data, error, count });

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }

  console.log('Videos found:', data?.length || 0, data);
  return data as Video[];
}

export async function generateMetadata({ params }: VideosPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);
  
  if (!girlfriend) {
    return {
      title: 'Videos Not Found',
    };
  }

  return {
    title: `${girlfriend.name} - Videos`,
    description: `Watch videos from ${girlfriend.name}`,
  };
}

export default async function VideosPage({ params }: VideosPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);

  if (!girlfriend) {
    notFound();
  }

  const videos = await getVideos(girlfriend.id);

  return (
    <VideosClient 
      girlfriend={{
        name: girlfriend.name,
        slug: girlfriend.slug,
        avatar: girlfriend.avatar,
      }}
      videos={videos}
    />
  );
}