// app/components/chat/hooks/useOpeningScenes.ts

import { useState, useEffect, useCallback } from 'react';
import { OpeningScene, Message } from '../utils/types';
import { generateMessageId, personalizeLine } from '../utils/messages';

const contentRating = process.env.NEXT_PUBLIC_CONTENT_MODE || 'sfw';

interface OpeningScenesResult {
  scenes: OpeningScene[];
  currentScene: OpeningScene | null;
  isLoadingScenes: boolean;
  buildOpeningMessage: (girlfriendName: string) => Message | null;
  pickRandomScene: (girlfriendName: string) => Message | null;
}

export function useOpeningScenes(): OpeningScenesResult {
  const [scenes, setScenes] = useState<OpeningScene[]>([]);
  const [currentScene, setCurrentScene] = useState<OpeningScene | null>(null);
  const [isLoadingScenes, setIsLoadingScenes] = useState(true);

  useEffect(() => {
    const fetchScenes = async () => {
      try {
        const response = await fetch(`/api/opening-scenes?contentRating=${contentRating}`);
        const data = await response.json();

        if (data.scenes && data.scenes.length > 0) {
          setScenes(data.scenes);
          const randomIndex = Math.floor(Math.random() * data.scenes.length);
          setCurrentScene(data.scenes[randomIndex]);
        }
      } catch (err) {
        console.error('Error fetching opening scenes:', err);
      } finally {
        setIsLoadingScenes(false);
      }
    };

    fetchScenes();
  }, []);

  const buildOpeningMessage = useCallback(
    (girlfriendName: string): Message | null => {
      if (!currentScene?.opening_line) return null;
      return {
        id: 'scene_' + generateMessageId(),
        role: 'assistant',
        content: personalizeLine(currentScene.opening_line, girlfriendName),
        timestamp: new Date(),
      };
    },
    [currentScene]
  );

  const pickRandomScene = useCallback(
    (girlfriendName: string): Message | null => {
      if (scenes.length <= 1) return null;

      let newScene: OpeningScene;
      do {
        const randomIndex = Math.floor(Math.random() * scenes.length);
        newScene = scenes[randomIndex];
      } while (newScene.id === currentScene?.id && scenes.length > 1);

      setCurrentScene(newScene);

      return {
        id: 'scene_' + generateMessageId(),
        role: 'assistant',
        content: personalizeLine(newScene.opening_line, girlfriendName),
        timestamp: new Date(),
      };
    },
    [scenes, currentScene]
  );

  return { scenes, currentScene, isLoadingScenes, buildOpeningMessage, pickRandomScene };
}