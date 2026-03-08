// lib/progress.ts

import { PROGRESS_CONFIG as C } from '@/lib/progress.config';
import { supabase } from '@/lib/supabase';

export function calculateScore(messageCount: number, scenesUsed: number): number {
  return (
    messageCount * C.pointsPerMessage +
    scenesUsed   * C.pointsPerScene
  );
}

export function calculateStage(score: number): number {
  return Math.min(5, Math.floor(score / C.pointsPerStage) + 1);
}

export async function updateProgress(
  userId: string,
  girlfriendId: string,
  sceneUsed: boolean = false
): Promise<{ score: number; stage: number }> {
  const { data } = await supabase
    .from('user_progress')
    .select('message_count, scenes_used')
    .match({ user_id: userId, girlfriend_id: girlfriendId })
    .single();

  const newMessageCount = (data?.message_count ?? 0) + 1;
  const newScenesUsed   = (data?.scenes_used   ?? 0) + (sceneUsed ? 1 : 0);
  const newScore        = calculateScore(newMessageCount, newScenesUsed);
  const newStage        = calculateStage(newScore);

  await supabase.from('user_progress').upsert({
    user_id:          userId,
    girlfriend_id:    girlfriendId,
    message_count:    newMessageCount,
    scenes_used:      newScenesUsed,
    score:            newScore,
    stage:            newStage,
    last_interaction: new Date().toISOString(),
  }, { onConflict: 'user_id,girlfriend_id' });

  return { score: newScore, stage: newStage };
}