// app/create/components/ReviewStep.tsx
'use client';

import { CustomGirlfriendConfig } from '../types';
import styles from '../create.module.css';

interface ReviewStepProps {
  config: CustomGirlfriendConfig;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReviewStep({ config, onNameChange, onSubmit, isSubmitting }: ReviewStepProps) {
  const formatList = (items: string[]) =>
    items.map((i) => i.replace(/-/g, ' ')).join(', ');

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Almost done!</h2>
      <p className={styles.stepSubtitle}>Name your companion and review your choices</p>

      <div className={styles.nameInputWrapper}>
        <input
          type="text"
          className={styles.nameInput}
          placeholder="Enter a name..."
          value={config.name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className={styles.reviewCard}>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Gender</span>
          <span className={styles.reviewValue}>{config.gender ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Ethnicity</span>
          <span className={styles.reviewValue}>{config.ethnicity?.replace(/-/g, ' ') ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Age range</span>
          <span className={styles.reviewValue}>{config.ageRange ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Personality</span>
          <span className={styles.reviewValue}>
            {config.personality.length > 0 ? formatList(config.personality) : '—'}
          </span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Body type</span>
          <span className={styles.reviewValue}>{config.physicalTrait ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Hair color</span>
          <span className={styles.reviewValue}>{config.hairColor?.replace(/-/g, ' ') ?? '—'}</span>
        </div>
        <div className={styles.reviewRow}>
          <span className={styles.reviewLabel}>Hair style</span>
          <span className={styles.reviewValue}>{config.hairStyle?.replace(/-/g, ' ') ?? '—'}</span>
        </div>
      </div>

      <button
        className={styles.createButton}
        onClick={onSubmit}
        disabled={isSubmitting || !config.name.trim()}
        type="button"
      >
        {isSubmitting ? 'Creating...' : 'Create Companion'}
      </button>
    </div>
  );
}