
import { Queen } from '@/app/actions/get-hive-details';

export function calculateQueenScore(queen: Queen): { score: number; label: string } {
  if (!queen.inspections || queen.inspections.length === 0) {
    return { score: 0, label: 'Brak danych' };
  }

  const inspections = queen.inspections;
  const total = inspections.length;
  let aggressiveCount = 0;

  inspections.forEach(i => {
    // Check if mood is aggressive. Case insensitive just in case, though DB enum is usually upper.
    if (i.mood && i.mood.toUpperCase() === 'AGGRESSIVE') {
      aggressiveCount++;
    }
  });

  // Simple Logic: 5 stars is perfect. Deduct stars based on ratio of aggressive behavior.
  // If 0% aggressive -> 5 stars
  // If >50% aggressive -> 1 star
  // Linear interpolation?

  const aggressiveRatio = aggressiveCount / total;

  let score = 5;
  if (aggressiveRatio > 0.5) score = 1;
  else if (aggressiveRatio > 0.3) score = 2;
  else if (aggressiveRatio > 0.1) score = 3;
  else if (aggressiveRatio > 0) score = 4;
  
  // Label based on score
  let label = 'Łagodna';
  if (score === 5) label = 'Bardzo Łagodna';
  if (score === 4) label = 'Łagodna';
  if (score === 3) label = 'Przeciętna';
  if (score === 2) label = 'Złośliwa';
  if (score === 1) label = 'Agresywna';

  return { score, label };
}

export function renderStars(score: number) {
  // Returns an array of booleans for stars (true = filled, false = empty)
  // or simple number to be used in UI loop
  return score;
}
