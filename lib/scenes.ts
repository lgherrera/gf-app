// lib/scenes.ts
import { supabase } from '@/lib/supabase';

export interface Scene {
  id: string;
  scene_name: string;
  description: string;
  video_slug: string | null;
  image_slug: string | null;
  audio_slug: string | null;
  mood: string | null;
  opener: string;
  relationship_stage: number;
  content_rating: string;
  created_at: string;
}

export async function getScenes(stage: number = 1, contentRating: string = 'sfw'): Promise<Scene[]> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('content_rating', contentRating)
    .lte('relationship_stage', stage)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scenes:', error);
    return [];
  }

  return data || [];
}

export async function getSceneById(sceneId: string): Promise<Scene | null> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', sceneId)
    .single();

  if (error) {
    console.error('Error fetching scene:', error);
    return null;
  }

  return data;
}