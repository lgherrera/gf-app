// app/create/types.ts

export type Gender = 'femenino' | 'anime';

export type Ethnicity =
  | 'latinas'
  | 'europeas'
  | 'asiaticas';

export type AgeRange = '18-19' | '20s' | '30s' | '40s' | '50+';

export type Personality =
  | 'timida'
  | 'coqueta'
  | 'intelectual'
  | 'rebelde'
  | 'romantica'
  | 'celosa'
  | 'dominante'
  | 'sumisa';

export type PhysicalTrait = 'atletica' | 'curvy' | 'delgada';

export type HairColor = 'pelirroja' | 'rubia' | 'morena' | 'rosado';

export type HairStyle = 'pelo-corto' | 'pelo-largo';

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

export const STEP_LABELS = ['Género', 'Etnia', 'Edad', 'Personalidad', 'Cuerpo', 'Color Pelo', 'Estilo Pelo', 'Voz', 'Revisión'] as const;
export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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