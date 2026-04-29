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

export type BreastSize = 'small' | 'medium' | 'large' | 'very-large';

export type HairColor = 'redhead' | 'blonde' | 'brunette' | 'pink';

export type HairStyle = 'straight' | 'short' | 'curly' | 'wavy';

export type Outfit =
  | 'strapless-dress'
  | 'bikini'
  | 'yoga-outfit'
  | 'deep-cleavage-dress'
  | 'underwear'
  | 'lingerie'
  | 'trendy'
  | 'casual outfit'
  | 'sexy and revealing nurse uniform'
  | 'sexy and revealing secretary outfit and glasses';

export interface VoiceOption {
  id: number;
  name: string;
  elevenlabs_voice_id: string;
  preview_url: string;
}

export interface CustomGirlfriendConfig {
  gender:        string | null;
  ethnicity:     string | null;
  ageRange:      string | null;
  personality:   string | null;
  description:   string;
  physicalTrait: string | null;
  breastSize:    string | null;
  hairColor:     string | null;
  hairStyle:     string | null;
  outfit:        string | null;
  voiceId:       string | null;
  name:          string;
}

export const STEP_LABELS = [
  'Género',
  'Etnia',
  'Edad',
  'Personalidad',
  'Cuerpo',
  'Color Pelo',
  'Estilo Pelo',
  'Tenida',
  'Voz',
  'Revisión',
  'Aprobar Imagen',
] as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const INITIAL_CONFIG: CustomGirlfriendConfig = {
  gender:        null,
  ethnicity:     null,
  ageRange:      null,
  personality:   null,
  description:   '',
  physicalTrait: null,
  breastSize:    null,
  hairColor:     null,
  hairStyle:     null,
  outfit:        null,
  voiceId:       null,
  name:          '',
};