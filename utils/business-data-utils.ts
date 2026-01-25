/**
 * Utility functions for business data processing
 * These are pure functions (not server actions)
 */

/**
 * Filter financial fields from data based on access rights
 * Use this to sanitize data before sending to client
 */
export function sanitizeFinancialData<T extends Record<string, any>>(
  data: T,
  hasFinancialAccess: boolean
): T {
  if (hasFinancialAccess) {
    return data;
  }

  const financialFields = [
    'revenue',
    'totalRevenue',
    'netProfit',
    'profitPerHive',
    'maintenanceCost',
    'feedingCost',
    'treatmentCost',
    'cost',
    'price',
    'amount',
    'expenses',
    'income'
  ];

  const sanitized = { ...data };

  for (const field of financialFields) {
    if (field in sanitized) {
      (sanitized as any)[field] = null;
    }
  }

  return sanitized;
}




