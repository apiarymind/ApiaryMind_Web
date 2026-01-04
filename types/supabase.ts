export type SubscriptionPlan = 'FREE' | 'PLUS' | 'PRO' | 'PRO_PLUS' | 'BUSINESS';

export type AssociationRole = 'PRESIDENT' | 'VICE_PRESIDENT' | 'TREASURER' | 'AUDIT_COMMITTEE' | 'MEMBER';

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone_number?: string;
  role?: string; // e.g. 'super_admin', 'admin', 'beekeeper'
  system_role?: string; // USER-DEFINED type from database
  
  // Company Data
  company_name?: string;
  nip?: string;
  description?: string;
  city?: string;
  voivodeship?: string;
  delivery_info?: string;
  
  // Links
  website_url?: string;
  facebook_link?: string;
  allegro_link?: string;
  olx_link?: string;
  
  // Veterinary Data
  wni_number?: string;
  rhd_number?: string;
  shp_number?: string;
  kchz_number?: string;
  arimr_ep_number?: string;
  
  // Subscription
  subscription_plan: SubscriptionPlan;
  eyes_coin_balance?: number; // Fixed: schema has eyes_coin_balance not eyescoin_balance
  is_beta_tester?: boolean;
  beta_access_expires_at?: string;
  isRhdActive?: boolean; // Derived or stored
  plan?: string; // derived
  
  created_at: string;
  updated_at: string;
}

export interface BusinessTeam {
  id: string;
  employer_id?: string; // Fixed: schema has employer_id not owner_id
  employee_id?: string; // Fixed: schema has employee_id
  role?: string; // USER-DEFINED type
  created_at: string;
}

export interface BusinessTeamMember {
  id: string;
  team_id: string;
  user_id: string; // Foreign key to profiles
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE';
  status: 'ACTIVE' | 'PENDING' | 'INVITED';
  created_at: string;
  // Joins
  profile?: Profile;
}

export interface BreedingBatch {
  id: string;
  batch_number: string;
  lineage: string; // Linia genetyczna
  start_date: string;
  estimated_hatching_date?: string; // Can be derived or stored
  queen_mother_id?: string;
  breeder_id: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'SEALED' | 'HATCHED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

// ============================================
// BREEDING MODULE TYPES
// ============================================

export interface BreedingMother {
  id: string;
  user_id: string;
  name: string;
  breed?: string;
  line?: string;
  insemination_method?: string;
  year?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BreedingSeries {
  id: string;
  user_id: string; // Changed from breeder_id
  name?: string; // Changed from series_number
  mother_id?: string; // Changed from mother_queen_id - references breeding_mothers
  start_date: string;
  larvae_count: number;
  accepted_count: number;
  hatched_count: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'; // Changed status values
  created_at: string;
  // Computed fields
  acceptance_efficiency?: number; // (accepted_count / larvae_count) * 100
  hatching_efficiency?: number; // (hatched_count / accepted_count) * 100
  // Joins
  breeding_mother?: BreedingMother; // Changed from mother_queen
}

export interface MatingNuc {
  id: string;
  user_id: string; // Changed from breeder_id
  identifier: string; // Changed from custom_id
  status: 'EMPTY' | 'VIRGIN' | 'READY' | 'LAYING'; // Added LAYING
  current_series_id?: string; // Changed from current_queen_series_id
  queen_year_color?: string;
  updated_at: string;
  // Joins
  series?: BreedingSeries;
}

export interface QueenBank {
  id: string;
  user_id: string; // Changed from breeder_id
  series_id?: string;
  quantity: number; // Changed from count
  status: 'READY';
  // Joins
  series?: BreedingSeries;
}

export interface BreedingTask {
  id: string;
  series_id: string;
  user_id: string; // Changed from breeder_id
  task_name: string; // Changed from task_type
  planned_date: string; // Changed from scheduled_date
  completed_at?: string;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  notes?: string;
  created_at: string;
  // Joins
  series?: BreedingSeries;
}

export interface BreedingManifest {
  id: string;
  user_id: string;
  series_id?: string;
  quantity: number;
  destination_type?: string;
  generated_at: string;
  qr_code_payload?: string;
  manifest_pdf_url?: string;
  passports_pdf_url?: string;
  notes?: string;
  // Joins
  series?: BreedingSeries;
}

export interface ProductionHistory {
  id: string;
  breeder_id: string;
  exit_date: string;
  quantity: number;
  source_type: 'NUCS' | 'BANK' | 'MIXED';
  series_id?: string;
  genetics_info?: Record<string, any>;
  manifest_pdf_url?: string;
  passports_pdf_url?: string;
  notes?: string;
  created_at: string;
  // Joins
  series?: BreedingSeries;
}

export interface ProductionExitItem {
  id: string;
  production_history_id: string;
  source_type: 'NUC' | 'BANK';
  source_id?: string;
  quantity: number;
  created_at: string;
}

export interface Association {
  id: string;
  name: string;
  region: string;
  president_id?: string;
  created_at: string;
}

export interface AssociationFinance {
  id: string;
  association_id?: string;
  title: string; // Fixed: schema has title not just description
  amount: number;
  transaction_date?: string; // Fixed: schema has transaction_date not date
  type?: string; // Fixed: schema shows type as text, not enum
  description?: string;
  created_by?: string;
  created_at?: string;
}

export interface Inspection {
  id: string;
  hive_id?: string;
  queen_id?: string; // Added: schema shows queen_id column
  user_id?: string; // Foreign key to profiles
  inspection_date?: string; // timestamp
  notes?: string;
  
