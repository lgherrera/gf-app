// app/components/chat/components/ChatHeader.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../ChatInterface.module.css';

const contentRating = process.env.NEXT_PUBLIC_CONTENT_MODE || 'sfw';
const accentColor = contentRating === 'nsfw' ? '#e60049' : '#348cd4';

interface ChatHeaderProps {
  girlfriendName: string;
  avatar?: string;
  onOpenSidebar: () => void;
  onDeleteChat: () => void;
}

export default function ChatHeader({
  girlfriendName,
  avatar,
  onOpenSidebar,
  onDeleteChat,
}: ChatHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link href="/" className={styles.iconButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <button className={styles.iconButton} onClick={() => setIsFavorite(!isFavorite)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? accentColor : 'white'}>
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
        </button>
      </div>

      <div className={styles.headerCenter}>
        {avatar && (
          <img src={avatar} alt={girlfriendName} className={styles.avatar} />
        )}
        <h1 className={styles.headerTitle}>{girlfriendName}</h1>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.menuWrapper}>
          <button
            className={styles.iconButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={accentColor}>
              <path
                fillRule="evenodd"
                d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {isMenuOpen && (
            <>
              <div className={styles.menuBackdrop} onClick={() => setIsMenuOpen(false)} />
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    onDeleteChat();
                    setIsMenuOpen(false);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Eliminar Chat
                </button>
              </div>
            </>
          )}
        </div>

        <button className={styles.iconButton} onClick={onOpenSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}