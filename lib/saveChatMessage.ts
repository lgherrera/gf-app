// lib/saveChatMessage.ts
import { supabase } from './supabase';

// Deployment axis (mi/sexy/polola). Currently still holds sfw/nsfw until the env flip.
const APP_SOURCE = process.env.NEXT_PUBLIC_APP_SOURCE || 'unknown';

export async function saveChatMessage({
  userId,
  girlfriendId,
  role,
  content,
}: {
  userId: string;
  girlfriendId: string;
  role: 'user' | 'assistant';
  content: string;
}) {
  try {
    // Look up the girlfriend for the authoritative content_rating + name.
    const { data: girlfriend } = await supabase
      .from('girlfriends')
      .select('name, content_rating')
      .eq('id', girlfriendId)
      .single();

    const { error } = await supabase.from('chat_messages').insert({
      user_id: userId,
      girlfriend_id: girlfriendId,
      role,
      content,
      source: APP_SOURCE,
      content_rating: girlfriend?.content_rating ?? null,
      girlfriend_name: girlfriend?.name ?? null,
    });

    if (error) {
      console.error('Error saving message:', error);
    }
  } catch (err) {
    console.error('Error saving message:', err);
  }
}