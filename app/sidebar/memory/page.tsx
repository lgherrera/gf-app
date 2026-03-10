// app/sidebar/memory/page.tsx

'use client';

import { useState } from 'react';
import styles from './memory.module.css';
import GFHeader from '../../components/GFHeader';
import GFFooter from '../../components/GFFooter';

interface MemoryToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const initialToggles: MemoryToggle[] = [
  {
    id: 'saved-memories',
    label: 'Hacer referencia a las memorias guardadas',
    description: 'Permite que la app guarde y use memorias para responder.',
    enabled: true,
  },
  {
    id: 'chat-history',
    label: 'Hacer referencia al historial de chats',
    description: 'Permite que la app haga referencia a todas las conversaciones previas para responder.',
    enabled: true,
  },
];

const savedMemories = [
  { id: 1, text: 'Le gustan las películas de ciencia ficción.' },
  { id: 2, text: 'Prefiere respuestas cortas y directas.' },
  { id: 3, text: 'Está aprendiendo sobre inteligencia artificial.' },
];

export default function MemoriaPage() {
  const [toggles, setToggles] = useState<MemoryToggle[]>(initialToggles);
  const [showMemories, setShowMemories] = useState(false);

  const handleToggle = (id: string) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  return (
    <div className={styles.page}>
      <GFHeader />

      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => window.history.back()}
          aria-label="Volver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
        <h1 className={styles.title}>Memoria</h1>
        <button
          className={styles.manageButton}
          onClick={() => setShowMemories((v) => !v)}
        >
          Gestionar
        </button>
      </div>

      {/* Toggle rows */}
      <div className={styles.section}>
        {toggles.map((toggle, index) => (
          <div key={toggle.id}>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <span className={styles.rowLabel}>{toggle.label}</span>
                <span className={styles.rowDescription}>{toggle.description}</span>
              </div>
              <button
                role="switch"
                aria-checked={toggle.enabled}
                className={`${styles.toggle} ${toggle.enabled ? styles.toggleOn : ''}`}
                onClick={() => handleToggle(toggle.id)}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
            {index < toggles.length - 1 && <div className={styles.divider} />}
          </div>
        ))}
      </div>

      {/* Saved memories panel (shown when Gestionar is clicked) */}
      {showMemories && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Memorias guardadas</p>
          {savedMemories.length === 0 ? (
            <p className={styles.emptyState}>No hay memorias guardadas todavía.</p>
          ) : (
            savedMemories.map((mem) => (
              <div key={mem.id} className={styles.memoryItem}>
                <span className={styles.memoryText}>{mem.text}</span>
                <button className={styles.deleteButton} aria-label="Eliminar memoria">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <GFFooter />
    </div>
  );
}