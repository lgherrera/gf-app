// app/create/types.ts

export type Gender = 'female' | 'male' ;

export type Ethnicity =
  | 'latinas'
  | 'europeas'
  | 'asiaticas';

export type AgeRange = '18-19' | '20s' | '30s' | '40s' | '50+';

export type Personality =
  | 'shy'
  | 'flirty'
  | 'intellectual'
  | 'adventurous'
  | 'caring'
  | 'mysterious'
  | 'playful'
  | 'dominant'
  | 'submissive';

export type LooksTag =
  | 'athletic'
  | 'curvy'
  | 'slim'
  | 'petite'
  | 'tall'
  | 'tattooed'
  | 'pierced'
  | 'glasses'
  | 'redhead'
  | 'blonde'
  | 'brunette'
  | 'short-hair'
  | 'long-hair';

export interface CustomGirlfriendConfig {
  gender: Gender | null;
  ethnicity: Ethnicity | null;
  ageRange: AgeRange | null;
  personality: Personality[];
  looks: LooksTag[];
  name: string;
}

export const STEP_LABELS = ['Gender', 'Ethnicity', 'Age', 'Personality', 'Looks', 'Review'] as const;
export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

export const INITIAL_CONFIG: CustomGirlfriendConfig = {
  gender: null,
  ethnicity: null,
  ageRange: null,
  personality: [],
  looks: [],
  name: '',
};