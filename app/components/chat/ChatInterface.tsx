// app/components/chat/ChatInterface.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './ChatInterface.module.css';
import { useUser } from '@/lib/hooks/useUser';
import { useSession } from '@/lib/hooks/useSession';
import GFSidebar from '../GFSidebar';

// Types
import { Message, ChatInterfaceProps } from './utils/types';
import { generateMessageId } from './utils/messages';

// Hooks
import { useChatSession } from './hooks/useChatSession';
import { useChatHistory } from './hooks/useChatHistory';
import { useOpeningScenes } from './hooks/useOpeningScenes';
import { useProgress } from './hooks/useProgress';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useVoiceRecording } from './hooks/useVoiceRecording';

// Components
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import DeleteChatModal from './components/DeleteChatModal';

// Module-level flag — survives React re-renders and stale closures
let _pendingInputType: 'text' | 'voice' = 'text';

export default function ChatInterface({ girlfriend }: ChatInterfaceProps) {
  const userId = useUser();
  const sessionId = useSession();

  // ── Hooks ──
  const dbSessionId = useChatSession(sessionId, userId, girlfriend.id);
  const { historyMessages, hasHistory: hadHistory, isLoadingHistory } = useChatHistory(userId, girlfriend.id);
  const { scenes, currentScene, isLoadingScenes, buildOpeningMessage, pickRandomScene } = useOpeningScenes();
  const { currentStage, currentScore, trackProgress } = useProgress();
  const audioPlayback = useAudioPlayback(girlfriend.voice_id, girlfriend.voice_model);

  // ── Local state ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isFirstMessageInScene, setIsFirstMessageInScene] = useState(false);

  // ── Voice recording ──
  const handleVoiceTranscription = useCallback(
    (text: string) => {
      _pendingInputType = 'voice';
      handleSendMessage(text);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, userId, isLoading]
  );

  const handleVoiceError = useCallback(
    (message: string) => setError(message),
    []
  );

  const voiceRecording = useVoiceRecording(handleVoiceTranscription, handleVoiceError);

  // ── Initialize messages from history ──
  useEffect(() => {
    if (!isLoadingHistory && hadHistory && historyMessages.length > 0 && !hasInitialized) {
      setMessages(historyMessages);
      setHasHistory(true);
      setHasInitialized(true);
    }
  }, [isLoadingHistory, hadHistory, historyMessages, hasInitialized]);

  // ── Initialize messages from opening scene (only if no history) ──
  useEffect(() => {
    if (currentScene && !isLoadingScenes && !isLoadingHistory && !hadHistory && !hasInitialized) {
      const openingMessage = buildOpeningMessage(girlfriend.name);
      if (openingMessage) {
        setMessages([openingMessage]);
        setHasInitialized(true);
        setIsFirstMessageInScene(true);
      }
    }
  }, [currentScene, isLoadingScenes, isLoadingHistory, hadHistory, hasInitialized, buildOpeningMessage, girlfriend.name]);

  // ── Scene shuffle ──
  const handleRandomScene = useCallback(() => {
    audioPlayback.cleanupAudio();

    const sceneMessage = pickRandomScene(girlfriend.name);
    if (sceneMessage) {
      setMessages([sceneMessage]);
      setHasHistory(false);
      setIsFirstMessageInScene(true);
    }
  }, [audioPlayback, pickRandomScene, girlfriend.name]);

  // ── Delete chat ──
  const handleDeleteChat = useCallback(async () => {
    if (!userId || isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/chat-history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, girlfriendId: girlfriend.id }),
      });
      const data = await res.json();

      if (data.success) {
        audioPlayback.cleanupAudio();
        setHasHistory(false);
        setIsFirstMessageInScene(true);

        const openingMessage = buildOpeningMessage(girlfriend.name);
        setMessages(openingMessage ? [openingMessage] : []);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [userId, isDeleting, girlfriend.id, girlfriend.name, audioPlayback, buildOpeningMessage]);

  // ── Send message ──
  const handleSendMessage = useCallback(
    async (overrideText?: string) => {
      const trimmedInput = (overrideText ?? inputValue).trim();
      if (!trimmedInput || isLoading || !userId) return;

      // Read and reset the module-level input type flag
      const inputType = _pendingInputType;
      _pendingInputType = 'text';

      setError(null);

      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content: trimmedInput,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);

      // Track progress
      trackProgress(userId, girlfriend.id, isFirstMessageInScene);
      if (isFirstMessageInScene) setIsFirstMessageInScene(false);

      try {
        const recentMessages = [...messages, userMessage].slice(-20);
        const conversationHistory = recentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            girlfriendId: girlfriend.id,
            userId,
            messages: conversationHistory,
            scenarioDescription: currentScene?.opening_line
              ? currentScene.opening_line.replace('[name]', girlfriend.name)
              : undefined,
            sessionId: dbSessionId,
            inputType,
          }),
        });

        const chatData = await chatResponse.json();

        if (!chatResponse.ok) {
          throw new Error(chatData.error || `Error ${chatResponse.status}: Failed to get response`);
        }
        if (!chatData.message) {
          throw new Error('No message received from AI');
        }

        const messageId = generateMessageId();

        const assistantMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: chatData.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Fire-and-forget TTS generation
        if (girlfriend.voice_id) {
          fetch('/api/elevenlabs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: chatData.message,
              voiceId: girlfriend.voice_id,
              voiceModel: girlfriend.voice_model || 'eleven_turbo_v2_5',
            }),
          })
            .then((res) => res.json())
            .then((audioData) => {
              if (audioData.audioUrl) {
                audioPlayback.updateMessageAudio(messageId, audioData.audioUrl);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === messageId ? { ...msg, audioUrl: audioData.audioUrl } : msg
                  )
                );
              }
            })
            .catch((err) => console.error('Error generating audio:', err));
        }
      } catch (err) {
        console.error('Chat error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading, userId, messages, girlfriend, currentScene, dbSessionId, isFirstMessageInScene, trackProgress, audioPlayback]
  );

  // ── Audio play handler (bridges playback hook with message state) ──
  const handlePlayAudio = useCallback(
    async (messageId: string, audioUrl?: string, content?: string) => {
      const newAudioUrl = await audioPlayback.handlePlayMessageAudio(messageId, audioUrl, content);
      if (newAudioUrl && typeof newAudioUrl === 'string') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, audioUrl: newAudioUrl } : msg
          )
        );
      }
    },
    [audioPlayback]
  );

  // ── Render ──
  return (
    <div className={styles.container}>
      <ChatHeader
        girlfriendName={girlfriend.name}
        avatar={girlfriend.avatar}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onDeleteChat={() => setShowDeleteConfirm(true)}
      />

      <GFSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        girlfriend={{
          slug: girlfriend.slug,
          name: girlfriend.name,
          age: girlfriend.age,
          occupation: girlfriend.occupation || '',
          nationality: girlfriend.nationality || null,
          personality_traits: girlfriend.personality_traits || null,
          hobbies: girlfriend.hobbies || null,
          likes: girlfriend.likes || null,
          fears: girlfriend.fears || null,
          image_url: girlfriend.image_url,
          avatar: girlfriend.avatar,
          gender: girlfriend.gender,
          style: girlfriend.style,
        }}
        stage={currentStage}
        score={currentScore}
      />

      <ChatMessages
        messages={messages}
        hasHistory={hasHistory}
        isLoading={isLoading}
        error={error}
        onDismissError={() => setError(null)}
        helloUrl={girlfriend.hello_url}
        helloPosterUrl={girlfriend.hello_poster_url}
        imageUrl={girlfriend.image_url}
        hasVoice={!!girlfriend.voice_id}
        currentScene={currentScene}
        scenesCount={scenes.length}
        onShuffleScene={handleRandomScene}
        playingMessageId={audioPlayback.playingMessageId}
        audioLoadingMessageId={audioPlayback.audioLoadingMessageId}
        onPlayAudio={handlePlayAudio}
      />

      <ChatInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={() => handleSendMessage()}
        isLoading={isLoading}
        girlfriendSlug={girlfriend.slug}
        isRecording={voiceRecording.isRecording}
        isTranscribing={voiceRecording.isTranscribing}
        recordingSeconds={voiceRecording.recordingSeconds}
        onStartRecording={voiceRecording.startRecording}
        onStopRecording={voiceRecording.stopRecording}
      />

      {showDeleteConfirm && (
        <DeleteChatModal
          girlfriendName={girlfriend.name}
          isDeleting={isDeleting}
          onConfirm={handleDeleteChat}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}