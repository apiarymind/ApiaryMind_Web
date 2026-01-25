// ============================================
// ENUMS - Database Type Definitions
// ============================================

export type AppRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';

export type SubscriptionPlan = 'FREE' | 'PLUS' | 'PRO' | 'PRO_PLUS' | 'BUSINESS';

export type BusinessRoleType = 'OWNER' | 'EMPLOYEE';

export type AssociationRoleType = 'PRESIDENT' | 'VICE_PRESIDENT' | 'TREASURER' | 'SECRETARY' | 'AUDIT_MEMBER' | 'MEMBER' | 'HONORARY_MEMBER';

export type ColonyStrengthType = 'WEAK' | 'MEDIUM' | 'STRONG';

export type MoodType = 'CALM' | 'AGGRESSIVE';

export type WeatherConditionType = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'WINDY' | 'VARIABLE';

export type LayingPatternType = 'SOLID' | 'SPOTTY';

export type QueenStatusType = 'ACTIVE' | 'SOLD' | 'DECEASED' | 'ARCHIVED';

export type InventoryUnitType = 'szt' | 'kg' | 'l' | 'op';

export type SocialPlatformKey = 'facebook' | 'youtube' | 'tiktok';

export type ConstructionType = 'VERTICAL' | 'HORIZONTAL' | 'TOP_BAR';

export type SourceType = 'NUCS' | 'BANK' | 'MIXED';

export type MessagePriorityType = 'INFO' | 'WARNING' | 'CRITICAL';

export type BreedingTaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';

// Legacy type aliases for backward compatibility
export type AssociationRole = AssociationRoleType;

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone_number?: string;
  role?: string; // Legacy field - e.g. 'super_admin', 'admin', 'beekeeper'
  system_role?: AppRole | string; // USER-DEFINED type from database (app_role)
  
  // Company Data
  company_name?: string;
  nip?: string;
  description?: string;
  city?: string;
  street_address?: string;
  postal_code?: string;
  voivodeship?: string;
  delivery_info?: string;
  
  // Links
  website_url?: string;
  facebook_link?: string;
  allegro_link?: string;
  olx_link?: string;
  
  // Veterinary Data
  wni_number?: string;
  default_vet_authority?: string;
  health_cert_number?: string;
  health_cert_date?: string;
  sanitary_exam_expires_at?: string; // Date format: YYYY-MM-DD
  is_public_profile_enabled?: boolean;
  public_profile_config?: {
    show_address?: boolean;
    show_company?: boolean;
  };
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

export interface BreedingBatchLegacy {
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
  notes?: string;
  mother_ref_number?: string | null;  // Numer/Nazwa Matki-Założycielki (Matka Matki)
  father_line?: string | null;        // Linia Ojca (Trutni)
  breeder_wni?: string | null;        // Numer Weterynaryjny (WNI)
  certificate_number?: string | null; // Numer Świadectwa Pochodzenia
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
  type?: string; // References hive_types.name
  bottom_board_type?: string;
  installation_date?: string | null;
  current_queen_id?: string | null;
  status?: string; // Not in schema list but often used in UI, keep optional
  created_at?: string;
  updated_at?: string;
  // Joins
  apiary?: Apiary;
  current_queen?: Queen;
}

