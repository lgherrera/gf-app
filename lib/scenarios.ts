// lib/scenarios.ts
import { supabase } from '@/lib/supabase';

export interface Scenario {
  id: string;
  scene_name: string;
  girlfriend_id: string; // Replaced 'name' with this
  description: string;
  video_slug: string | null;
  image_slug: string | null;
  mood: string | null;
  opener: string;
  is_premium: boolean;
  created_at: string;
}

export async function getScenariosByGirlfriend(girlfriendId: string): Promise<Scenario[]> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('girlfriend_id', girlfriendId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }

  return data || [];
}

export async function getRandomScenario(girlfriendId: string): Promise<Scenario | null> {
  const scenarios = await getScenariosByGirlfriend(girlfriendId);
  
  if (scenarios.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * scenarios.length);
  return scenarios[randomIndex];
}

export async function getScenarioById(scenarioId: string): Promise<Scenario | null> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (error) {
    console.error('Error fetching scenario:', error);
    return null;
  }

  return data;
}