// app/components/chat/hooks/useAudioPlayback.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '../utils/types';

interface AudioPlaybackResult {
  playingMessageId: string | null;
  audioLoadingMessageId: string | null;
  handlePlayMessageAudio: (
    messageId: string,
    audioUrl?: string,
    messageContent?: string
  ) => Promise<void>;
  updateMessageAudio: (messageId: string, audioUrl: string) => void;
  cleanupAudio: () => void;
}

export function useAudioPlayback(
  voiceId?: string,
  voiceModel?: string
): AudioPlaybackResult {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioLoadingMessageId, setAudioLoadingMessageId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Expose an updater so the orchestrator can patch audioUrl onto messages
  // after TTS completes (fire-and-forget pattern)
  const updateCallbackRef = useRef<((messageId: string, audioUrl: string) => void) | null>(null);

  const updateMessageAudio = useCallback(
    (messageId: string, audioUrl: string) => {
      // Pre-cache the Audio element so playback is instant on tap
      if (!audioRefs.current.has(messageId)) {
        const audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => setPlayingMessageId(null));
        audio.addEventListener('error', () => setPlayingMessageId(null));
        audioRefs.current.set(messageId, audio);
      }
    },
    []
  );

  const cleanupAudio = useCallback(() => {
    audioRefs.current.forEach((audio) => audio.pause());
    audioRefs.current.clear();
    setPlayingMessageId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => audio.pause());
      audioRefs.current.clear();
    };
  }, []);

  const handlePlayMessageAudio = useCallback(
    async (messageId: string, audioUrl?: string, messageContent?: string) => {
      // Toggle off if already playing
      if (playingMessageId === messageId) {
        const audio = audioRefs.current.get(messageId);
        if (audio) audio.pause();
        setPlayingMessageId(null);
        return;
      }

      // Stop any currently playing audio
      if (playingMessageId) {
        const currentAudio = audioRefs.current.get(playingMessageId);
        if (currentAudio) currentAudio.pause();
      }

      // Play from existing URL
      if (audioUrl) {
        let audio = audioRefs.current.get(messageId);
        if (!audio) {
          audio = new Audio(audioUrl);
          audioRefs.current.set(messageId, audio);
          audio.addEventListener('ended', () => setPlayingMessageId(null));
          audio.addEventListener('error', () => setPlayingMessageId(null));
        }
        try {
          await audio.play();
          setPlayingMessageId(messageId);
        } catch (error) {
          console.error('Error playing audio:', error);
        }
        return;
      }

      // Generate TTS on-demand
      if (messageContent && voiceId) {
        setAudioLoadingMessageId(messageId);
        try {
          const response = await fetch('/api/elevenlabs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: messageContent,
              voiceId,
              voiceModel: voiceModel || 'eleven_turbo_v2_5',
            }),
          });
          const data = await response.json();

          if (data.audioUrl) {
            const audio = new Audio(data.audioUrl);
            audioRefs.current.set(messageId, audio);
            audio.addEventListener('ended', () => setPlayingMessageId(null));
            audio.addEventListener('error', () => setPlayingMessageId(null));
            await audio.play();
            setPlayingMessageId(messageId);

            // Return the URL so the orchestrator can update the message
            return data.audioUrl;
          }
        } catch (error) {
          console.error('Error generating audio:', error);
        } finally {
          setAudioLoadingMessageId(null);
        }
      }
    },
    [playingMessageId, voiceId, voiceModel]
  );

  return {
    playingMessageId,
    audioLoadingMessageId,
    handlePlayMessageAudio,
    updateMessageAudio,
    cleanupAudio,
  };
}