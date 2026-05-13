// app/components/chat/components/ChatMessages.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import styles from '../ChatInterface.module.css';
import { Message, OpeningScene } from '../utils/types';
import IntroVideoMessage from '../../IntroVideoMessage';
import MessageBubble from './MessageBubble';

interface ChatMessagesProps {
  messages: Message[];
  hasHistory: boolean;
  isLoading: boolean;
  error: string | null;
  onDismissError: () => void;
  // Girlfriend info
  helloUrl?: string;
  helloPosterUrl?: string;
  imageUrl?: string;
  hasVoice: boolean;
  // Scene
  currentScene: OpeningScene | null;
  scenesCount: number;
  onShuffleScene: () => void;
  // Audio
  playingMessageId: string | null;
  audioLoadingMessageId: string | null;
  onPlayAudio: (messageId: string, audioUrl?: string, content?: string) => void;
}

export default function ChatMessages({
  messages,
  hasHistory,
  isLoading,
  error,
  onDismissError,
  helloUrl,
  helloPosterUrl,
  imageUrl,
  hasVoice,
  currentScene,
  scenesCount,
  onShuffleScene,
  playingMessageId,
  audioLoadingMessageId,
  onPlayAudio,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasUserMessages = messages.some((m) => m.role === 'user');

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.chatArea}>
      {/* Intro video */}
      {helloUrl && (
        <IntroVideoMessage
          videoUrl={helloUrl}
          posterUrl={helloPosterUrl || imageUrl}
          onVideoEnd={() => {}}
          onVideoError={() => console.error('Video failed to load:', helloUrl)}
        />
      )}

      {/* History divider */}
      {hasHistory && messages.length > 0 && (
        <div className={styles.historyDivider}>
          <span>Mensajes anteriores</span>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentScene={currentScene}
          scenesCount={scenesCount}
          hasUserMessages={hasUserMessages}
          onShuffleScene={onShuffleScene}
          hasVoice={hasVoice}
          playingMessageId={playingMessageId}
          audioLoadingMessageId={audioLoadingMessageId}
          onPlayAudio={onPlayAudio}
        />
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className={styles.messageBubbleLeft}>
          <div className={styles.typingIndicator}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={onDismissError} className={styles.dismissError}>
            ×
          </button>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}