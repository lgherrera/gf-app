// app/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import WizHeader from '../components/WizHeader';
import GFFooter from '../components/GFFooter';
import StepSelector from './components/StepSelector';
import ReviewStep from './components/ReviewStep';
import VoiceStep from './components/VoiceStep';
import ImageApprovalStep from './components/ImageApprovalStep';
import GeneratingScreen from './components/GeneratingScreen';
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
  { value: 'female', label: 'Femenino', image: 'https://cdn.polola.ai/wizard/female.jpg' },
  { value: 'anime',  label: 'Anime',    image: 'https://cdn.polola.ai/wizard/anime.jpg' },
];

const ETHNICITY_OPTIONS = [
  { value: 'latin',    label: 'Latinas',   image: 'https://cdn.polola.ai/wizard/latin.jpg' },
  { value: 'european', label: 'Europeas',  image: 'https://cdn.polola.ai/wizard/european.jpg' },
  { value: 'asian',    label: 'Asiáticas', image: 'https://cdn.polola.ai/wizard/asian.jpg' },
];

const AGE_OPTIONS = [
  { value: '18-19', label: '18–19' },
  { value: '20s',   label: '20s' },
  { value: '30s',   label: '30s' },
  { value: '40s',   label: '40s' },
  { value: '50+',   label: '50+' },
];

const PERSONALITY_OPTIONS = [
  { value: 'shy',          label: 'Tímida' },
  { value: 'flirty',       label: 'Coqueta' },
  { value: 'intellectual', label: 'Intelectual' },
  { value: 'rebellious',   label: 'Rebelde' },
  { value: 'romantic',     label: 'Romántica' },
  { value: 'jealous',      label: 'Celosa' },
  { value: 'dominant',     label: 'Dominante' },
  { value: 'submissive',   label: 'Sumisa' },
];

const PHYSICAL_TRAIT_OPTIONS = [
  { value: 'athletic', label: 'Atlética', image: 'https://cdn.polola.ai/wizard/athletic.jpg' },
  { value: 'curvy',    label: 'Curvy',    image: 'https://cdn.polola.ai/wizard/voluptuous.jpg' },
  { value: 'slim',     label: 'Delgada',  image: 'https://cdn.polola.ai/wizard/slim.jpg' },
];

const BREAST_SIZE_OPTIONS = [
  { value: 'small',      label: 'Pequeños' },
  { value: 'medium',     label: 'Medianos' },
  { value: 'large',      label: 'Grandes' },
  { value: 'very-large', label: 'Muy Grandes' },
];

const HAIR_COLOR_OPTIONS = [
  { value: 'redhead',  label: 'Pelirroja', image: 'https://cdn.polola.ai/wizard/redhead.jpg' },
  { value: 'blonde',   label: 'Rubia',     image: 'https://cdn.polola.ai/wizard/blonde.jpg' },
  { value: 'brunette', label: 'Morena',    image: 'https://cdn.polola.ai/wizard/brunette.jpg' },
  { value: 'pink',     label: 'Rosado',    image: 'https://cdn.polola.ai/wizard/pink.jpg' },
];

const HAIR_STYLE_OPTIONS = [
  { value: 'straight', label: 'Liso',     image: 'https://cdn.polola.ai/wizard/pelo-liso.jpg' },
  { value: 'short',    label: 'Corto',    image: 'https://cdn.polola.ai/wizard/pelo-corto.jpg' },
  { value: 'curly',    label: 'Crespo',   image: 'https://cdn.polola.ai/wizard/pelo-crespo.jpg' },
  { value: 'wavy',     label: 'Ondulado', image: 'https://cdn.polola.ai/wizard/pelo-ondulado.jpg' },
];

const OUTFIT_OPTIONS_ALL = [
  { value: 'strapless-dress',     label: 'Vestido Strapless', mode: 'sfw' },
  { value: 'bikini',              label: 'Bikini',            mode: 'sfw' },
  { value: 'yoga-outfit',         label: 'Yoga Outfit',       mode: 'sfw' },
  { value: 'deep-cleavage-dress', label: 'Vestido Escotado',  mode: 'sfw' },
  { value: 'lingerie',            label: 'Lingerie',          mode: 'sfw' },
  { value: 'trendy',              label: 'Elegante',          mode: 'sfw' },
  { value: 'casual',              label: 'Casual',            mode: 'sfw' },
  { value: 'nurse',               label: 'Enfermera',         mode: 'nsfw' },
];

const contentMode = process.env.NEXT_PUBLIC_APP_SOURCE === 'nsfw' ? 'nsfw' : 'sfw';
const OUTFIT_OPTIONS = OUTFIT_OPTIONS_ALL.filter((o) => o.mode === contentMode);

/* ── component ───────────────────────────────────── */

