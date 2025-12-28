
export const COLONY_STRENGTH_MAP: Record<string, string> = {
  STRONG: 'SILNA',
  MEDIUM: 'ŚREDNIA',
  WEAK: 'SŁABA',
};

export const MOOD_MAP: Record<string, string> = {
  CALM: 'SPOKOJNA',
  AGGRESSIVE: 'AGRESYWNA',
};

export const PESTS_MAP: Record<string, string> = {
  AFB: 'ZGNILEC (AFB)',
  VARROA: 'WARROZA',
  HEALTHY: 'ZDROWA',
};

export const translateColonyStrength = (strength?: string) => {
  if (!strength) return '';
  return COLONY_STRENGTH_MAP[strength] || strength;
};

export const translateMood = (mood?: string) => {
  if (!mood) return '';
  return MOOD_MAP[mood] || mood;
};

export const translatePest = (pest: string) => {
  return PESTS_MAP[pest] || pest;
};
