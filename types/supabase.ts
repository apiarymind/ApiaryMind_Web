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
