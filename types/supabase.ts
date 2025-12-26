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
  performed_by_id: string;
  date: string;
  mood: 'CALM' | 'AGGRESSIVE' | 'NORMAL';
  notes?: string;
  batch_id?: string; // Link to breeding batch
  created_at: string;
  // Joins
  performed_by?: Profile;
}
