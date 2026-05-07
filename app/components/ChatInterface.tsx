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

// Module-level flag — survives React re-renders and stale closures
let _pendingInputType: 'text' | 'voice' = 'text';

interface Girlfriend {
  id: string;
  slug: string;
  name: string;
  age: number;
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
  personality_traits?: string[] | null;
  hobbies?: string[] | null;
  likes?: string[] | null;
  fears?: string[] | null;
  boundaries?: string[] | null;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Session DB id (chat_sessions.id uuid)
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);

  // Opening scene state
  const [scenes, setScenes] = useState<OpeningScene[]>([]);
  const [currentScene, setCurrentScene] = useState<OpeningScene | null>(null);
  const [isLoadingScenes, setIsLoadingScenes] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // History loading state
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);

  // Progress state
  const [currentStage, setCurrentStage] = useState(1);
  const [currentScore, setCurrentScore] = useState(0);
  const [isFirstMessageInScene, setIsFirstMessageInScene] = useState(false);

  // Audio playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioLoadingMessageId, setAudioLoadingMessageId] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Load chat history on mount
  useEffect(() => {
    if (!userId) {
      setIsLoadingHistory(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/chat-history?userId=${userId}&girlfriendId=${girlfriend.id}&limit=30`);
        const data = await res.json();

        if (data.messages && data.messages.length > 0) {
          const historyMessages: Message[] = data.messages.map((msg: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(historyMessages);
          setHasHistory(true);
          setHasInitialized(true); // Skip opening scene if we have history
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [userId, girlfriend.id]);

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

  // Show opening message once scene is loaded — only if NO history was loaded
  useEffect(() => {
    if (currentScene && !isLoadingScenes && !isLoadingHistory && !hasInitialized) {
      const openingMessages = buildOpeningMessages();
      if (openingMessages.length > 0) {
        setMessages(openingMessages);
        setHasInitialized(true);
        setIsFirstMessageInScene(true);
      }
    }
  }, [currentScene, isLoadingScenes, isLoadingHistory, hasInitialized]);

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

    // Mark that we're back to a fresh scene (no history)
    setHasHistory(false);
  };

  const handleDeleteChat = async () => {
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
        // Stop any playing audio
        messageAudioRefs.current.forEach(audio => audio.pause());
        messageAudioRefs.current.clear();
        setPlayingMessageId(null);

        // Reset to opening scene
        setHasHistory(false);
        setIsFirstMessageInScene(true);

        if (currentScene) {
          setMessages([{
            id: 'scene_' + generateMessageId(),
            role: 'assistant',
            content: personalizeLine(currentScene.opening_line),
            timestamp: new Date()
          }]);
        } else {
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setIsMenuOpen(false);
    }
  };

  // ── Voice recording handlers ──

  const getSupportedMimeType = () => {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    if (MediaRecorder.isTypeSupported('audio/aac')) return 'audio/aac';
    if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return 'audio/ogg;codecs=opus';
    return '';
  };

  const mimeToFormat = (mime: string): string => {
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('aac')) return 'aac';
    if (mime.includes('ogg')) return 'ogg';
    return 'webm';
  };

  const startRecording = async () => {
    try {
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        setError('Tu navegador no soporta grabación de audio');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioFormat = mimeToFormat(mimeType);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks to release the mic
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Skip if too short (less than ~0.5s)
        if (audioBlob.size < 5000) {
          setIsRecording(false);
          return;
        }

        await transcribeAudio(audioBlob, audioFormat);
      };

      mediaRecorder.start(250); // collect data every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      // Tick the recording timer every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Auto-stop after 30 seconds
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    // Clear the 30s auto-stop timer
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    // Clear the seconds counter interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob, audioFormat: string) => {
    setIsTranscribing(true);
    try {
      const buffer = await audioBlob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, format: audioFormat }),
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      if (data.text) {
        const trimmedText = data.text.trim();
        if (trimmedText) {
          // Flag this as a voice message (module-level, closure-safe)
          _pendingInputType = 'voice';
          console.log('🎤 Voice transcribed, _pendingInputType set to:', _pendingInputType);
          // Send the voice message directly
          handleSendMessage(trimmedText);
        }
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Error al transcribir el audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  // ── Audio playback handlers ──

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

  const handleSendMessage = async (overrideText?: string) => {
    const trimmedInput = (overrideText ?? inputValue).trim();
    if (!trimmedInput || isLoading || !userId) {
      console.log('⛔ handleSendMessage early return — trimmedInput:', !!trimmedInput, '| isLoading:', isLoading, '| userId:', !!userId);
      return;
    }

    // Read and reset the module-level input type flag
    const inputType = _pendingInputType;
    _pendingInputType = 'text';
    console.log('📤 handleSendMessage called — inputType:', inputType, '| overrideText:', !!overrideText);

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
      // Build conversation history for the LLM
      // Send only the last 20 messages as context to keep token costs manageable
      const recentMessages = [...messages, userMessage].slice(-20);
      const conversationHistory = recentMessages.map(msg => ({
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
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.iconButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <button className={styles.iconButton} onClick={() => setIsFavorite(!isFavorite)}>
            {isFavorite ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill={contentRating === 'nsfw' ? '#e60049' : '#348cd4'}>
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
            )}
          </button>
        </div>

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
                  <button className={styles.menuItem} onClick={() => { setShowDeleteConfirm(true); setIsMenuOpen(false); }}>
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

        {/* History divider — shown when loaded messages come from DB */}
        {hasHistory && messages.length > 0 && (
          <div className={styles.historyDivider}>
            <span>Mensajes anteriores</span>
          </div>
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
        {isRecording ? (
          // ── Recording bar: pulsing mic + timer + stop button ──
          <>
            <div className={styles.recordingBar}>
              <div className={styles.recordingMic}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill={contentRating === 'nsfw' ? '#e60049' : '#348cd4'}>
                  <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                  <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
              </div>
              <span className={styles.recordingTimer}>
                {`0:${recordingSeconds.toString().padStart(2, '0')}`}
              </span>
              <div className={styles.recordingWave}>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
            <button
              className={styles.sendButton}
              onClick={stopRecording}
              aria-label="Detener grabación"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={contentRating === 'nsfw' ? '#e60049' : '#348cd4'}>
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          </>
        ) : (
          // ── Normal input: text field + image menu + send/mic button ──
          <>
            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                placeholder={isTranscribing ? 'Transcribiendo...' : 'Message'}
                className={styles.inputField}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isTranscribing}
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

            {/* Conditional button: Transcribing / Send / Mic */}
            {isTranscribing ? (
              <button
                className={styles.sendButton}
                disabled
                aria-label="Transcribiendo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className={styles.spinnerIcon}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke={contentRating === 'nsfw' ? '#e60049' : '#348cd4'} strokeWidth="3" opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke={contentRating === 'nsfw' ? '#e60049' : '#348cd4'} strokeWidth="3" strokeLinecap="round" />
                </svg>
              </button>
            ) : inputValue.trim() ? (
              <button 
                className={styles.sendButton}
                onClick={() => handleSendMessage()}
                disabled={isLoading}
                aria-label="Enviar mensaje"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={contentRating === 'nsfw' ? '#e60049' : '#348cd4'} strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            ) : (
              <button
                className={styles.sendButton}
                onClick={startRecording}
                disabled={isLoading}
                aria-label="Grabar mensaje de voz"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill={contentRating === 'nsfw' ? '#e60049' : '#348cd4'}>
                  <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                  <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className={styles.modalBackdrop} onClick={() => setShowDeleteConfirm(false)} />
          <div className={styles.modal}>
            <p className={styles.modalText}>
              ¿Eliminar todos los mensajes con {girlfriend.name}?
            </p>
            <p className={styles.modalSubtext}>
              Tu nivel de relación se mantendrá.
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className={styles.modalConfirm}
                onClick={handleDeleteChat}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}