// app/create/components/ReviewStep.tsx
'use client';

import { CustomGirlfriendConfig } from '../types';
import styles from '../create.module.css';

interface ReviewStepProps {
  config: CustomGirlfriendConfig;
  voiceName: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReviewStep({ config, voiceName, onNameChange, onSubmit, isSubmitting }: ReviewStepProps) {
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>¡Casi listo!</h2>
      <p className={styles.stepSubtitle}>Ponle un nombre y revisa tus opciones</p>

      <div className={styles.nameInputWrapper}>
        <input
          type="text"
          className={styles.nameInput}
          placeholder="Escribe un nombre..."
          value={config.name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className={styles.reviewCard}>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Género</span>
          <span className={styles.reviewValue}>{config.gender ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Etnia</span>
          <span className={styles.reviewValue}>{config.ethnicity ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Edad</span>
          <span className={styles.reviewValue}>{config.ageRange ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Personalidad</span>
          <span className={styles.reviewValue}>{config.personality ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Cuerpo</span>
          <span className={styles.reviewValue}>{config.physicalTrait ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Pechos</span>
          <span className={styles.reviewValue}>{config.breastSize?.replace(/-/g, ' ') ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Color de pelo</span>
          <span className={styles.reviewValue}>{config.hairColor?.replace(/-/g, ' ') ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Estilo de pelo</span>
          <span className={styles.reviewValue}>{config.hairStyle?.replace(/-/g, ' ') ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Tenida</span>
          <span className={styles.reviewValue}>{config.outfit?.replace(/-/g, ' ') ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Voz</span>
          <span className={styles.reviewValue}>{voiceName}</span>
        </div>
      </div>

      <button
        className={styles.createButton}
        onClick={onSubmit}
        disabled={isSubmitting || !config.name.trim()}
        type="button"
      >
        {isSubmitting ? 'Creando...' : 'Crear Compañera'}
      </button>
    </div>
  );
}