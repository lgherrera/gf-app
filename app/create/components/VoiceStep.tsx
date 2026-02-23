// app/create/components/VoiceStep.tsx
'use client';

import { useState, useRef } from 'react';
import { VoiceOption } from '../types';
import styles from '../create.module.css';

interface VoiceStepProps {
  voices: VoiceOption[];
  selected: string | null;
  onSelect: (elevenlabsVoiceId: string) => void;
  isLoading: boolean;
}

export default function VoiceStep({ voices, selected, onSelect, isLoading }: VoiceStepProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = (elevenlabsId: string, previewUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingVoice === elevenlabsId) {
      setPlayingVoice(null);
      return;
    }

    const audio = new Audio(previewUrl);
    audio.onended = () => setPlayingVoice(null);
    audio.play().catch(() => setPlayingVoice(null));
    audioRef.current = audio;
    setPlayingVoice(elevenlabsId);
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Elige una Voz</h2>
      <p className={styles.stepSubtitle}>Escucha y elige la voz de tu compañera</p>

      {isLoading ? (
        <p className={styles.stepSubtitle}>Cargando voces...</p>
      ) : (
        <div className={styles.voiceList}>
          {voices.map((voice) => (
            <div
              key={voice.id}
              className={`${styles.voiceCard} ${selected === voice.elevenlabs_voice_id ? styles.voiceSelected : ''}`}
              onClick={() => onSelect(voice.elevenlabs_voice_id)}
            >
              <span className={styles.voiceLabel}>{voice.name}</span>
              <button
                className={styles.voicePlayButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(voice.elevenlabs_voice_id, voice.preview_url);
                }}
                type="button"
              >
                {playingVoice === voice.elevenlabs_voice_id ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}