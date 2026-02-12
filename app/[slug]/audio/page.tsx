// app/[slug]/audio/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import AudioClient from './AudioClient';

interface AudioPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface Audio {
  id: string;
  title: string;
  audio_url: string;
  duration: number | null;
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

async function getAudios(girlfriendId: string) {
  const { data, error } = await supabase
    .from('profile_audios')
    .select('id, title, audio_url, duration, display_order')
    .eq('girlfriend_id', girlfriendId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching audios:', error.message);
    return [];
  }

  return data as Audio[];
}

export async function generateMetadata({ params }: AudioPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);
  
  if (!girlfriend) {
    return {
      title: 'Audio Not Found',
    };
  }

  return {
    title: `${girlfriend.name} - Audio`,
    description: `Listen to audio from ${girlfriend.name}`,
  };
}

export default async function AudioPage({ params }: AudioPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);

  if (!girlfriend) {
    notFound();
  }

  const audios = await getAudios(girlfriend.id);

  return (
    <AudioClient 
      girlfriend={{
        name: girlfriend.name,
        slug: girlfriend.slug,
        avatar: girlfriend.avatar,
      }}
      audios={audios}
    />
  );
}