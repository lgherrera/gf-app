// lib/saveChatMessage.ts
import { supabase } from './supabase';

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
    const { error } = await supabase.from('chat_messages').insert({
      user_id: userId,
      girlfriend_id: girlfriendId,
      role,
      content,
      source: APP_SOURCE,
    });

    if (error) {
      console.error('Error saving message:', error);
    }
  } catch (err) {
    console.error('Error saving message:', err);
  }
}