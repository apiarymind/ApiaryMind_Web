-- ============================================
-- COMPREHENSIVE RLS POLICIES FOR ALL TABLES
-- This script creates Row Level Security policies for all tables
-- Users can only access their own data (using owner_id, user_id, etc.)
-- Admins (ADMIN, SUPER_ADMIN) can access everything
-- ============================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_id
    AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1. PROFILES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR is_admin(auth.uid()));

-- ============================================
-- 2. APIARIES
-- ============================================
ALTER TABLE public.apiaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own apiaries" ON public.apiaries;
CREATE POLICY "Users can view own apiaries" 
ON public.apiaries FOR SELECT 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own apiaries" ON public.apiaries;
CREATE POLICY "Users can insert own apiaries" 
ON public.apiaries FOR INSERT 
WITH CHECK (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own apiaries" ON public.apiaries;
CREATE POLICY "Users can update own apiaries" 
ON public.apiaries FOR UPDATE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own apiaries" ON public.apiaries;
CREATE POLICY "Users can delete own apiaries" 
ON public.apiaries FOR DELETE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

-- ============================================
-- 3. APIARY_FORAGE_FLOWS
-- ============================================
ALTER TABLE public.apiary_forage_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view apiary forage flows" ON public.apiary_forage_flows;
CREATE POLICY "Users can view apiary forage flows" 
ON public.apiary_forage_flows FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = apiary_forage_flows.apiary_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can manage apiary forage flows" ON public.apiary_forage_flows;
CREATE POLICY "Users can manage apiary forage flows" 
ON public.apiary_forage_flows FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = apiary_forage_flows.apiary_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- ============================================
-- 4. FORAGE_TYPES (Reference table - public read)
-- ============================================
ALTER TABLE public.forage_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for forage_types" ON public.forage_types;
CREATE POLICY "Public read access for forage_types" 
ON public.forage_types FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin write access for forage_types" ON public.forage_types;
CREATE POLICY "Admin write access for forage_types" 
ON public.forage_types FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 5. HIVES
-- ============================================
ALTER TABLE public.hives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own hives" ON public.hives;
CREATE POLICY "Users can view own hives" 
ON public.hives FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = hives.apiary_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can insert own hives" ON public.hives;
CREATE POLICY "Users can insert own hives" 
ON public.hives FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = hives.apiary_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can update own hives" ON public.hives;
CREATE POLICY "Users can update own hives" 
ON public.hives FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = hives.apiary_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can delete own hives" ON public.hives;
CREATE POLICY "Users can delete own hives" 
ON public.hives FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = hives.apiary_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- ============================================
-- 6. HIVE_TYPES (Reference table - public read)
-- ============================================
ALTER TABLE public.hive_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for hive_types" ON public.hive_types;
CREATE POLICY "Public read access for hive_types" 
ON public.hive_types FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin write access for hive_types" ON public.hive_types;
CREATE POLICY "Admin write access for hive_types" 
ON public.hive_types FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 7. INSPECTIONS
-- ============================================
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own inspections" ON public.inspections;
CREATE POLICY "Users can view own inspections" 
ON public.inspections FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.hives
    JOIN public.apiaries ON apiaries.id = hives.apiary_id
    WHERE hives.id = inspections.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can insert own inspections" ON public.inspections;
CREATE POLICY "Users can insert own inspections" 
ON public.inspections FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.hives
    JOIN public.apiaries ON apiaries.id = hives.apiary_id
    WHERE hives.id = inspections.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can update own inspections" ON public.inspections;
CREATE POLICY "Users can update own inspections" 
ON public.inspections FOR UPDATE 
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.hives
    JOIN public.apiaries ON apiaries.id = hives.apiary_id
    WHERE hives.id = inspections.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can delete own inspections" ON public.inspections;
CREATE POLICY "Users can delete own inspections" 
ON public.inspections FOR DELETE 
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.hives
    JOIN public.apiaries ON apiaries.id = hives.apiary_id
    WHERE hives.id = inspections.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- ============================================
-- 8. HARVEST_LOG
-- ============================================
ALTER TABLE public.harvest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own harvest logs" ON public.harvest_log;
CREATE POLICY "Users can view own harvest logs" 
ON public.harvest_log FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = harvest_log.apiary_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can manage own harvest logs" ON public.harvest_log;
CREATE POLICY "Users can manage own harvest logs" 
ON public.harvest_log FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = harvest_log.apiary_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- ============================================
-- 9. INVENTORY
-- ============================================
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
CREATE POLICY "Users can view own inventory" 
ON public.inventory FOR SELECT 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory;
CREATE POLICY "Users can insert own inventory" 
ON public.inventory FOR INSERT 
WITH CHECK (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
CREATE POLICY "Users can update own inventory" 
ON public.inventory FOR UPDATE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory;
CREATE POLICY "Users can delete own inventory" 
ON public.inventory FOR DELETE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

-- ============================================
-- 10. MEDICATIONS_GLOBAL (Reference table - public read)
-- ============================================
ALTER TABLE public.medications_global ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for medications_global" ON public.medications_global;
CREATE POLICY "Public read access for medications_global" 
ON public.medications_global FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin write access for medications_global" ON public.medications_global;
CREATE POLICY "Admin write access for medications_global" 
ON public.medications_global FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 11. TREATMENTS_LOG
-- ============================================
ALTER TABLE public.treatments_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own treatments" ON public.treatments_log;
CREATE POLICY "Users can view own treatments" 
ON public.treatments_log FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.hives
    JOIN public.apiaries ON apiaries.id = hives.apiary_id
    WHERE hives.id = treatments_log.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can insert own treatments" ON public.treatments_log;
CREATE POLICY "Users can insert own treatments" 
ON public.treatments_log FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.hives
    JOIN public.apiaries ON apiaries.id = hives.apiary_id
    WHERE hives.id = treatments_log.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can update own treatments" ON public.treatments_log;
CREATE POLICY "Users can update own treatments" 
ON public.treatments_log FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.hives
    JOIN public.apiaries ON apiaries.id = hives.apiary_id
    WHERE hives.id = treatments_log.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can delete own treatments" ON public.treatments_log;
CREATE POLICY "Users can delete own treatments" 
ON public.treatments_log FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.hives
    JOIN public.apiaries ON apiaries.id = hives.apiary_id
    WHERE hives.id = treatments_log.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- ============================================
-- 12. BREEDING_MOTHERS
-- ============================================
ALTER TABLE public.breeding_mothers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own breeding mothers" ON public.breeding_mothers;
CREATE POLICY "Users can view own breeding mothers" 
ON public.breeding_mothers FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own breeding mothers" ON public.breeding_mothers;
CREATE POLICY "Users can manage own breeding mothers" 
ON public.breeding_mothers FOR ALL 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ============================================
-- 13. BREEDING_SERIES
-- ============================================
ALTER TABLE public.breeding_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own breeding series" ON public.breeding_series;
CREATE POLICY "Users can view own breeding series" 
ON public.breeding_series FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own breeding series" ON public.breeding_series;
CREATE POLICY "Users can manage own breeding series" 
ON public.breeding_series FOR ALL 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ============================================
-- 14. BREEDING_BATCHES
-- ============================================
ALTER TABLE public.breeding_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own breeding batches" ON public.breeding_batches;
CREATE POLICY "Users can view own breeding batches" 
ON public.breeding_batches FOR SELECT 
USING (auth.uid() = breeder_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own breeding batches" ON public.breeding_batches;
CREATE POLICY "Users can manage own breeding batches" 
ON public.breeding_batches FOR ALL 
USING (auth.uid() = breeder_id OR is_admin(auth.uid()));

-- ============================================
-- 15. BREEDING_TASKS
-- ============================================
ALTER TABLE public.breeding_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own breeding tasks" ON public.breeding_tasks;
CREATE POLICY "Users can view own breeding tasks" 
ON public.breeding_tasks FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own breeding tasks" ON public.breeding_tasks;
CREATE POLICY "Users can manage own breeding tasks" 
ON public.breeding_tasks FOR ALL 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ============================================
-- 16. BREEDING_MANIFESTS
-- ============================================
ALTER TABLE public.breeding_manifests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own breeding manifests" ON public.breeding_manifests;
CREATE POLICY "Users can view own breeding manifests" 
ON public.breeding_manifests FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own breeding manifests" ON public.breeding_manifests;
CREATE POLICY "Users can manage own breeding manifests" 
ON public.breeding_manifests FOR ALL 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ============================================
-- 17. MATING_NUCS
-- ============================================
ALTER TABLE public.mating_nucs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mating nucs" ON public.mating_nucs;
CREATE POLICY "Users can view own mating nucs" 
ON public.mating_nucs FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own mating nucs" ON public.mating_nucs;
CREATE POLICY "Users can manage own mating nucs" 
ON public.mating_nucs FOR ALL 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ============================================
-- 18. QUEENS
-- ============================================
ALTER TABLE public.queens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own queens" ON public.queens;
CREATE POLICY "Users can view own queens" 
ON public.queens FOR SELECT 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own queens" ON public.queens;
CREATE POLICY "Users can manage own queens" 
ON public.queens FOR ALL 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

-- ============================================
-- 19. QUEEN_BANK
-- ============================================
ALTER TABLE public.queen_bank ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own queen bank" ON public.queen_bank;
CREATE POLICY "Users can view own queen bank" 
ON public.queen_bank FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own queen bank" ON public.queen_bank;
CREATE POLICY "Users can manage own queen bank" 
ON public.queen_bank FOR ALL 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ============================================
-- 20. PRODUCTS
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products" 
ON public.products FOR SELECT 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
CREATE POLICY "Users can manage own products" 
ON public.products FOR ALL 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

-- ============================================
-- 21. SALES_LOG
-- ============================================
ALTER TABLE public.sales_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sales log" ON public.sales_log;
CREATE POLICY "Users can view own sales log" 
ON public.sales_log FOR SELECT 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sales log" ON public.sales_log;
CREATE POLICY "Users can insert own sales log" 
ON public.sales_log FOR INSERT 
WITH CHECK (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own sales log" ON public.sales_log;
CREATE POLICY "Users can update own sales log" 
ON public.sales_log FOR UPDATE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own sales log" ON public.sales_log;
CREATE POLICY "Users can delete own sales log" 
ON public.sales_log FOR DELETE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

-- ============================================
-- 22. BETA_SIGNUPS (Public read for display, Admin write)
-- ============================================
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert beta signups" ON public.beta_signups;
CREATE POLICY "Public can insert beta signups" 
ON public.beta_signups FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view beta signups" ON public.beta_signups;
CREATE POLICY "Admin can view beta signups" 
ON public.beta_signups FOR SELECT 
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage beta signups" ON public.beta_signups;
CREATE POLICY "Admin can manage beta signups" 
ON public.beta_signups FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 23. SURVEYS
-- ============================================
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active surveys" ON public.surveys;
CREATE POLICY "Public can view active surveys" 
ON public.surveys FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage surveys" ON public.surveys;
CREATE POLICY "Admin can manage surveys" 
ON public.surveys FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 24. SURVEY_QUESTIONS
-- ============================================
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view survey questions" ON public.survey_questions;
CREATE POLICY "Public can view survey questions" 
ON public.survey_questions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.surveys
    WHERE surveys.id = survey_questions.survey_id
    AND (surveys.is_active = true OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admin can manage survey questions" ON public.survey_questions;
CREATE POLICY "Admin can manage survey questions" 
ON public.survey_questions FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 25. SURVEY_RESPONSES
-- ============================================
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert survey responses" ON public.survey_responses;
CREATE POLICY "Users can insert survey responses" 
ON public.survey_responses FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

DROP POLICY IF EXISTS "Users can view own survey responses" ON public.survey_responses;
CREATE POLICY "Users can view own survey responses" 
ON public.survey_responses FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can view all survey responses" ON public.survey_responses;
CREATE POLICY "Admin can view all survey responses" 
ON public.survey_responses FOR SELECT 
USING (is_admin(auth.uid()));

-- ============================================
-- 26. SURVEY_TARGETS
-- ============================================
ALTER TABLE public.survey_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view survey targets" ON public.survey_targets;
CREATE POLICY "Public can view survey targets" 
ON public.survey_targets FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin can manage survey targets" ON public.survey_targets;
CREATE POLICY "Admin can manage survey targets" 
ON public.survey_targets FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 27. ASSOCIATIONS
-- ============================================
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view associations" ON public.associations;
CREATE POLICY "Public can view associations" 
ON public.associations FOR SELECT 
USING (is_blocked = false OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage associations" ON public.associations;
CREATE POLICY "Admin can manage associations" 
ON public.associations FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 28. ASSOCIATION_MEMBERS
-- ============================================
ALTER TABLE public.association_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view association members" ON public.association_members;
CREATE POLICY "Users can view association members" 
ON public.association_members FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.associations
    WHERE associations.id = association_members.association_id
    AND (associations.is_blocked = false OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can manage own association membership" ON public.association_members;
CREATE POLICY "Users can manage own association membership" 
ON public.association_members FOR ALL 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.associations
    WHERE associations.id = association_members.association_id
    AND association_members.role IN ('PRESIDENT', 'VICE_PRESIDENT')
  )
  OR is_admin(auth.uid())
);

-- ============================================
-- 29. ASSOCIATION_FINANCES
-- ============================================
ALTER TABLE public.association_finances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view association finances" ON public.association_finances;
CREATE POLICY "Users can view association finances" 
ON public.association_finances FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.association_members
    WHERE association_members.association_id = association_finances.association_id
    AND association_members.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Treasurer can manage association finances" ON public.association_finances;
CREATE POLICY "Treasurer can manage association finances" 
ON public.association_finances FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.association_members
    WHERE association_members.association_id = association_finances.association_id
    AND association_members.user_id = auth.uid()
    AND association_members.role IN ('PRESIDENT', 'TREASURER')
  )
  OR is_admin(auth.uid())
);

-- ============================================
-- 30. BUSINESS_TEAMS
-- ============================================
ALTER TABLE public.business_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business teams" ON public.business_teams;
CREATE POLICY "Users can view own business teams" 
ON public.business_teams FOR SELECT 
USING (
  auth.uid() = employer_id 
  OR auth.uid() = employee_id
  OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Employers can manage business teams" ON public.business_teams;
CREATE POLICY "Employers can manage business teams" 
ON public.business_teams FOR ALL 
USING (auth.uid() = employer_id OR is_admin(auth.uid()));

-- ============================================
-- 31. TEAM_INVITATIONS
-- ============================================
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own team invitations" ON public.team_invitations;
CREATE POLICY "Users can view own team invitations" 
ON public.team_invitations FOR SELECT 
USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() = employer_id
  OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Employers can manage team invitations" ON public.team_invitations;
CREATE POLICY "Employers can manage team invitations" 
ON public.team_invitations FOR ALL 
USING (auth.uid() = employer_id OR is_admin(auth.uid()));

-- ============================================
-- 32. APIARY_TASKS
-- ============================================
ALTER TABLE public.apiary_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view apiary tasks" ON public.apiary_tasks;
-- FIXED: apiary_tasks doesn't have apiary_id - join via hives table
CREATE POLICY "Users can view apiary tasks" 
ON public.apiary_tasks FOR SELECT 
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 
    FROM public.hives
    INNER JOIN public.apiaries ON hives.apiary_id = apiaries.id
    WHERE hives.id = apiary_tasks.hive_id
    AND (apiaries.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can manage apiary tasks" ON public.apiary_tasks;
CREATE POLICY "Users can manage apiary tasks" 
ON public.apiary_tasks FOR ALL 
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 
    FROM public.hives
    INNER JOIN public.apiaries ON hives.apiary_id = apiaries.id
    WHERE hives.id = apiary_tasks.hive_id
    AND apiaries.owner_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- ============================================
-- 33. WORK_LOGS
-- ============================================
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own work logs" ON public.work_logs;
CREATE POLICY "Users can view own work logs" 
ON public.work_logs FOR SELECT 
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = work_logs.apiary_id
    AND apiaries.owner_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can manage own work logs" ON public.work_logs;
CREATE POLICY "Users can manage own work logs" 
ON public.work_logs FOR ALL 
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = work_logs.apiary_id
    AND apiaries.owner_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- ============================================
-- 34. FINANCIAL_RECORDS
-- ============================================
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own financial records" ON public.financial_records;
CREATE POLICY "Users can view own financial records" 
ON public.financial_records FOR SELECT 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own financial records" ON public.financial_records;
CREATE POLICY "Users can manage own financial records" 
ON public.financial_records FOR ALL 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

-- ============================================
-- 35. BREEDER_LINEAGE_SCORES
-- ============================================
ALTER TABLE public.breeder_lineage_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view breeder lineage scores" ON public.breeder_lineage_scores;
CREATE POLICY "Public can view breeder lineage scores" 
ON public.breeder_lineage_scores FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Breeders can manage own lineage scores" ON public.breeder_lineage_scores;
CREATE POLICY "Breeders can manage own lineage scores" 
ON public.breeder_lineage_scores FOR ALL 
USING (auth.uid() = breeder_id OR is_admin(auth.uid()));

-- ============================================
-- 36. USER_NOTIFICATIONS
-- ============================================
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
CREATE POLICY "Users can view own notifications" 
ON public.user_notifications FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
CREATE POLICY "Users can update own notifications" 
ON public.user_notifications FOR UPDATE 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;
CREATE POLICY "System can insert notifications" 
ON public.user_notifications FOR INSERT 
WITH CHECK (true); -- System/service role can insert

-- ============================================
-- 37. SYSTEM_SOCIAL_MEDIA
-- ============================================
ALTER TABLE public.system_social_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view system social media" ON public.system_social_media;
CREATE POLICY "Public can view system social media" 
ON public.system_social_media FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage system social media" ON public.system_social_media;
CREATE POLICY "Admin can manage system social media" 
ON public.system_social_media FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 38. APP_SETTINGS
-- ============================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read app settings" ON public.app_settings;
CREATE POLICY "Public can read app settings" 
ON public.app_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin can manage app settings" ON public.app_settings;
CREATE POLICY "Admin can manage app settings" 
ON public.app_settings FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 39. DYNAMIC_PAGES
-- ============================================
ALTER TABLE public.dynamic_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published dynamic pages" ON public.dynamic_pages;
CREATE POLICY "Public can view published dynamic pages" 
ON public.dynamic_pages FOR SELECT 
USING (is_published = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage dynamic pages" ON public.dynamic_pages;
CREATE POLICY "Admin can manage dynamic pages" 
ON public.dynamic_pages FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 40. SYSTEM_MESSAGES
-- ============================================
ALTER TABLE public.system_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active system messages" ON public.system_messages;
CREATE POLICY "Public can view active system messages" 
ON public.system_messages FOR SELECT 
USING (
  (expires_at IS NULL OR expires_at > NOW())
  OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admin can manage system messages" ON public.system_messages;
CREATE POLICY "Admin can manage system messages" 
ON public.system_messages FOR ALL 
USING (is_admin(auth.uid()));

-- ============================================
-- 41. ASSOCIATION_ANNOUNCEMENTS
-- ============================================
ALTER TABLE public.association_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view association announcements" ON public.association_announcements;
CREATE POLICY "Members can view association announcements" 
ON public.association_announcements FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.association_members
    WHERE association_members.association_id = association_announcements.association_id
    AND association_members.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Officers can manage association announcements" ON public.association_announcements;
CREATE POLICY "Officers can manage association announcements" 
ON public.association_announcements FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.association_members
    WHERE association_members.association_id = association_announcements.association_id
    AND association_members.user_id = auth.uid()
    AND association_members.role IN ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY')
  )
  OR auth.uid() = author_id
  OR is_admin(auth.uid())
);

-- ============================================
-- 42. VIEW_VERIFIED_BREEDERS (View - no RLS needed, inherits from profiles)
-- ============================================
-- Views inherit RLS from underlying tables, but we can add explicit policies if needed

-- ============================================
-- NOTES:
-- 1. All policies check for admin access using the is_admin() helper function
-- 2. Users can only access their own data based on owner_id, user_id, etc.
-- 3. Reference tables (forage_types, hive_types, medications_global) allow public read
-- 4. Association-related tables have special logic for members/officers
-- 5. Public data (surveys, beta_signups) allows appropriate public access
-- ============================================
