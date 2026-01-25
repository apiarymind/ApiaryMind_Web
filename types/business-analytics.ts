// ============================================
// BUSINESS DASHBOARD & LINE COMPARISON TYPES
// ============================================

/**
 * Analytics Filter - Global filter for all analytics views
 */
export interface AnalyticsFilter {
  apiaryIds: string[];          // Selected apiary IDs (empty = all)
  lineIds: string[];            // Selected queen line IDs (lineage names)
  dateRange: {
    startDate: string;          // ISO date string
    endDate: string;            // ISO date string
  };
  taskTypes: TaskType[];        // Filter by task/inspection types
}

export type TaskType = 
  | 'INSPECTION'                // Standard inspection
  | 'FEEDING'                   // Feeding task
  | 'TREATMENT'                 // Treatment/medication
  | 'HARVEST'                   // Honey harvest
  | 'QUEEN_CHECK'               // Queen-specific check
  | 'MAINTENANCE';              // Hive maintenance

/**
 * Line Statistics - Aggregated data for a queen line
 */
export interface LineStatistics {
  lineId: string;               // Unique line identifier (lineage name)
  lineName: string;             // Display name
  hiveCount: number;            // Number of hives with queens of this line
  
  // Honey Production
  totalHoneyKg: number;         // Total honey harvested (kg)
  avgHoneyPerHive: number;      // Average honey per hive (kg)
  
  // Costs
  maintenanceCost: number;      // Total maintenance cost (PLN)
  feedingCost: number;          // Feeding costs
  treatmentCost: number;        // Treatment/medication costs
  
  // Labor Index
  laborIndex: number;           // Number of inspections/tasks performed
  avgInspectionsPerHive: number;// Average inspections per hive
  
  // Net Profit (OWNER ONLY)
  totalRevenue: number;         // Total revenue from sales
  netProfit: number;            // Revenue - Costs
  profitPerHive: number;        // Net profit per hive
  
  // Quality Indicators
  avgColonyStrength: number;    // Average colony strength (1-3 scale)
  lossCount: number;            // Number of colony losses
  lossRate: number;             // Loss percentage
}

/**
 * Line Comparison Result - For side-by-side comparison
 */
export interface LineComparisonResult {
  lines: LineStatistics[];
  period: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

/**
 * Dashboard Tile Types
 */
export type DashboardTileType = 
  | 'HONEY_YIELD'               // Tile_HoneyYield: Total honey harvest
  | 'EXPENSES'                  // Tile_Expenses: All expenses breakdown
  | 'LOSSES'                    // Tile_Losses: Colony losses statistics
  | 'STAFF_TIME'                // Tile_StaffTime: Staff work hours (PRO_PLUS/BUSINESS only)
  | 'REVENUE'                   // Revenue tile (OWNER only)
  | 'NET_PROFIT'                // Net profit tile (OWNER only)
  | 'INSPECTIONS_COUNT'         // Total inspections count
  | 'TREATMENTS_COUNT'          // Treatments applied count
  | 'COLONY_STRENGTH';          // Average colony strength

/**
 * Dashboard Tile Configuration
 */
export interface DashboardTile {
  id: string;
  type: DashboardTileType;
  title: string;
  order: number;                // Position in grid
  size: 'small' | 'medium' | 'large';
  isVisible: boolean;
  isFinancial: boolean;         // True if contains financial data (OWNER only)
  requiresPlan?: ('PRO_PLUS' | 'BUSINESS')[];  // Required subscription plans
}

/**
 * Dashboard Configuration - User's tile layout
 */
export interface DashboardConfig {
  userId: string;
  tiles: DashboardTile[];
  lastUpdated: string;
}

/**
 * Tile Data - Actual data for a tile
 */
export interface TileData {
  tileType: DashboardTileType;
  value: number;
  unit: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    comparedTo: string;         // e.g., "previous month"
  };
  breakdown?: {
    label: string;
    value: number;
  }[];
}

/**
 * Honey Yield Data
 */
export interface HoneyYieldData {
  totalKg: number;
  byApiary: {
    apiaryId: string;
    apiaryName: string;
    totalKg: number;
  }[];
  byHoneyType: {
    honeyType: string;
    totalKg: number;
  }[];
  byMonth: {
    month: string;
    totalKg: number;
  }[];
}

/**
 * Expenses Data
 */
export interface ExpensesData {
  total: number;
  byCategory: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  }[];
  byMonth: {
    month: string;
    amount: number;
  }[];
}

export type ExpenseCategory = 
  | 'FEEDING'                   // Sugar, syrup, patties
  | 'TREATMENT'                 // Medications, treatments
  | 'EQUIPMENT'                 // Hive equipment, tools
  | 'FUEL'                      // Transportation fuel
  | 'PACKAGING'                 // Jars, labels, packaging
  | 'OTHER';                    // Other expenses

/**
 * Losses Data
 */
export interface LossesData {
  totalLosses: number;          // Number of lost colonies
  lossRate: number;             // Percentage
  byReason: {
    reason: LossReason;
    count: number;
  }[];
  byMonth: {
    month: string;
    count: number;
  }[];
  byApiary: {
    apiaryId: string;
    apiaryName: string;
    count: number;
    rate: number;
  }[];
}

export type LossReason = 
  | 'DISEASE'                   // Disease/pest
  | 'STARVATION'                // Starvation
  | 'QUEENLESS'                 // Lost queen
  | 'WEAK_COLONY'               // Weak colony didn't survive
  | 'WEATHER'                   // Weather-related
  | 'UNKNOWN';                  // Unknown reason

/**
 * Staff Time Data (PRO_PLUS/BUSINESS only)
 */
export interface StaffTimeData {
  totalMinutes: number;
  totalHours: number;
  byEmployee: {
    employeeId: string;
    employeeName: string;
    totalMinutes: number;
    taskCount: number;
  }[];
  byTaskType: {
    taskType: string;
    totalMinutes: number;
  }[];
  byMonth: {
    month: string;
    totalMinutes: number;
  }[];
}

/**
 * Export Options
 */
export interface ExportOptions {
  format: 'CSV' | 'PDF';
  includeFinancials: boolean;   // Only for OWNER
  sections: ExportSection[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filename?: string;
}

export type ExportSection = 
  | 'SUMMARY'                   // Overview summary
  | 'HONEY_YIELD'               // Honey production details
  | 'EXPENSES'                  // Expense breakdown
  | 'LINE_COMPARISON'           // Line comparison data
  | 'LOSSES'                    // Loss statistics
  | 'STAFF_TIME';               // Staff work hours

/**
 * Apiary Option for filter dropdown
 */
export interface ApiaryOption {
  id: string;
  name: string;
  hiveCount: number;
}

/**
 * Line Option for filter dropdown
 */
export interface LineOption {
  lineage: string;              // Lineage name as identifier
  displayName: string;          // Display name
  hiveCount: number;            // Number of hives with this lineage
  queenCount: number;           // Number of queens with this lineage
}

/**
 * Financial Access Check Result
 */
export interface FinancialAccessResult {
  allowed: boolean;
  reason?: string;
  isOwner: boolean;
}




