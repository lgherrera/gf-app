// app/create/components/StepSelector.tsx
'use client';

import styles from '../create.module.css';

interface Option {
  value: string;
  label: string;
  emoji?: string;
  image?: string;
}

interface StepSelectorProps {
  title: string;
  subtitle?: string;
  options: Option[];
  selected: string | string[] | null;
  onSelect: (value: string) => void;
  multiSelect?: boolean;
}

export default function StepSelector({
  title,
  subtitle,
  options,
  selected,
  onSelect,
  multiSelect = false,
}: StepSelectorProps) {
  const isSelected = (value: string): boolean => {
    if (Array.isArray(selected)) return selected.includes(value);
    return selected === value;
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>{title}</h2>
      {subtitle && <p className={styles.stepSubtitle}>{subtitle}</p>}

      <div className={styles.optionsGrid}>
        {options.map((option) => (
          <button
            key={option.value}
            className={`${styles.optionCard} ${isSelected(option.value) ? styles.optionSelected : ''} ${option.image ? styles.optionCardWithImage : ''}`}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.image && (
              <img
                src={option.image}
                alt={option.label}
                className={styles.optionImage}
              />
            )}
            {option.emoji && <span className={styles.optionEmoji}>{option.emoji}</span>}
            <span className={styles.optionLabel}>{option.label}</span>
          </button>
        ))}
      </div>

      {multiSelect && (
        <p className={styles.multiSelectHint}>Select multiple</p>
      )}
    </div>
  );
}