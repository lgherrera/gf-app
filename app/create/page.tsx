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
  Gender,
  Ethnicity,
  AgeRange,
  Personality,
  LooksTag,
} from './types';
import styles from './create.module.css';

/* ── option data ─────────────────────────────────── */

const GENDER_OPTIONS = [
  { value: 'femenino', label: 'Femenino', emoji: '♀' },
  { value: 'masculino', label: 'Masculino', emoji: '♂' },
];

const ETHNICITY_OPTIONS = [
  { value: 'latinas', label: 'Latinas' },
  { value: 'europeas', label: 'Europeas' },
  { value: 'asiaticas', label: 'Asiáticas' },
];

const AGE_OPTIONS = [
  { value: '18-22', label: '18–22' },
  { value: '23-27', label: '23–27' },
  { value: '28-35', label: '28–35' },
  { value: '36-45', label: '36–45' },
  { value: '46+', label: '46+' },
];

const PERSONALITY_OPTIONS = [
  { value: 'shy', label: 'Shy', emoji: '🙈' },
  { value: 'flirty', label: 'Flirty', emoji: '😏' },
  { value: 'intellectual', label: 'Intellectual', emoji: '🧠' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🌍' },
  { value: 'caring', label: 'Caring', emoji: '💗' },
  { value: 'mysterious', label: 'Mysterious', emoji: '🌙' },
  { value: 'playful', label: 'Playful', emoji: '🎮' },
  { value: 'dominant', label: 'Dominant', emoji: '👑' },
  { value: 'submissive', label: 'Submissive', emoji: '🦋' },
];

const LOOKS_OPTIONS = [
  { value: 'athletic', label: 'Athletic', emoji: '💪' },
  { value: 'curvy', label: 'Curvy', emoji: '🍑' },
  { value: 'slim', label: 'Slim', emoji: '🩰' },
  { value: 'petite', label: 'Petite', emoji: '🌸' },
  { value: 'tall', label: 'Tall', emoji: '🦒' },
  { value: 'tattooed', label: 'Tattooed', emoji: '🖋' },
  { value: 'pierced', label: 'Pierced', emoji: '💎' },
  { value: 'glasses', label: 'Glasses', emoji: '👓' },
  { value: 'redhead', label: 'Redhead', emoji: '🔥' },
  { value: 'blonde', label: 'Blonde', emoji: '✨' },
  { value: 'brunette', label: 'Brunette', emoji: '🤎' },
  { value: 'short-hair', label: 'Short Hair', emoji: '✂️' },
  { value: 'long-hair', label: 'Long Hair', emoji: '💇‍♀️' },
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
      case 3: return config.personality.length > 0;
      case 4: return config.looks.length > 0;
      case 5: return config.name.trim().length > 0;
      default: return false;
    }
  };

  const handleSingleSelect = (key: 'gender' | 'ethnicity' | 'ageRange', value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleMultiSelect = (key: 'personality' | 'looks', value: string) => {
    setConfig((prev) => {
      const current = prev[key] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
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
            title="Choose Gender"
            options={GENDER_OPTIONS}
            selected={config.gender}
            onSelect={(v) => handleSingleSelect('gender', v)}
          />
        );
      case 1:
        return (
          <StepSelector
            title="Choose Ethnicity"
            options={ETHNICITY_OPTIONS}
            selected={config.ethnicity}
            onSelect={(v) => handleSingleSelect('ethnicity', v)}
          />
        );
      case 2:
        return (
          <StepSelector
            title="Choose Age Range"
            options={AGE_OPTIONS}
            selected={config.ageRange}
            onSelect={(v) => handleSingleSelect('ageRange', v)}
          />
        );
      case 3:
        return (
          <StepSelector
            title="Personality Traits"
            subtitle="What kind of vibe?"
            options={PERSONALITY_OPTIONS}
            selected={config.personality}
            onSelect={(v) => handleMultiSelect('personality', v)}
            multiSelect
          />
        );
      case 4:
        return (
          <StepSelector
            title="Physical Traits"
            subtitle="Describe their look"
            options={LOOKS_OPTIONS}
            selected={config.looks}
            onSelect={(v) => handleMultiSelect('looks', v)}
            multiSelect
          />
        );
      case 5:
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
      {step < 5 && (
        <div className={styles.footer}>
          <button
            className={styles.nextButton}
            disabled={!canGoNext()}
            onClick={() => setStep((s) => (s + 1) as StepIndex)}
            type="button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}