  // Expanded fields based on Schema Map
  weather_condition?: string;
  temperature?: number;
  colony_strength?: string;
  mood?: string;
  brood_frames_count?: number;
  swarming_mood?: boolean;
  swarming_date?: string;
  is_queen_seen?: boolean;
  is_queen_marked?: boolean;
  laying_pattern?: string;
  honey_supers_count?: number;
  half_supers_count?: number;
  frames_sealed_percent?: number;
  pests_detected?: string[]; // array of strings
  treatment_applied?: string;
  next_visit_tasks?: string[]; // array of strings
  
  created_at?: string;
  // Joins
  performed_by?: Profile;
  hive?: Hive;
}

export interface Hive {
  id: string;
  apiary_id: string;
  hive_number: string; // DISPLAY NAME
  type?: string;
  bottom_board_type?: string;
  installation_date?: string;
  status?: string; // Not in schema list but often used in UI, keep optional
  // Joins
  apiary?: Apiary;
}

export interface Apiary {
  id: string;
  name: string;
  type: 'STATIONARY' | 'MIGRATORY';
  location_geo?: string; // point
  location?: string; // UI uses this, maybe map from geo or keep optional
  description?: string;
}

export interface TreatmentsLog {
  id: string;
  hive_id: string;
  medication_name: string;
  application_date: string;
  withdrawal_end_date?: string;
  created_at: string;
  // Join
  hive?: Hive;
}

// --- NEW TYPES FOR DASHBOARD V2 ---

export interface ForageType {
  id: string;
  name: string;
  typical_start_month: number; // 1-12
  typical_end_month: number; // 1-12
  color_code?: string;
}

export interface ApiaryForageFlow {
  id: string;
  apiary_id: string;
  forage_type_id: string;
  intensity: 'WEAK' | 'MODERATE' | 'STRONG';
  is_active: boolean;
  start_date: string;
  end_date?: string;
  // Join
  forage_type?: ForageType;
  apiary?: Apiary;
}

export interface Queen {
  id: string;
  marking_code?: string | null;
  year?: number;
  breeder_name?: string | null;
  lineage?: string | null;
  status?: string | null;
  is_clipped?: boolean;
  breeding_series_id?: string; // References breeding_series
  // Joins
  breeding_series?: BreedingSeries;
}

export interface SystemMessage {
  id: string;
  title: string;
  content: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  created_at: string;
  expires_at?: string;
}

export interface AssociationAnnouncement {
  id: string;
  association_id: string;
  title: string;
  content: string;
  created_at: string;
  author_id?: string;
}
