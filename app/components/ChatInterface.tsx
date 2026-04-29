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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  
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

  // Helper to inject girlfriend name into opening lines
  const personalizeLine = (line: string) => line.replace('[name]', girlfriend.name);

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
      content: personalizeLine(currentScene.opening_line),
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
      content: personalizeLine(newScene.opening_line),
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
          scenarioDescription: currentScene?.opening_line ? personalizeLine(currentScene.opening_line) : undefined,
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

        <div className={styles.headerRight}>
          <div className={styles.menuWrapper}>
            <button 
              className={styles.iconButton}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={contentRating === 'nsfw' ? '#e60049' : '#348cd4'}>
                <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
              </svg>
            </button>
            {isMenuOpen && (
              <>
                <div className={styles.menuBackdrop} onClick={() => setIsMenuOpen(false)} />
                <div className={styles.dropdownMenu}>
                  <button className={styles.menuItem} onClick={() => setIsMenuOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                    </svg>
                    Favorita
                  </button>
                  <button className={styles.menuItem} onClick={() => setIsMenuOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 5.25c1.213 0 2.415.046 3.605.135a3.256 3.256 0 0 1 3.01 3.01c.044.583.077 1.17.1 1.759L17.03 8.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-1.752 1.751c-.023-.65-.06-1.296-.108-1.939a4.756 4.756 0 0 0-4.392-4.392 49.422 49.422 0 0 0-7.436 0A4.756 4.756 0 0 0 3.89 8.282c-.017.224-.033.447-.046.672a.75.75 0 1 0 1.497.092c.013-.217.028-.434.044-.651a3.256 3.256 0 0 1 3.01-3.01c1.19-.09 2.392-.135 3.605-.135Zm-6.97 6.22a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.752-1.751c.023.65.06 1.296.108 1.939a4.756 4.756 0 0 0 4.392 4.392 49.413 49.413 0 0 0 7.436 0 4.756 4.756 0 0 0 4.392-4.392c.017-.223.032-.447.046-.672a.75.75 0 0 0-1.497-.092c-.013.217-.028.434-.044.651a3.256 3.256 0 0 1-3.01 3.01 47.953 47.953 0 0 1-7.21 0 3.256 3.256 0 0 1-3.01-3.01 47.759 47.759 0 0 1-.1-1.759L6.97 15.53a.75.75 0 0 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
                    </svg>
                    Reiniciar Chat
                  </button>
                  <button className={styles.menuItem} onClick={() => setIsMenuOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                    </svg>
                    Eliminar Chat
                  </button>
                </div>
              </>
            )}
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
        </div>
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
          avatar: girlfriend.avatar,
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
                  {scenes.length > 1 && messages.filter(m => m.role === 'user').length === 0 && (
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
        <div className={styles.inputWrapper}>
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
          <div className={styles.imageMenuWrapper}>
            <button
              className={styles.imageMenuButton}
              onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill={contentRating === 'nsfw' ? '#e60049' : '#348cd4'}>
                <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
              </svg>
            </button>
            {isImageMenuOpen && (
              <>
                <div className={styles.imageMenuBackdrop} onClick={() => setIsImageMenuOpen(false)} />
                <div className={styles.imageDropdownMenu}>
                  <Link 
                    href={`/render/image?gf=${girlfriend.slug}`}
                    className={styles.menuItem}
                    onClick={() => setIsImageMenuOpen(false)}
                  >
                    Generar Imagen
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
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