export default function CreatePage() {
  const router = useRouter();
  const userId = useSession();
  const [step, setStep] = useState<StepIndex>(0);
  const [config, setConfig] = useState<CustomGirlfriendConfig>(INITIAL_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  /* fetch voices when reaching voice step */
  useEffect(() => {
    if (step === 8 && voices.length === 0) {
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
      case 0:  return config.gender !== null;
      case 1:  return config.ethnicity !== null;
      case 2:  return config.ageRange !== null;
      case 3:  return config.personality !== null; // description is optional
      case 4:  return config.physicalTrait !== null && config.breastSize !== null;
      case 5:  return config.hairColor !== null;
      case 6:  return config.hairStyle !== null;
      case 7:  return config.outfit !== null;
      case 8:  return config.voiceId !== null;
      case 9:  return config.name.trim().length > 0;
      case 10: return generatedImageUrl !== null;
      default: return false;
    }
  };

  const handleSingleSelect = (
    key: 'gender' | 'ethnicity' | 'ageRange' | 'personality' | 'physicalTrait' | 'breastSize' | 'hairColor' | 'hairStyle' | 'outfit' | 'voiceId',
    value: string,
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  /* Phase 1: Generate image preview */
  const handleGenerateImage = async () => {
    setIsSubmitting(true);
    setStep(10);
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setImagePrompt(null);

    try {
      const res = await fetch('/api/generate-custom-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, userId, contentMode }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Error generating image:', data.error);
        return;
      }

      setGeneratedImageUrl(data.imageUrl);
      setImagePrompt(data.imagePrompt || null);
    } catch (err) {
      console.error('Image generation error:', err);
    } finally {
      setIsGeneratingImage(false);
      setIsSubmitting(false);
    }
  };

  /* Phase 2: Approve image and create girlfriend */
  const handleApprove = async () => {
    setIsSubmitting(true);
    setIsGenerating(true);

    await new Promise((r) => requestAnimationFrame(r));

    try {
      const res = await fetch('/api/create-girlfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, userId, imageUrl: generatedImageUrl, imagePrompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Error creating girlfriend:', data.error);
        setIsGenerating(false);
        setIsSubmitting(false);
        return;
      }

      router.push(`/${data.slug}/chat`);
    } catch (err) {
      console.error('Submit error:', err);
      setIsGenerating(false);
      setIsSubmitting(false);
    }
  };

  /* get voice name for review */
  const getVoiceName = (): string => {
    if (!config.voiceId) return '—';
    const voice = voices.find((v) => v.elevenlabs_voice_id === config.voiceId);
    return voice?.name ?? '—';
  };

  if (isGenerating) {
    return <GeneratingScreen name={config.name} />;
  }

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
          <div className={styles.stepContainer}>
            <StepSelector
              title="Personalidad"
              subtitle="¿Qué onda te gusta?"
              options={PERSONALITY_OPTIONS}
              selected={config.personality}
              onSelect={(v) => handleSingleSelect('personality', v)}
            />
            <div className={styles.descriptionField}>
              <label className={styles.descriptionLabel}>
                Descríbela <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                className={styles.descriptionTextarea}
                placeholder="Ej: Le encanta viajar, habla varios idiomas y tiene un humor increíble..."
                value={config.description}
                onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                maxLength={500}
                rows={4}
              />
              <span className={styles.charCount}>{config.description.length}/500</span>
            </div>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContainer}>
            <StepSelector
              title="Tipo de Cuerpo"
              options={PHYSICAL_TRAIT_OPTIONS}
              selected={config.physicalTrait}
              onSelect={(v) => handleSingleSelect('physicalTrait', v)}
            />
            <StepSelector
              title="Tamaño de Pechos"
              options={BREAST_SIZE_OPTIONS}
              selected={config.breastSize}
              onSelect={(v) => handleSingleSelect('breastSize', v)}
            />
          </div>
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
          <StepSelector
            title="Tenida de Ropa"
            options={OUTFIT_OPTIONS}
            selected={config.outfit}
            onSelect={(v) => handleSingleSelect('outfit', v)}
          />
        );
      case 8:
        return (
          <VoiceStep
            voices={voices}
            selected={config.voiceId}
            onSelect={(v) => handleSingleSelect('voiceId', v)}
            isLoading={voicesLoading}
          />
        );
      case 9:
        return (
          <ReviewStep
            config={config}
            voiceName={getVoiceName()}
            onNameChange={(name) => setConfig((prev) => ({ ...prev, name }))}
            onSubmit={handleGenerateImage}
            isSubmitting={isSubmitting}
          />
        );
      case 10:
        return (
          <ImageApprovalStep
            imageUrl={generatedImageUrl}
            isGenerating={isGeneratingImage}
            onApprove={handleApprove}
            onRegenerate={handleGenerateImage}
            isSubmitting={isSubmitting}
          />
        );
    }
  };

  return (
    <div className={styles.page}>
      <WizHeader />

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

      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
        />
      </div>

      <div className={styles.content}>
        {renderStep()}
      </div>

      {step < 9 && (
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

      <GFFooter />
    </div>
  );
}