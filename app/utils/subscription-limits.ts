/**
 * Limity subskrypcyjne dla każdego planu
 * (Utility function - nie jest server action)
 */
export interface SubscriptionLimits {
  maxProductionHives: number;
  maxSplits: number;
  splitWindowMonths: number; // Okno czasowe dla odkładów (w miesiącach)
}

/**
 * Mapowanie planów subskrypcyjnych na limity
 * 
 * @param plan - Plan subskrypcyjny użytkownika
 * @returns Limity dla danego planu
 */
export function getSubscriptionLimits(plan: string | null | undefined): SubscriptionLimits {
  const normalizedPlan = (plan || 'FREE').toUpperCase().trim();

  switch (normalizedPlan) {
    case 'FREE':
      return {
        maxProductionHives: 10,
        maxSplits: 2,
        splitWindowMonths: 3,
      };

    case 'PLUS':
      return {
        maxProductionHives: 20,
        maxSplits: 10,
        splitWindowMonths: 6,
      };

    case 'PRO':
    case 'PRO_PLUS':
    case 'BUSINESS':
    case 'SUPER_ADMIN':
      // Praktycznie nielimitowane dla planów premium
      return {
        maxProductionHives: 999999,
        maxSplits: 999999,
        splitWindowMonths: 999999,
      };

    default:
      // Domyślnie traktuj jak FREE (bezpieczniejsze)
      return {
        maxProductionHives: 10,
        maxSplits: 2,
        splitWindowMonths: 3,
      };
  }
}
