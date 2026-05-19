// app/components/chat/components/ChatInput.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from '../ChatInterface.module.css';

const contentRating = process.env.NEXT_PUBLIC_APP_SOURCE || 'sfw';
const accentColor = contentRating === 'nsfw' ? '#e60049' : '#348cd4';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  girlfriendSlug: string;
  // Voice recording
  isRecording: boolean;
  isTranscribing: boolean;
  recordingSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function ChatInput({
  inputValue,
  onInputChange,
  onSend,
  isLoading,
  girlfriendSlug,
  isRecording,
  isTranscribing,
  recordingSeconds,
  onStartRecording,
  onStopRecording,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImageMenuOpen, setIsImageMenuOpen] = React.useState(false);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Refocus after loading completes
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  if (isRecording) {
    return (
      <div className={styles.inputContainer}>
        <div className={styles.recordingBar}>
          <div className={styles.recordingMic}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill={accentColor}>
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
          onClick={onStopRecording}
          aria-label="Detener grabación"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={accentColor}>
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.inputContainer}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          placeholder={isTranscribing ? 'Transcribiendo...' : 'Message'}
          className={styles.inputField}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || isTranscribing}
        />
        <div className={styles.imageMenuWrapper}>
          <button
            className={styles.imageMenuButton}
            onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill={accentColor}>
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {isImageMenuOpen && (
            <>
              <div className={styles.imageMenuBackdrop} onClick={() => setIsImageMenuOpen(false)} />
              <div className={styles.imageDropdownMenu}>
                <Link
                  href={`/render/image?gf=${girlfriendSlug}`}
                  className={styles.menuItem}
                  onClick={() => setIsImageMenuOpen(false)}
                >
                  Generar Imagen
                </Link>
              </div>
            </>
          )}

          {/* Placeholder button */}
          <button
            className={styles.imageMenuButton}
            onClick={() => {/* TODO: implement action */}}
            aria-label="Abrir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke={accentColor} width="28" height="28">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </button>
        </div>
      </div>
      {isTranscribing ? (
        <button className={styles.sendButton} disabled aria-label="Transcribiendo">
          <svg width="20" height="20" viewBox="0 0 24 24" className={styles.spinnerIcon}>
            <circle cx="12" cy="12" r="10" fill="none" stroke={accentColor} strokeWidth="3" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      ) : inputValue.trim() ? (
        <button
          className={styles.sendButton}
          onClick={onSend}
          disabled={isLoading}
          aria-label="Enviar mensaje"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      ) : (
        <button
          className={styles.sendButton}
          onClick={onStartRecording}
          disabled={isLoading}
          aria-label="Grabar mensaje de voz"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill={accentColor}>
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
          </svg>
        </button>
      )}
    </div>
  );
}