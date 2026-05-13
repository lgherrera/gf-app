// app/components/chat/hooks/useProgress.ts

import { useState, useCallback } from 'react';
import { updateProgress } from '@/lib/progress';

interface ProgressResult {
  currentStage: number;
  currentScore: number;
  trackProgress: (userId: string, girlfriendId: string, isFirstMessage: boolean) => void;
}

export function useProgress(): ProgressResult {
  const [currentStage, setCurrentStage] = useState(1);
  const [currentScore, setCurrentScore] = useState(0);

  const trackProgress = useCallback(
    (userId: string, girlfriendId: string, isFirstMessage: boolean) => {
      updateProgress(userId, girlfriendId, isFirstMessage)
        .then((result) => {
          setCurrentScore(result.score);
          if (result.stage !== currentStage) {
            setCurrentStage(result.stage);
          }
        })
        .catch((err) => console.error('Error updating progress:', err));
    },
    [currentStage]
  );

  return { currentStage, currentScore, trackProgress };
}