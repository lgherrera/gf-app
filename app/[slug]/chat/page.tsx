// app/[slug]/chat/page.tsx
import { supabase } from '@/lib/supabase';
import { withContentFilter } from '@/lib/girlfriends';
import { notFound } from 'next/navigation';
import ChatInterface from '@/app/components/ChatInterface';

interface ChatPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getGirlfriend(slug: string) {
  const { data, error } = await withContentFilter(
    supabase
      .from('girlfriends')
      .select('id, name, slug, age, description, image_url, avatar, hello_url, hello_poster_url, voice_provider, voice_model, voice_id, occupation, gender, style, nationality')
      .eq('slug', slug)
  ).single();

  if (error) {
    console.error('Error fetching girlfriend:', error.message);
    return null;
  }

  return data;
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);
  
  if (!girlfriend) {
    return {
      title: 'Chat Not Found',
    };
  }

  return {
    title: `Chat with ${girlfriend.name}`,
    description: `Have a conversation with ${girlfriend.name}`,
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { slug } = await params;
  const girlfriend = await getGirlfriend(slug);

  if (!girlfriend) {
    notFound();
  }

  return (
    <ChatInterface 
      girlfriend={{
        id: girlfriend.id,
        slug: girlfriend.slug,
        name: girlfriend.name,
        age: girlfriend.age,
        description: girlfriend.description,
        image_url: girlfriend.image_url,
        avatar: girlfriend.avatar,
        hello_url: girlfriend.hello_url,
        hello_poster_url: girlfriend.hello_poster_url,
        voice_provider: girlfriend.voice_provider,
        voice_model: girlfriend.voice_model,
        voice_id: girlfriend.voice_id,
        occupation: girlfriend.occupation,
        gender: girlfriend.gender,
        style: girlfriend.style,
        nationality: girlfriend.nationality,
      }}
    />
  );
}