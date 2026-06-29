// app/sidebar/feedback/page.tsx
'use client';

import { useState } from 'react';
import GFHeader from '@/app/components/GFHeader';
import GFFooter from '@/app/components/GFFooter';
import styles from './page.module.css';

const appSource = process.env.NEXT_PUBLIC_CONTENT_MODE || 'sfw';

export default function FeedbackPage() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, appSource }),
      });

      if (!res.ok) {
        throw new Error('Failed to send feedback');
      }

      setSubmitted(true);
      setMessage('');
    } catch (err) {
      console.error('Feedback submit error:', err);
      setError('No se pudo enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`${styles.page} ${appSource === 'sfw' ? styles.sfw : ''}`}>
      <GFHeader />

      <main className={styles.main}>
        <h1 className={styles.title}>Sugerencias</h1>
        <p className={styles.subtitle}>
          Tu opinión nos ayuda a mejorar. Cuéntanos qué te gustaría ver en la app.
        </p>

        {submitted ? (
          <div className={styles.successBox}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
            <p>¡Gracias por tu sugerencia!</p>
            <button
              className={styles.submitBtn}
              onClick={() => setSubmitted(false)}
            >
              Enviar otra
            </button>
          </div>
        ) : (
          <div className={styles.feedbackBox}>
            <textarea
              className={styles.textarea}
              placeholder="Escribe tu sugerencia aquí..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              disabled={sending}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!message.trim() || sending}
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        )}
      </main>

      <GFFooter />
    </div>
  );
}