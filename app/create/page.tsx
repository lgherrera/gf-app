// app/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import StepSelector from './components/StepSelector';
import ReviewStep from './components/ReviewStep';
import VoiceStep from './components/VoiceStep';
import {
  CustomGirlfriendConfig,
  INITIAL_CONFIG,
  STEP_LABELS,
  StepIndex,
  VoiceOption,
} from './types';
import styles from './create.module.css';

/* ── option data ─────────────────────────────────── */

const GENDER_OPTIONS = [
  { value: 'female', label: 'Femenino', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/female.jpg' },
  { value: 'anime', label: 'Anime', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/anime.jpg' },
];

const ETHNICITY_OPTIONS = [
  { value: 'latin', label: 'Latinas', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/raza/eth-latin.jpg' },
  { value: 'european', label: 'Europeas', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/raza/eth-european.jpg' },
  { value: 'asian', label: 'Asiáticas', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/raza/eth-asian.jpg' },
];

const AGE_OPTIONS = [
  { value: '18-19', label: '18–19' },
  { value: '20s', label: '20s' },
  { value: '30s', label: '30s' },
  { value: '40s', label: '40s' },
  { value: '50+', label: '50+' },
];

const PERSONALITY_OPTIONS = [
  { value: 'shy', label: 'Tímida' },
  { value: 'flirty', label: 'Coqueta' },
  { value: 'intellectual', label: 'Intelectual' },
  { value: 'rebellious', label: 'Rebelde' },
  { value: 'romantic', label: 'Romántica' },
  { value: 'jealous', label: 'Celosa' },
  { value: 'dominant', label: 'Dominante' },
  { value: 'submissive', label: 'Sumisa' },
];

const PHYSICAL_TRAIT_OPTIONS = [
  { value: 'athletic', label: 'Atlética', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/body-type/athletic.jpg' },
  { value: 'curvy', label: 'Curvy', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/body-type/voluptuous.jpg' },
  { value: 'slim', label: 'Delgada', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/body-type/slim.jpg' },
];

const HAIR_COLOR_OPTIONS = [
  { value: 'redhead', label: 'Pelirroja', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/hair-color/redhead.jpg' },
  { value: 'blonde', label: 'Rubia', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/hair-color/blond.jpg' },
  { value: 'brunette', label: 'Morena', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/hair-color/brunette.jpg' },
  { value: 'pink', label: 'Rosado', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/hair-color/pink.jpg' },
];

const HAIR_STYLE_OPTIONS = [
  { value: 'straight', label: 'Liso', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/hair-style/pelo-liso.jpg' },
  { value: 'short', label: 'Corto', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/hair-style/pelo-corto.jpg' },
  { value: 'curly', label: 'Crespo', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/hair-style/pelo-crespo.jpg' },
  { value: 'wavy', label: 'Ondulado', image: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/hair-style/pelo-ondulado.jpg' },
];

/* ── component ───────────────────────────────────── */

export default function CreatePage() {
  const router = useRouter();
  const userId = useSession();
  const [step, setStep] = useState<StepIndex>(0);
  const [config, setConfig] = useState<CustomGirlfriendConfig>(INITIAL_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);

  /* fetch voices when reaching voice step */
  useEffect(() => {
    if (step === 7 && voices.length === 0) {
      setVoicesLoading(true);
      fetch('/api/voices')
        .then((res) => res.json())
        .then((data) => setVoices(data))
        .catch((err) => console.error('Failed to fetch voices:', err))
        .finally(() => setVoicesLoading(false));
    }
  }, [step, voices.length]);

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
      case 7: return config.voiceId !== null;
      case 8: return config.name.trim().length > 0;
      default: return false;
    }
  };

  const handleSingleSelect = (key: 'gender' | 'ethnicity' | 'ageRange' | 'personality' | 'physicalTrait' | 'hairColor' | 'hairStyle' | 'voiceId', value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/create-girlfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Error creating girlfriend:', data.error);
        return;
      }

      router.push(`/${data.slug}/chat`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* get voice name for review */
  const getVoiceName = (): string => {
    if (!config.voiceId) return '—';
    const voice = voices.find((v) => v.elevenlabs_voice_id === config.voiceId);
    return voice?.name ?? '—';
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
          <VoiceStep
            voices={voices}
            selected={config.voiceId}
            onSelect={(v) => handleSingleSelect('voiceId', v)}
            isLoading={voicesLoading}
          />
        );
      case 8:
        return (
          <ReviewStep
            config={config}
            voiceName={getVoiceName()}
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
      {step < 8 && (
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