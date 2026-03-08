// lib/scenes.ts
import { supabase } from '@/lib/supabase';

export interface Scene {
  id: string;
  scene_name: string;
  girlfriend_id: string;
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

export async function getScenesByGirlfriend(girlfriendId: string, stage: number = 1): Promise<Scene[]> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('girlfriend_id', girlfriendId)
    .lte('relationship_stage', stage)   // only unlocked scenes
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scenes:', error);
    return [];
  }

  return data || [];
}

export async function getRandomScene(girlfriendId: string, stage: number = 1): Promise<Scene | null> {
  const scenes = await getScenesByGirlfriend(girlfriendId, stage);

  if (scenes.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * scenes.length);
  return scenes[randomIndex];
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