export interface Apiary {
  id: string;
  owner_id: string;
  name: string;
  type?: string; // 'STATIONARY' | 'MIGRATORY' or text
  location_geo?: string; // point/geography
  location?: string; // UI uses this, maybe map from geo or keep optional
  description?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MedicationsGlobal {
  id: string;
  name: string;
  active_substance?: string | null;
  withdrawal_days: number;
  removal_days?: number | null; // Days after which strips must be removed
  description?: string | null;
  dosage?: string | null;
  composition?: string | null;
  contraindications?: string | null;
  side_effects?: string | null;
  created_at: string;
}

export interface TreatmentsLog {
  id: string;
  hive_id: string | null;
  medication_name: string;
  application_date: string;
  withdrawal_end_date: string;
  removal_date?: string | null; // Date when strips should be removed
  is_removed?: boolean | null; // Whether strips have been removed
  notes?: string | null; // Optional notes field
  batch_number?: string | null;
  quantity_used?: string | null; // text type in database
  administration_method?: string | null; // NOT "method" - actual column name
  administered_by?: string | null;
  // Join
  hive?: Hive;
}

// --- NEW TYPES FOR DASHBOARD V2 ---

export interface ForageType {
  id: string;
  name: string;
  description?: string;
  typical_start_month: number; // 1-12
  typical_end_month: number; // 1-12
  nectar_potential?: number; // 0-3
  pollen_potential?: number; // 0-3
  image_url?: string; // URL do zdjęcia rośliny
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
  owner_id?: string;
  hive_id?: string | null;
  marking_code?: string | null;
  year?: number | null;
  breeder_name?: string | null;
  lineage?: string | null;
  status?: QueenStatusType | string | null;
  is_clipped?: boolean | null;
  breeding_series_id?: string | null; // References breeding_series
  batch_id?: string | null;
  original_breeder_id?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joins
  breeding_series?: BreedingSeries;
  hive?: Hive;
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
  author_id?: string | null;
}

// ============================================
// ADDITIONAL TABLE TYPES
// ============================================

export interface HarvestLog {
  id: string;
  apiary_id: string;
  hive_id?: string | null; // NEW: Individual hive tracking
  user_id?: string | null; // NEW: User who recorded harvest
  harvest_date: string;
  honey_type?: string | null;
  total_kg?: number | null;
  batch_code?: string | null;
  notes?: string | null; // NEW: Harvest notes
  frames_harvested?: number | null; // NEW: Number of frames
  honey_moisture_percent?: number | null; // NEW: Moisture percentage
  status?: string | null; // NEW: Processing status (EXTRACTED, SETTLED, etc.)
  source_type?: string | null; // NEW: Harvest type (FULL_HARVEST, PARTIAL_HARVEST, etc.)
  created_at: string;
  updated_at?: string | null; // NEW: Last update timestamp
  // Joins
  apiary?: Apiary;
  hive?: Hive;
  profile?: Profile;
}

export interface Inventory {
  id: string;
  owner_id: string;
  item_name: string;
  category?: string | null;
  quantity: number;
  unit_price?: number | null;
  unit?: InventoryUnitType | string | null;
  batch_number?: string | null;
  expiry_date?: string | null; // DATE
  active_substance?: string | null;
  administration_method?: string | null;
  dosage?: string | null;
  removal_days?: number | null;
  withdrawal_days?: number | null;
  is_medication?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  owner_id: string;
  name: string;
  type?: string | null; // NEW: Product type (HONEY, PROPOLIS, POLLEN, WAX, etc.)
  unit?: string | null; // NEW: Unit of measure (szt, kg, l, ml)
  price?: number | null;
  stock?: number | null;
  batch_code?: string | null;
  volume_ml?: number | null; // NEW: Volume in milliliters (jar size)
  weight_g?: number | null; // NEW: Weight in grams
  expiry_date?: string | null; // NEW: Expiration date
  production_date?: string | null; // NEW: Production/packaging date
  source_harvest_id?: string | null; // NEW: Link to harvest_log
  created_at?: string;
  updated_at?: string;
  // Joins
  harvest?: HarvestLog;
}

export interface HoneyProcessing {
  id: string;
  harvest_id: string;
  process_type: 'UNCAPPING' | 'EXTRACTION' | 'SETTLING' | 'FILTERING' | 'JARRING' | 'LABELING';
  process_date: string;
  performed_by?: string | null;
  equipment_used?: string | null;
  notes?: string | null;
  created_at: string;
  // Joins
  harvest?: HarvestLog;
  performer?: Profile;
}

export interface SalesLog {
  id: string;
  product_id?: string | null;
  quantity_sold?: number | null;
  sale_date: string;
  revenue?: number | null;
  owner_id: string;
  created_at?: string;
  // Joins
  product?: Product;
}

export interface BetaSignup {
  id: string;
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_model?: string | null;
  hive_count?: number | null;
  voivodeship?: string | null;
  is_breeder?: boolean | null;
  has_employees?: boolean | null;
  status?: string | null;
  is_active_tester?: boolean | null;
}

export interface Survey {
  id: number; // INTEGER
  title: string;
  description?: string | null;
  is_active?: boolean | null;
  is_built_in?: boolean | null;
  created_by?: string | null;
  created_at: string;
  display_type?: string | null;
  link?: string | null; // Nullable for built-in surveys
}

export interface SurveyQuestion {
  id: string;
  survey_id: number; // INTEGER
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text' | 'rating' | 'yes_no';
  options?: any; // JSONB
  required?: boolean | null;
  order_index: number;
  created_at: string;
  // Joins
  survey?: Survey;
}

export interface SurveyResponse {
  id: string;
  survey_id: number; // INTEGER
  question_id: string;
  user_id?: string | null; // Nullable for anonymous responses
  response_text?: string | null;
  response_json?: any; // JSONB
  submitted_at: string;
  session_id?: string | null; // For anonymous tracking
  // Joins
  survey?: Survey;
  question?: SurveyQuestion;
  user?: Profile;
}

export interface SurveyTarget {
  id: string;
  survey_id: number; // INTEGER
  target_type: 'dashboard' | 'association' | 'landing' | 'all';
  association_id?: string | null; // Null if target_type != 'association'
  created_at: string;
  // Joins
  survey?: Survey;
  association?: Association;
}

export interface AssociationMember {
  id: string;
  association_id: string;
  user_id: string;
  role: AssociationRoleType | string;
  joined_at?: string | null;
  notes?: string | null;
  created_at?: string;
  // Joins
  association?: Association;
  user?: Profile;
}

export interface TeamInvitation {
  id: string;
  token: string;
  email: string;
  employer_id: string;
  role?: BusinessRoleType | string | null;
  expires_at?: string | null;
  created_at: string;
  // Joins
  employer?: Profile;
}

export interface ApiaryTask {
  id: string;
  apiary_id: string;
  assignee_id?: string | null;
  creator_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null; // DATE
  priority?: string | null;
  status?: string | null;
  is_recurring?: boolean | null;
  recurring_interval?: string | null;
  related_hive_id?: string | null;
  created_at: string;
  updated_at?: string;
  // Joins
  apiary?: Apiary;
  assignee?: Profile;
  creator?: Profile;
  related_hive?: Hive;
}

export interface WorkLog {
  id: string;
  user_id: string;
  task_id?: string | null;
  apiary_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
  verified_by?: string | null;
  created_at?: string;
  // Joins
  user?: Profile;
  task?: ApiaryTask;
  apiary?: Apiary;
  verifier?: Profile;
}

export interface FinancialRecord {
  id: string;
  owner_id: string;
  transaction_type: 'INCOME' | 'EXPENSE' | string;
  amount: number;
  currency?: string | null;
  category?: string | null;
  description?: string | null;
  transaction_date: string; // DATE
  attachment_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BreederLineageScore {
  id: string;
  breeder_id: string;
  lineage_name: string;
  score_gentleness?: number | null;
  score_honey_yield?: number | null;
  score_wintering?: number | null;
  score_swarming?: number | null;
  total_ai_score?: number | null;
  calculation_date?: string | null; // DATE
  sample_size_hives?: number | null;
  created_at?: string;
  // Joins
  breeder?: Profile;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: string; // e.g., 'withdrawal_reminder', 'task_due', etc.
  title: string;
  message: string;
  is_read: boolean;
  reference_link?: string | null;
  created_at: string;
  // Joins
  user?: Profile;
}

export interface SystemSocialMedia {
  id: string;
  platform_key: SocialPlatformKey | string;
  display_name: string;
  target_url: string;
  is_active: boolean;
  sort_order?: number | null;
  updated_at: string;
  created_at?: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  type: 'string' | 'boolean' | 'number';
  created_at: string;
  updated_at: string;
}

export interface DynamicPage {
  id: string;
  slug: string;
  title: string;
  content_html: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}

export interface HiveType {
  id: string;
  name: string;
  translation_key: string;
  primary_countries?: string[] | null; // TEXT[]
  is_global?: boolean | null;
  construction_type: ConstructionType | string;
  frame_width_mm?: number | null;
  frame_height_mm?: number | null;
  frame_type?: string | null;
  description?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface SystemMessage {
  id: string;
  title: string;
  content: string;
  priority: MessagePriorityType;
  created_at: string;
  expires_at?: string | null;
}

export interface BreedingBatch {
  id: string;
  breeder_id: string;
  batch_code?: string | null;
  lineage?: string | null;
  start_date: string; // DATE
  expected_hatching_date?: string | null; // DATE
  larvae_count?: number | null;
  accepted_count?: number | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joins
  breeder?: Profile;
}

export interface ViewVerifiedBreeder {
  breeder_id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  city?: string | null;
  voivodeship?: string | null;
  description?: string | null;
  delivery_info?: string | null;
  website_url?: string | null;
  facebook_link?: string | null;
  allegro_link?: string | null;
  olx_link?: string | null;
  nip?: string | null;
  rhd_number?: string | null;
  kchz_number?: string | null;
}
