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
  // performed_by_id: string; // Not in provided schema facts, assuming optional or handled via Profile relation if exists
  inspection_date: string; // timestamp
  colony_strength?: string;
  notes?: string;
  // mood? Prompt says 'colony_strength' instead of 'mood' in the schema facts.
  // But UI uses 'mood'. I'll keep 'mood' optional if code relies on it, but emphasize schema fields.
  // Actually, prompt says: "Table: inspections... colony_strength (text), notes (text)". No 'mood'.
  // I should probably map 'colony_strength' to UI concept of mood or update UI to show strength.
  // For safety, I will include colony_strength.
  
  batch_id?: string; // Link to breeding batch (from previous context, maybe keep optional)
  created_at?: string; // Timestamp
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
