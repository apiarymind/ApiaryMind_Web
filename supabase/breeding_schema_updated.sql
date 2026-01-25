-- ============================================
-- BREEDING MODULE SCHEMA (UPDATED TO MATCH USER STRUCTURE)
-- Panel Hodowcy - Schema dla Serii Matecznych, Ulików Weselnych i Banku Matek
-- ============================================

-- ============================================
-- 1. BREEDING SERIES (Serie Hodowlane)
-- ============================================
CREATE TABLE IF NOT EXISTS breeding_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50),
  mother_queen_id UUID, -- Tutaj łączymy z matką reprodukcyjną
  start_date DATE NOT NULL,
  larvae_count INT DEFAULT 0,
  accepted_count INT DEFAULT 0,
  hatched_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_breeding_series_user ON breeding_series(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_series_start_date ON breeding_series(start_date);
CREATE INDEX IF NOT EXISTS idx_breeding_series_status ON breeding_series(status);

-- ============================================
-- 2. MATING NUCS (Uliki Weselne)
-- ============================================
CREATE TABLE IF NOT EXISTS mating_nucs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier VARCHAR(20),
  status VARCHAR(20) DEFAULT 'EMPTY', -- EMPTY, VIRGIN, READY, LAYING
  current_series_id UUID REFERENCES breeding_series(id) ON DELETE SET NULL,
  queen_year_color VARCHAR(20),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT mating_nucs_status_check CHECK (status IN ('EMPTY', 'VIRGIN', 'READY', 'LAYING'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mating_nucs_user ON mating_nucs(user_id);
CREATE INDEX IF NOT EXISTS idx_mating_nucs_status ON mating_nucs(status);
CREATE INDEX IF NOT EXISTS idx_mating_nucs_series ON mating_nucs(current_series_id);

-- ============================================
-- 3. QUEEN BANK (Bank Matek)
-- ============================================
CREATE TABLE IF NOT EXISTS queen_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID REFERENCES breeding_series(id) ON DELETE SET NULL,
  quantity INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'READY'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_queen_bank_user ON queen_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_queen_bank_series ON queen_bank(series_id);

-- ============================================
-- 4. BREEDING TASKS (Zadania Hodowlane)
-- ============================================
CREATE TABLE IF NOT EXISTS breeding_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID REFERENCES breeding_series(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name VARCHAR(100) NOT NULL,
  planned_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, SKIPPED
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT breeding_tasks_status_check CHECK (status IN ('PENDING', 'COMPLETED', 'SKIPPED'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_series ON breeding_tasks(series_id);
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_user ON breeding_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_status ON breeding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_planned_date ON breeding_tasks(planned_date);
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_completed ON breeding_tasks(completed_at) WHERE completed_at IS NULL;

-- ============================================
-- 5. BREEDING MANIFESTS (Historia Wyjść / Manifesty)
-- ============================================
CREATE TABLE IF NOT EXISTS breeding_manifests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID REFERENCES breeding_series(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  destination_type VARCHAR(50),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  qr_code_payload TEXT,
  manifest_pdf_url TEXT,
  passports_pdf_url TEXT,
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_breeding_manifests_user ON breeding_manifests(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_manifests_series ON breeding_manifests(series_id);
CREATE INDEX IF NOT EXISTS idx_breeding_manifests_generated_at ON breeding_manifests(generated_at);

-- ============================================
-- 6. TRIGGER: Auto-generate tasks when series is created
-- ============================================
CREATE OR REPLACE FUNCTION generate_breeding_tasks()
RETURNS TRIGGER AS $$
DECLARE
  task_date DATE;
BEGIN
  -- Day 5: Check acceptance
  task_date := NEW.start_date + INTERVAL '5 days';
  INSERT INTO breeding_tasks (series_id, user_id, task_name, planned_date, status)
  VALUES (NEW.id, NEW.user_id, 'Sprawdzenie akceptacji', task_date, 'PENDING');
  
  -- Day 10: Isolate cells
  task_date := NEW.start_date + INTERVAL '10 days';
  INSERT INTO breeding_tasks (series_id, user_id, task_name, planned_date, status)
  VALUES (NEW.id, NEW.user_id, 'Izolacja komórek / Przeniesienie do inkubatora', task_date, 'PENDING');
  
  -- Day 11: Hatching
  task_date := NEW.start_date + INTERVAL '11 days';
  INSERT INTO breeding_tasks (series_id, user_id, task_name, planned_date, status)
  VALUES (NEW.id, NEW.user_id, 'Wygryzanie - Przeniesienie do ulików weselnych', task_date, 'PENDING');
  
  -- Day 12: Hatching (alternative)
  task_date := NEW.start_date + INTERVAL '12 days';
  INSERT INTO breeding_tasks (series_id, user_id, task_name, planned_date, status)
  VALUES (NEW.id, NEW.user_id, 'Wygryzanie - Przeniesienie do ulików weselnych', task_date, 'PENDING');
  
  -- Day 20: Check oviposition
  task_date := NEW.start_date + INTERVAL '20 days';
  INSERT INTO breeding_tasks (series_id, user_id, task_name, planned_date, status)
  VALUES (NEW.id, NEW.user_id, 'Sprawdzenie unasiennienia (Czerwienie)', task_date, 'PENDING');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_generate_breeding_tasks ON breeding_series;
CREATE TRIGGER trigger_generate_breeding_tasks
  AFTER INSERT ON breeding_series
  FOR EACH ROW
  EXECUTE FUNCTION generate_breeding_tasks();

-- ============================================
-- 7. TRIGGER: Update updated_at timestamp for mating_nucs
-- ============================================
CREATE OR REPLACE FUNCTION update_mating_nucs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mating_nucs_updated_at
  BEFORE UPDATE ON mating_nucs
  FOR EACH ROW
  EXECUTE FUNCTION update_mating_nucs_updated_at();

-- ============================================
-- 8. VIEW: Dynamic Inventory (Total Stock)
-- ============================================
CREATE OR REPLACE VIEW breeding_inventory AS
SELECT 
  user_id,
  (
    (SELECT COUNT(*) FROM mating_nucs WHERE status IN ('READY', 'LAYING') AND user_id = p.id) +
    (SELECT COALESCE(SUM(quantity), 0) FROM queen_bank WHERE user_id = p.id)
  ) AS total_stock
FROM auth.users p
WHERE EXISTS (
  SELECT 1 FROM breeding_series WHERE user_id = p.id
  UNION
  SELECT 1 FROM mating_nucs WHERE user_id = p.id
  UNION
  SELECT 1 FROM queen_bank WHERE user_id = p.id
);







