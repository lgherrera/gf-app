// lib/progress.config.ts

export const PROGRESS_CONFIG = {
  pointsPerMessage: 5,
  pointsPerScene:   5,
  pointsPerStage:   20,
} as const;

export const MAX_STAGE_SFW  = 4;
export const MAX_STAGE_NSFW = 2;

const CONTENT_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE || 'sfw';

export const MAX_STAGE = CONTENT_MODE === 'nsfw' ? MAX_STAGE_NSFW : MAX_STAGE_SFW;