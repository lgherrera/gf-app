// app/[slug]/chat/ChatScreen.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './chat.module.css';

interface ChatScreenProps {
  name: string;
  slug: string;
}

export default function ChatScreen({ name, slug }: ChatScreenProps) {
  const [message, setMessage] = useState('');

  return (
    <div className={styles.container}>
      
      {/* --- HEADER --- */}
      <header className={styles.header}>
        <Link href="/gf" className={styles.iconButton}>
          {/* Back Arrow Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        
        <h1 className={styles.headerTitle}>{name}</h1>
        
        <button className={styles.iconButton}>
          {/* Hamburger Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* --- CHAT AREA --- */}
      <main className={styles.chatArea}>
        {/* Initial Greeting Bubble */}
        <div className={styles.messageBubbleLeft}>
          Hi! I'm {name}. What's on your mind?
        </div>
      </main>

      {/* --- INPUT AREA --- */}
      <footer className={styles.inputContainer}>
        <input 
          type="text" 
          placeholder="Message" 
          className={styles.inputField}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className={styles.sendButton}>
          {/* Send Arrow Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </footer>
    </div>
  );
}