// app/components/ChatInterface.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import IntroVideoMessage from './IntroVideoMessage';
import GFSidebar from './GFSidebar';
import styles from './ChatInterface.module.css';
import { useUser } from '@/lib/hooks/useUser';
import { saveChatMessage } from '@/lib/saveChatMessage';

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
}

interface Scenario {
  id: string;
  scene_name: string;
  girlfriend_id: string;
  description: string;
  video_slug: string | null;
  image_slug: string | null;
  audio_slug: string | null;
  mood: string | null;
  opener: string;
  is_premium: boolean;
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
  
  const [showIntroVideo, setShowIntroVideo] = useState(!!girlfriend.hello_url);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Scenario state
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [imageGenerated, setImageGenerated] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Audio playback state - track which message is playing
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioLoadingMessageId, setAudioLoadingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messageAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Fetch scenarios on mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch(`/api/scenarios/${girlfriend.id}`);
        const data = await response.json();
        
        if (data.scenarios && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
          // Select random scenario
          const randomIndex = Math.floor(Math.random() * data.scenarios.length);
          setCurrentScenario(data.scenarios[randomIndex]);
        }
      } catch (err) {
        console.error('Error fetching scenarios:', err);
      } finally {
        setIsLoadingScenarios(false);
      }
    };

    fetchScenarios();
  }, [girlfriend.id]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      messageAudioRefs.current.forEach(audio => audio.pause());
      messageAudioRefs.current.clear();
    };
  }, []);

  // Build opening messages from scenario description + opener only
  const buildOpeningMessages = (): Message[] => {
    const messages: Message[] = [];
    
    if (currentScenario?.description) {
      messages.push({
        id: 'description_' + generateMessageId(),
        role: 'assistant',
        content: currentScenario.description,
        timestamp: new Date()
      });
    }
    
    if (currentScenario?.opener) {
      messages.push({
        id: 'opener_' + generateMessageId(),
        role: 'assistant',
        content: currentScenario.opener,
        timestamp: new Date()
      });
    }
    
    return messages;
  };

  // Show opening message on mount if no video and scenario is loaded
  useEffect(() => {
    if (!girlfriend.hello_url && currentScenario && !isLoadingScenarios && !hasInitialized) {
      const openingMessages = buildOpeningMessages();
      if (openingMessages.length > 0) {
        setMessages(openingMessages);
        setHasInitialized(true);
      }
    }
  }, [currentScenario, isLoadingScenarios, hasInitialized]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input after video ends or on mount if no video
  useEffect(() => {
    if (!showIntroVideo) {
      inputRef.current?.focus();
    }
  }, [showIntroVideo]);

  const handleVideoEnd = () => {
    setShowIntroVideo(false);
    if (!hasInitialized) {
      const openingMessages = buildOpeningMessages();
      if (openingMessages.length > 0) {
        setMessages(openingMessages);
        setHasInitialized(true);
      }
    }
  };

  const handleVideoError = () => {
    console.error('Video failed to load:', girlfriend.hello_url);
    setShowIntroVideo(false);
    if (!hasInitialized) {
      const openingMessages = buildOpeningMessages();
      if (openingMessages.length > 0) {
        setMessages(openingMessages);
        setHasInitialized(true);
      }
    }
  };

  const handleRandomScenario = () => {
    if (scenarios.length <= 1) return;
    
    // Stop any playing audio when switching scenarios
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlayingAudio(false);
    }
    
    // Stop any message audio
    messageAudioRefs.current.forEach(audio => audio.pause());
    messageAudioRefs.current.clear();
    setPlayingMessageId(null);
    
    let newScenario: Scenario;
    do {
      const randomIndex = Math.floor(Math.random() * scenarios.length);
      newScenario = scenarios[randomIndex];
    } while (newScenario.id === currentScenario?.id && scenarios.length > 1);
    
    setCurrentScenario(newScenario);
    setImageGenerated(false);
    
    const newMessages: Message[] = [];
    
    if (newScenario.description) {
      newMessages.push({
        id: 'description_' + generateMessageId(),
        role: 'assistant',
        content: newScenario.description,
        timestamp: new Date()
      });
    }
    
    if (newScenario.opener) {
      newMessages.push({
        id: 'opener_' + generateMessageId(),
        role: 'assistant',
        content: newScenario.opener,
        timestamp: new Date()
      });
    }
    
    setMessages(newMessages);
  };

  const handlePlayAudio = () => {
    if (!currentScenario?.audio_slug) {
      console.error('No audio_slug available for current scenario');
      return;
    }
    
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio(currentScenario.audio_slug);
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlayingAudio(false);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Error playing audio:', e);
        setIsPlayingAudio(false);
        setError('Error al reproducir el audio');
      });
    }
    
    audioRef.current.play()
      .then(() => {
        setIsPlayingAudio(true);
      })
      .catch((error) => {
        console.error('Error playing audio:', error);
        setError('Error al reproducir el audio');
      });
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
      if (currentAudio) {
        currentAudio.pause();
      }
    }

    if (audioUrl) {
      let audio = messageAudioRefs.current.get(messageId);
      if (!audio) {
        audio = new Audio(audioUrl);
        messageAudioRefs.current.set(messageId, audio);

        audio.addEventListener('ended', () => {
          setPlayingMessageId(null);
        });

        audio.addEventListener('error', (e) => {
          console.error('Error playing message audio:', e);
          setPlayingMessageId(null);
        });
      }

      try {
        await audio.play();
        setPlayingMessageId(messageId);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    } else if (messageContent) {
      if (!girlfriend.voice_id) {
        console.warn('No voice_id configured for this girlfriend');
        return;
      }

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
            msg.id === messageId 
              ? { ...msg, audioUrl: data.audioUrl }
              : msg
          ));

          const audio = new Audio(data.audioUrl);
          messageAudioRefs.current.set(messageId, audio);

          audio.addEventListener('ended', () => {
            setPlayingMessageId(null);
          });

          audio.addEventListener('error', (e) => {
            console.error('Error playing message audio:', e);
            setPlayingMessageId(null);
          });

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

  const handleGenerateImage = () => {
    if (!currentScenario?.image_slug) {
      console.error('No image_slug available for current scenario');
      return;
    }

    const imageMessage: Message = {
      id: 'image_' + generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      imageUrl: currentScenario.image_slug
    };

    setMessages(prev => [...prev, imageMessage]);
    setImageGenerated(true);
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

    saveChatMessage({ userId, girlfriendId: girlfriend.id, role: 'user', content: trimmedInput });

    try {
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          girlfriendId: girlfriend.id,
          userId: userId,
          messages: conversationHistory,
          scenarioDescription: currentScenario?.description,
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

      saveChatMessage({ userId, girlfriendId: girlfriend.id, role: 'assistant', content: chatData.message });

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
                msg.id === messageId 
                  ? { ...msg, audioUrl: audioData.audioUrl }
                  : msg
              ));
            }
          })
          .catch(err => {
            console.error('Error generating audio:', err);
          });
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
        }}
      />

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {showIntroVideo && girlfriend.hello_url && (
          <IntroVideoMessage
            videoUrl={girlfriend.hello_url}
            posterUrl={girlfriend.hello_poster_url || girlfriend.image_url}
            onVideoEnd={handleVideoEnd}
            onVideoError={handleVideoError}
          />
        )}
        
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {message.imageUrl ? (
              <div className={styles.imageMessage}>
                <img 
                  src={message.imageUrl} 
                  alt="Generated scenario" 
                  className={styles.scenarioImage}
                />
              </div>
            ) : message.role === 'user' ? (
              <div className={styles.messageBubbleRight}>
                {formatMessageContent(message.content)}
              </div>
            ) : message.id.startsWith('description_') ? (
              <div className={styles.messageBubbleScenario}>
                {scenarios.length > 1 && (
                  <button 
                    className={styles.shuffleButton}
                    onClick={handleRandomScenario}
                    title="Cambiar escenario"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                  </button>
                )}
                
                {currentScenario?.audio_slug && (
                  <button 
                    className={`${styles.playButton} ${isPlayingAudio ? styles.playing : ''}`}
                    onClick={handlePlayAudio}
                    title={isPlayingAudio ? "Pausar audio" : "Reproducir audio"}
                  >
                    {isPlayingAudio ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                )}
                
                {formatMessageContent(message.content)}
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
            
            {message.id.startsWith('description_') && !imageGenerated && currentScenario?.image_slug && (
              <button 
                className={styles.imageGeneratorButton}
                onClick={handleGenerateImage}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Generate Image</span>
              </button>
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
          disabled={isLoading || showIntroVideo}
        />
        <button 
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim() || showIntroVideo}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}