// app/components/chat/components/MessageBubble.tsx
'use client';

import React from 'react';
import styles from '../ChatInterface.module.css';
import { Message, OpeningScene } from '../utils/types';
import FormattedMessage from './FormattedMessage';
import AudioPlayButton from './AudioPlayButton';

interface MessageBubbleProps {
  message: Message;
  // Scene-specific props
  currentScene: OpeningScene | null;
  scenesCount: number;
  hasUserMessages: boolean;
  onShuffleScene: () => void;
  // Audio props
  hasVoice: boolean;
  playingMessageId: string | null;
  audioLoadingMessageId: string | null;
  onPlayAudio: (messageId: string, audioUrl?: string, content?: string) => void;
}

export default function MessageBubble({
  message,
  currentScene,
  scenesCount,
  hasUserMessages,
  onShuffleScene,
  hasVoice,
  playingMessageId,
  audioLoadingMessageId,
  onPlayAudio,
}: MessageBubbleProps) {
  // Image message
  if (message.imageUrl) {
    return (
      <div className={styles.imageMessage}>
        <img
          src={message.imageUrl}
          alt="Generated image"
          className={styles.scenarioImage}
        />
      </div>
    );
  }

  // User message
  if (message.role === 'user') {
    return (
      <div className={styles.messageBubbleRight}>
        <FormattedMessage content={message.content} />
      </div>
    );
  }

  // Scene (opening) message
  if (message.id.startsWith('scene_')) {
    return (
      <div className={styles.sceneWithButton}>
        <div className={styles.messageBubbleScenario}>
          {scenesCount > 1 && !hasUserMessages && (
            <button
              className={styles.shuffleButton}
              onClick={onShuffleScene}
              title="Cambiar escena"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>
          )}

          {currentScene?.scene_name && (
            <div className={styles.sceneLabel}>{currentScene.scene_name}</div>
          )}

          <FormattedMessage content={message.content} />
        </div>

        {hasVoice && (
          <AudioPlayButton
            messageId={message.id}
            isPlaying={playingMessageId === message.id}
            isLoading={audioLoadingMessageId === message.id}
            onToggle={() => onPlayAudio(message.id, message.audioUrl, message.content)}
          />
        )}
      </div>
    );
  }

  // Assistant message
  return (
    <div className={styles.messageWithButton}>
      <div className={styles.messageBubbleLeft}>
        <FormattedMessage content={message.content} />
      </div>

      {hasVoice && (
        <AudioPlayButton
          messageId={message.id}
          isPlaying={playingMessageId === message.id}
          isLoading={audioLoadingMessageId === message.id}
          onToggle={() => onPlayAudio(message.id, message.audioUrl, message.content)}
        />
      )}
    </div>
  );
}