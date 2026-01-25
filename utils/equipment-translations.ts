/**
 * Equipment category translations
 * Maps equipment category codes to Polish display names
 */

export const EQUIPMENT_CATEGORY_LABELS: Record<string, string> = {
  'BOTTOM_BOARD': 'Dennica',
  'HIVE_BODY_FULL': 'Korpus',
  'HIVE_BODY_HALF': 'Półkorpus',
  'ROOF': 'Daszek',
  'FRAMES': 'Ramki',
  'CROWN_BOARD': 'Powałka',
  'FEEDER': 'Podkarmiaczka',
  'STAND': 'Stojak',
  'OTHER': 'Inne',
};

/**
 * Translates equipment category code to display name
 * @param category - Equipment category code (e.g., 'BOTTOM_BOARD')
 * @returns Polish display name (e.g., 'Dennica') or original category if not found
 */
export function translateCategory(category: string): string {
  return EQUIPMENT_CATEGORY_LABELS[category] || category;
}
