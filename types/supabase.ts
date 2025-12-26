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

export interface BreedingBatch {
  id: string;
  batch_number: string;
  start_date: string;
  queen_mother_id?: string;
  breeder_id: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
