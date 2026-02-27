// app/create/types.ts

export type Gender = 'female' | 'anime';

export type Ethnicity =
  | 'latin'
  | 'european'
  | 'asian';

export type AgeRange = '18-19' | '20s' | '30s' | '40s' | '50+';

export type Personality =
  | 'shy'
  | 'flirty'
  | 'intellectual'
  | 'rebellious'
  | 'romantic'
  | 'jealous'
  | 'dominant'
  | 'submissive';

export type PhysicalTrait = 'athletic' | 'curvy' | 'slim';

export type HairColor = 'redhead' | 'blonde' | 'brunette' | 'pink';

export type HairStyle = 'straight' | 'short' | 'curly' | 'wavy';

export interface VoiceOption {
  id: number;
  name: string;
  elevenlabs_voice_id: string;
  preview_url: string;
}

export interface CustomGirlfriendConfig {
  gender: Gender | null;
  ethnicity: Ethnicity | null;
  ageRange: AgeRange | null;
  personality: Personality | null;
  physicalTrait: PhysicalTrait | null;
  hairColor: HairColor | null;
  hairStyle: HairStyle | null;
  voiceId: string | null;
  name: string;
}

export const STEP_LABELS = [
  'Género',
  'Etnia',
  'Edad',
  'Personalidad',
  'Cuerpo',
  'Color Pelo',
  'Estilo Pelo',
  'Voz',
  'Revisión',
  'Aprobar Imagen',
] as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const INITIAL_CONFIG: CustomGirlfriendConfig = {
  gender: null,
  ethnicity: null,
  ageRange: null,
  personality: null,
  physicalTrait: null,
  hairColor: null,
  hairStyle: null,
  voiceId: null,
  name: '',
};