// app/components/ChatInterface.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import IntroVideoMessage from './IntroVideoMessage';
import GFSidebar from './GFSidebar';
import styles from './ChatInterface.module.css';
import { useUser } from '@/lib/hooks/useUser';
import { useSession } from '@/lib/hooks/useSession';
import { updateProgress } from '@/lib/progress';

const contentRating = process.env.NEXT_PUBLIC_APP_SOURCE || 'sfw';

interface Girlfriend {
  id: string;
  slug: string;
  name: string;
  age?: number;
  description?: string;
  image_url?: string;
  avatar?: string;
  hello_url?: string;
  hello_poster_url?: string;
  voice_provider?: string;
  voice_model?: string;
  voice_id?: string;
  occupation?: string;
  gender?: string;
  style?: string;
  nationality?: string;
}

interface OpeningScene {
  id: string;
  scene_name: string;
  opening_line: string;
  mood: string | null;
  audio_slug: string | null;
  content_rating: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
}

interface ChatInterfaceProps {
  girlfriend: Girlfriend;
}

export default function ChatInterface({ girlfriend }: ChatInterfaceProps) {
  const userId = useUser();
  const sessionId = useSession();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Session DB id (chat_sessions.id uuid)
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);

  // Opening scene state
  const [scenes, setScenes] = useState<OpeningScene[]>([]);
  const [currentScene, setCurrentScene] = useState<OpeningScene | null>(null);
  const [isLoadingScenes, setIsLoadingScenes] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Progress state
  const [currentStage, setCurrentStage] = useState(1);
  const [currentScore, setCurrentScore] = useState(0);
  const [isFirstMessageInScene, setIsFirstMessageInScene] = useState(false);

  // Audio playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioLoadingMessageId, setAudioLoadingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Register chat session and store the DB id
  useEffect(() => {
    if (!sessionId || !userId) return;

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId,
        girlfriendId: girlfriend.id,
        source: process.env.NEXT_PUBLIC_APP_SOURCE || 'unknown',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setDbSessionId(data.id);
        }
      })
      .catch(err => console.error('Failed to register session:', err));
  }, [sessionId, userId, girlfriend.id]);

  // Fetch opening scenes on mount
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      messageAudioRefs.current.forEach(audio => audio.pause());
      messageAudioRefs.current.clear();
    };
  }, []);

  // Build opening message from scene opening_line
  const buildOpeningMessages = (): Message[] => {
    if (!currentScene?.opening_line) return [];
    
    return [{
      id: 'scene_' + generateMessageId(),
      role: 'assistant',
      content: currentScene.opening_line,
      timestamp: new Date()
    }];
  };

  // Show opening message once scene is loaded
  useEffect(() => {
    if (currentScene && !isLoadingScenes && !hasInitialized) {
      const openingMessages = buildOpeningMessages();
      if (openingMessages.length > 0) {
        setMessages(openingMessages);
        setHasInitialized(true);
        setIsFirstMessageInScene(true);
      }
    }
  }, [currentScene, isLoadingScenes, hasInitialized]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleRandomScene = () => {
    if (scenes.length <= 1) return;
    
    // Stop any playing audio
    messageAudioRefs.current.forEach(audio => audio.pause());
    messageAudioRefs.current.clear();
    setPlayingMessageId(null);
    
    let newScene: OpeningScene;
    do {
      const randomIndex = Math.floor(Math.random() * scenes.length);
      newScene = scenes[randomIndex];
    } while (newScene.id === currentScene?.id && scenes.length > 1);
    
    setCurrentScene(newScene);
    setIsFirstMessageInScene(true);
    
    setMessages([{
      id: 'scene_' + generateMessageId(),
      role: 'assistant',
      content: newScene.opening_line,
      timestamp: new Date()
    }]);
  };

  const handlePlayMessageAudio = async (messageId: string, audioUrl?: string, messageContent?: string) => {
    if (playingMessageId === messageId) {
      const audio = messageAudioRefs.current.get(messageId);
      if (audio) {
        audio.pause();
        setPlayingMessageId(null);
      }
      return;
    }

    if (playingMessageId) {
      const currentAudio = messageAudioRefs.current.get(playingMessageId);
      if (currentAudio) currentAudio.pause();
    }

    if (audioUrl) {
      let audio = messageAudioRefs.current.get(messageId);
      if (!audio) {
        audio = new Audio(audioUrl);
        messageAudioRefs.current.set(messageId, audio);
        audio.addEventListener('ended', () => setPlayingMessageId(null));
        audio.addEventListener('error', () => setPlayingMessageId(null));
      }
      try {
        await audio.play();
        setPlayingMessageId(messageId);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    } else if (messageContent) {
      if (!girlfriend.voice_id) return;

      setAudioLoadingMessageId(messageId);
      
      try {
        const response = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: messageContent,
            voiceId: girlfriend.voice_id,
            voiceModel: girlfriend.voice_model || 'eleven_turbo_v2_5',
          }),
        });

        const data = await response.json();

        if (data.audioUrl) {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, audioUrl: data.audioUrl } : msg
          ));

          const audio = new Audio(data.audioUrl);
          messageAudioRefs.current.set(messageId, audio);
          audio.addEventListener('ended', () => setPlayingMessageId(null));
          audio.addEventListener('error', () => setPlayingMessageId(null));
          await audio.play();
          setPlayingMessageId(messageId);
        }
      } catch (error) {
        console.error('Error generating audio:', error);
      } finally {
        setAudioLoadingMessageId(null);
      }
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading || !userId) return;

    setError(null);

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Update progress
    updateProgress(userId, girlfriend.id, isFirstMessageInScene)
      .then(result => {
        setCurrentScore(result.score);
        if (result.stage !== currentStage) {
          setCurrentStage(result.stage);
        }
      })
      .catch(err => console.error('Error updating progress:', err));

    if (isFirstMessageInScene) setIsFirstMessageInScene(false);

    try {
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          girlfriendId: girlfriend.id,
          userId: userId,
          messages: conversationHistory,
          scenarioDescription: currentScene?.opening_line,
          sessionId: dbSessionId,
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

      setMessages(prev => [...prev, assistantMessage]);

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
          .then(res => res.json())
          .then(audioData => {
            if (audioData.audioUrl) {
              setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, audioUrl: audioData.audioUrl } : msg
              ));
            }
          })
          .catch(err => console.error('Error generating audio:', err));
      }

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    const parts = content.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span key={index} className={styles.actionText}>
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.iconButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        <div className={styles.headerCenter}>
          {girlfriend.avatar && (
            <img src={girlfriend.avatar} alt={girlfriend.name} className={styles.avatar} />
          )}
          <h1 className={styles.headerTitle}>{girlfriend.name}</h1>
        </div>

        <button 
          className={styles.iconButton}
          onClick={() => setIsSidebarOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </header>

      {/* Sidebar */}
      <GFSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        girlfriend={{
          slug: girlfriend.slug,
          name: girlfriend.name,
          description: girlfriend.description,
          image_url: girlfriend.image_url,
          occupation: girlfriend.occupation,
          gender: girlfriend.gender,
          style: girlfriend.style,
          nationality: girlfriend.nationality,
        }}
        stage={currentStage}
        score={currentScore}
      />

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {/* Intro video rendered inline in the chat flow */}
        {girlfriend.hello_url && (
          <IntroVideoMessage
            videoUrl={girlfriend.hello_url}
            posterUrl={girlfriend.hello_poster_url || girlfriend.image_url}
            onVideoEnd={() => {}}
            onVideoError={() => console.error('Video failed to load:', girlfriend.hello_url)}
          />
        )}
        
        {messages.map((message) => (
          <React.Fragment key={message.id}>
            {message.imageUrl ? (
              <div className={styles.imageMessage}>
                <img 
                  src={message.imageUrl} 
                  alt="Generated image" 
                  className={styles.scenarioImage}
                />
              </div>
            ) : message.role === 'user' ? (
              <div className={styles.messageBubbleRight}>
                {formatMessageContent(message.content)}
              </div>
            ) : message.id.startsWith('scene_') ? (
              <div className={styles.sceneWithButton}>
                <div className={styles.messageBubbleScenario}>
                  {scenes.length > 1 && (
                    <button 
                      className={styles.shuffleButton}
                      onClick={handleRandomScene}
                      title="Cambiar escena"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                      </svg>
                    </button>
                  )}
                  
                  {currentScene?.scene_name && (
                    <div className={styles.sceneLabel}>{currentScene.scene_name}</div>
                  )}
                  
                  {formatMessageContent(message.content)}
                </div>
                
                {girlfriend.voice_id && (
                  <button 
                    className={`${styles.messagePlayButton} ${playingMessageId === message.id ? styles.playing : ''}`}
                    onClick={() => handlePlayMessageAudio(message.id, message.audioUrl, message.content)}
                    disabled={audioLoadingMessageId === message.id}
                    title={playingMessageId === message.id ? "Pausar" : "Reproducir"}
                  >
                    {audioLoadingMessageId === message.id ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.spinner}>
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="4"/>
                      </svg>
                    ) : playingMessageId === message.id ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.messageWithButton}>
                <div className={styles.messageBubbleLeft}>
                  {formatMessageContent(message.content)}
                </div>
                
                {girlfriend.voice_id && (
                  <button 
                    className={`${styles.messagePlayButton} ${playingMessageId === message.id ? styles.playing : ''}`}
                    onClick={() => handlePlayMessageAudio(message.id, message.audioUrl, message.content)}
                    disabled={audioLoadingMessageId === message.id}
                    title={playingMessageId === message.id ? "Pausar" : "Reproducir"}
                  >
                    {audioLoadingMessageId === message.id ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.spinner}>
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="4"/>
                      </svg>
                    ) : playingMessageId === message.id ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )}
          </React.Fragment>
        ))}

        {isLoading && (
          <div className={styles.messageBubbleLeft}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button 
              onClick={() => setError(null)}
              className={styles.dismissError}
            >
              ×
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Message"
          className={styles.inputField}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button 
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={contentRating === 'nsfw' ? '#e60049' : '#348cd4'} strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}