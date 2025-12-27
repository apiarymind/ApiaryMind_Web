export type SubscriptionPlan = 'FREE' | 'PLUS' | 'PRO' | 'PRO_PLUS' | 'BUSINESS';

export type AssociationRole = 'PRESIDENT' | 'VICE_PRESIDENT' | 'TREASURER' | 'SECRETARY' | 'AUDIT_MEMBER' | 'MEMBER';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone_number?: string;
  
  // Company Data
  company_name?: string;
  nip?: string;
  regon?: string;
  address_street?: string;
  zip_code?: string;
  city?: string;
  
  // Veterinary Data
  wni_number?: string;
  rhd_number?: string;
  sb_number?: string;
  arimr_ep_number?: string;
  
  // Subscription
  subscription_plan: SubscriptionPlan;
  eyescoin_balance: number;
  
  created_at: string;
  updated_at: string;
}

export interface BusinessTeam {
  id: string;
  name: string;
  owner_id: string;
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
  association_id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  created_at: string;
}

export interface Inspection {
  id: string;
  hive_id: string;
  inspection_date: string; // timestamp
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

  batch_id?: string;
  created_at?: string;
  // Joins
  performed_by?: Profile;
}

export interface Hive {
  id: string;
  apiary_id: string;
  hive_number: string; // DISPLAY NAME
  type?: string;
  bottom_board_type?: string;
  installation_date?: string;
  status?: string; // Not in schema list but often used in UI, keep optional
}

export interface Apiary {
  id: string;
  name: string;
  type: 'STATIONARY' | 'MIGRATORY';
  location_geo?: string; // point
  location?: string; // UI uses this, maybe map from geo or keep optional
  description?: string;
}
