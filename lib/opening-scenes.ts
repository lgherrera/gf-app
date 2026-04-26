// lib/opening-scenes.ts
import { supabase } from '@/lib/supabase';

export interface OpeningScene {
  id: string;
  scene_name: string;
  opening_line: string;
  mood: string | null;
  audio_slug: string | null;
  content_rating: string;
  created_at: string;
}

export async function getOpeningScenes(contentRating: string = 'sfw'): Promise<OpeningScene[]> {
  const { data, error } = await supabase
    .from('opening_scenes')
    .select('*')
    .eq('content_rating', contentRating)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opening scenes:', error);
    return [];
  }

  return data || [];
}

export async function getOpeningSceneById(sceneId: string): Promise<OpeningScene | null> {
  const { data, error } = await supabase
    .from('opening_scenes')
    .select('*')
    .eq('id', sceneId)
    .single();

  if (error) {
    console.error('Error fetching opening scene:', error);
    return null;
  }

  return data;
}