// app/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepSelector from './components/StepSelector';
import ReviewStep from './components/ReviewStep';
import {
  CustomGirlfriendConfig,
  INITIAL_CONFIG,
  STEP_LABELS,
  StepIndex,
} from './types';
import styles from './create.module.css';

/* ── option data ─────────────────────────────────── */

const GENDER_OPTIONS = [
    { value: 'femenino', label: 'Femenino', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/female.jpg' },
    { value: 'anime', label: 'Anime', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/anime.jpg' },
  ];

const ETHNICITY_OPTIONS = [
  { value: 'latinas', label: 'Latinas' },
  { value: 'europeas', label: 'Europeas' },
  { value: 'asiaticas', label: 'Asiáticas' },
];

const AGE_OPTIONS = [
  { value: '18-19', label: '18–19' },
  { value: '20s', label: '20s' },
  { value: '30s', label: '30s' },
  { value: '40s', label: '40s' },
  { value: '50+', label: '50+' },
];

const PERSONALITY_OPTIONS = [
  { value: 'timida', label: 'Tímida', emoji: '🙈' },
  { value: 'coqueta', label: 'Coqueta', emoji: '😏' },
  { value: 'intelectual', label: 'Intelectual', emoji: '🧠' },
  { value: 'rebelde', label: 'Rebelde', emoji: '🌍' },
  { value: 'romantica', label: 'Romántica', emoji: '💗' },
  { value: 'celosa', label: 'Celosa', emoji: '🎮' },
  { value: 'dominante', label: 'Dominante', emoji: '👑' },
  { value: 'sumisa', label: 'Sumisa', emoji: '🦋' },
];

const PHYSICAL_TRAIT_OPTIONS = [
  { value: 'atletica', label: 'Atlética', emoji: '💪' },
  { value: 'curvy', label: 'Curvy', emoji: '🍑' },
  { value: 'delgada', label: 'Delgada', emoji: '🩰' },
];

const HAIR_COLOR_OPTIONS = [
  { value: 'pelirroja', label: 'Pelirroja', emoji: '🔥' },
  { value: 'rubia', label: 'Rubia', emoji: '✨' },
  { value: 'morena', label: 'Morena', emoji: '🤎' },
];

const HAIR_STYLE_OPTIONS = [
  { value: 'pelo-corto', label: 'Pelo Corto', emoji: '✂️' },
  { value: 'pelo-largo', label: 'Pelo Largo', emoji: '💇‍♀️' },
];

/* ── component ───────────────────────────────────── */

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<StepIndex>(0);
  const [config, setConfig] = useState<CustomGirlfriendConfig>(INITIAL_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* helpers */
  const canGoNext = (): boolean => {
    switch (step) {
      case 0: return config.gender !== null;
      case 1: return config.ethnicity !== null;
      case 2: return config.ageRange !== null;
      case 3: return config.personality !== null;
      case 4: return config.physicalTrait !== null;
      case 5: return config.hairColor !== null;
      case 6: return config.hairStyle !== null;
      case 7: return config.name.trim().length > 0;
      default: return false;
    }
  };

  const handleSingleSelect = (key: 'gender' | 'ethnicity' | 'ageRange' | 'personality' | 'physicalTrait' | 'hairColor' | 'hairStyle', value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: POST to /api/create-girlfriend
      console.log('Creating custom girlfriend:', config);
      // router.push(`/gf/${newSlug}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* step content */
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepSelector
            title="Elige Género"
            options={GENDER_OPTIONS}
            selected={config.gender}
            onSelect={(v) => handleSingleSelect('gender', v)}
          />
        );
      case 1:
        return (
          <StepSelector
            title="Elige Etnia"
            options={ETHNICITY_OPTIONS}
            selected={config.ethnicity}
            onSelect={(v) => handleSingleSelect('ethnicity', v)}
          />
        );
      case 2:
        return (
          <StepSelector
            title="Elige Rango de Edad"
            options={AGE_OPTIONS}
            selected={config.ageRange}
            onSelect={(v) => handleSingleSelect('ageRange', v)}
          />
        );
      case 3:
        return (
          <StepSelector
            title="Personalidad"
            subtitle="¿Qué onda te gusta?"
            options={PERSONALITY_OPTIONS}
            selected={config.personality}
            onSelect={(v) => handleSingleSelect('personality', v)}
          />
        );
      case 4:
        return (
          <StepSelector
            title="Tipo de Cuerpo"
            options={PHYSICAL_TRAIT_OPTIONS}
            selected={config.physicalTrait}
            onSelect={(v) => handleSingleSelect('physicalTrait', v)}
          />
        );
      case 5:
        return (
          <StepSelector
            title="Color de Pelo"
            options={HAIR_COLOR_OPTIONS}
            selected={config.hairColor}
            onSelect={(v) => handleSingleSelect('hairColor', v)}
          />
        );
      case 6:
        return (
          <StepSelector
            title="Estilo de Pelo"
            options={HAIR_STYLE_OPTIONS}
            selected={config.hairStyle}
            onSelect={(v) => handleSingleSelect('hairStyle', v)}
          />
        );
      case 7:
        return (
          <ReviewStep
            config={config}
            onNameChange={(name) => setConfig((prev) => ({ ...prev, name }))}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => (step === 0 ? router.back() : setStep((s) => (s - 1) as StepIndex))}
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <span className={styles.headerTitle}>
          {STEP_LABELS[step]}
        </span>

        <span className={styles.stepIndicator}>
          {step + 1}/{STEP_LABELS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div className={styles.content}>
        {renderStep()}
      </div>

      {/* Footer nav (hidden on review step which has its own CTA) */}
      {step < 7 && (
        <div className={styles.footer}>
          <button
            className={styles.nextButton}
            disabled={!canGoNext()}
            onClick={() => setStep((s) => (s + 1) as StepIndex)}
            type="button"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}