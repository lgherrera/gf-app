// app/create/components/GeneratingScreen.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from '../create.module.css';

interface GeneratingScreenProps {
  name: string;
}

const MESSAGES = [
  'Creando tu compañera...',
  'Generando imagen...',
  'Aplicando estilo...',
  'Casi lista...',
];

export default function GeneratingScreen({ name }: GeneratingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.generatingScreen}>
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner} />
      </div>
      <h2 className={styles.generatingName}>{name}</h2>
      <p className={styles.generatingMessage}>{MESSAGES[messageIndex]}</p>
    </div>
  );
}