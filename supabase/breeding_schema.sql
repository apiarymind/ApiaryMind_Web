-- ============================================
-- BREEDING MODULE SCHEMA
-- Panel Hodowcy - Schema dla Serii Matecznych, Ulików Weselnych i Banku Matek
-- ============================================

-- ============================================
-- 1. BREEDING SERIES (Serie Mateczne)
-- ============================================
CREATE TABLE IF NOT EXISTS breeding_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breeder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mother_queen_id UUID REFERENCES queens(id) ON DELETE SET NULL,
  series_number VARCHAR(50) NOT NULL, -- e.g., "S/2025/01"
  lineage VARCHAR(255), -- Linia genetyczna
  start_date DATE NOT NULL, -- Day 0: grafting date
  larvae_count INTEGER NOT NULL DEFAULT 0, -- Initial grafted larvae
  accepted_count INTEGER DEFAULT 0, -- Day 5: accepted cells
  hatched_count INTEGER DEFAULT 0, -- Day 11/12: hatched queens
  notes TEXT,
  status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT breeding_series_breeder_fk FOREIGN KEY (breeder_id) REFERENCES profiles(id),
  CONSTRAINT breeding_series_mother_queen_fk FOREIGN KEY (mother_queen_id) REFERENCES queens(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_breeding_series_breeder ON breeding_series(breeder_id);
CREATE INDEX IF NOT EXISTS idx_breeding_series_start_date ON breeding_series(start_date);
CREATE INDEX IF NOT EXISTS idx_breeding_series_status ON breeding_series(status);

-- Computed efficiency (can be calculated in application layer)
-- acceptance_efficiency = (accepted_count / larvae_count) * 100
-- hatching_efficiency = (hatched_count / accepted_count) * 100

-- ============================================
-- 2. MATING NUCS (Uliki Weselne)
-- ============================================
CREATE TABLE IF NOT EXISTS mating_nucs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breeder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  custom_id VARCHAR(50) NOT NULL, -- e.g., "Nuc-01", "Nuc-02"
  status VARCHAR(50) NOT NULL DEFAULT 'EMPTY', -- EMPTY, VIRGIN, READY
  current_queen_series_id UUID REFERENCES breeding_series(id) ON DELETE SET NULL,
  queen_year INTEGER, -- Year for color badge (e.g., 2026 = White)
  queen_year_color VARCHAR(20), -- 'WHITE', 'YELLOW', 'RED', 'GREEN', 'BLUE'
  introduced_date DATE, -- When queen was introduced
  mated_date DATE, -- When queen started laying
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT mating_nucs_breeder_fk FOREIGN KEY (breeder_id) REFERENCES profiles(id),
  CONSTRAINT mating_nucs_series_fk FOREIGN KEY (current_queen_series_id) REFERENCES breeding_series(id),
  CONSTRAINT mating_nucs_status_check CHECK (status IN ('EMPTY', 'VIRGIN', 'READY')),
  CONSTRAINT mating_nucs_custom_id_unique UNIQUE (breeder_id, custom_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mating_nucs_breeder ON mating_nucs(breeder_id);
CREATE INDEX IF NOT EXISTS idx_mating_nucs_status ON mating_nucs(status);
CREATE INDEX IF NOT EXISTS idx_mating_nucs_series ON mating_nucs(current_queen_series_id);

-- ============================================
-- 3. QUEEN BANK (Bank Matek)
-- ============================================
CREATE TABLE IF NOT EXISTS queen_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breeder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  series_id UUID REFERENCES breeding_series(id) ON DELETE SET NULL,
  count INTEGER NOT NULL DEFAULT 0, -- Number of queens in bank
  status VARCHAR(50) DEFAULT 'READY', -- Always READY for bank
  queen_year INTEGER,
  queen_year_color VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT queen_bank_breeder_fk FOREIGN KEY (breeder_id) REFERENCES profiles(id),
  CONSTRAINT queen_bank_series_fk FOREIGN KEY (series_id) REFERENCES breeding_series(id),
  CONSTRAINT queen_bank_count_check CHECK (count >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_queen_bank_breeder ON queen_bank(breeder_id);
CREATE INDEX IF NOT EXISTS idx_queen_bank_series ON queen_bank(series_id);

-- ============================================
-- 4. BREEDING TASKS (Automatyczne zadania)
-- ============================================
CREATE TABLE IF NOT EXISTS breeding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES breeding_series(id) ON DELETE CASCADE,
  breeder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL, -- 'CHECK_ACCEPTANCE', 'ISOLATE_CELLS', 'HATCHING', 'CHECK_OVIPOSITION'
  scheduled_day INTEGER NOT NULL, -- Days from start_date (0, 5, 10, 11, 12, 20+)
  scheduled_date DATE NOT NULL, -- Calculated: start_date + scheduled_day
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, SKIPPED
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT breeding_tasks_series_fk FOREIGN KEY (series_id) REFERENCES breeding_series(id),
  CONSTRAINT breeding_tasks_breeder_fk FOREIGN KEY (breeder_id) REFERENCES profiles(id),
  CONSTRAINT breeding_tasks_type_check CHECK (task_type IN ('CHECK_ACCEPTANCE', 'ISOLATE_CELLS', 'HATCHING', 'CHECK_OVIPOSITION'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_series ON breeding_tasks(series_id);
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_breeder ON breeding_tasks(breeder_id);
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_status ON breeding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_breeding_tasks_scheduled_date ON breeding_tasks(scheduled_date);

-- ============================================
-- 5. PRODUCTION HISTORY (Historia produkcji)
-- ============================================
CREATE TABLE IF NOT EXISTS production_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breeder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL, -- Number of queens/nucs
  source_type VARCHAR(50) NOT NULL, -- 'NUCS', 'BANK', 'MIXED'
  series_id UUID REFERENCES breeding_series(id) ON DELETE SET NULL,
  genetics_info JSONB, -- Store lineage, year, etc.
  manifest_pdf_url TEXT, -- URL to generated PDF
  passports_pdf_url TEXT, -- URL to generated passports PDF
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT production_history_breeder_fk FOREIGN KEY (breeder_id) REFERENCES profiles(id),
  CONSTRAINT production_history_series_fk FOREIGN KEY (series_id) REFERENCES breeding_series(id),
  CONSTRAINT production_history_source_check CHECK (source_type IN ('NUCS', 'BANK', 'MIXED')),
  CONSTRAINT production_history_quantity_check CHECK (quantity > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_history_breeder ON production_history(breeder_id);
CREATE INDEX IF NOT EXISTS idx_production_history_exit_date ON production_history(exit_date);
CREATE INDEX IF NOT EXISTS idx_production_history_series ON production_history(series_id);

-- ============================================
-- 6. PRODUCTION EXIT ITEMS (Szczegóły wyjścia)
-- ============================================
CREATE TABLE IF NOT EXISTS production_exit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_history_id UUID NOT NULL REFERENCES production_history(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'NUC', 'BANK'
  source_id UUID, -- mating_nucs.id or queen_bank.id
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT production_exit_items_history_fk FOREIGN KEY (production_history_id) REFERENCES production_history(id),
  CONSTRAINT production_exit_items_source_check CHECK (source_type IN ('NUC', 'BANK')),
  CONSTRAINT production_exit_items_quantity_check CHECK (quantity > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_exit_items_history ON production_exit_items(production_history_id);

-- ============================================
-- 7. HELPER FUNCTION: Get Queen Year Color
-- ============================================
CREATE OR REPLACE FUNCTION get_queen_year_color(year_val INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
  -- Standard beekeeping color cycle: White, Yellow, Red, Green, Blue
  -- Repeats every 5 years
  CASE (year_val % 5)
    WHEN 0 THEN RETURN 'BLUE';   -- 2020, 2025, 2030...
    WHEN 1 THEN RETURN 'WHITE';  -- 2021, 2026, 2031...
    WHEN 2 THEN RETURN 'YELLOW'; -- 2022, 2027, 2032...
    WHEN 3 THEN RETURN 'RED';    -- 2023, 2028, 2033...
    WHEN 4 THEN RETURN 'GREEN';  -- 2024, 2029, 2034...
    ELSE RETURN 'WHITE';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 8. TRIGGER: Auto-generate tasks when series is created
-- ============================================
CREATE OR REPLACE FUNCTION generate_breeding_tasks()
RETURNS TRIGGER AS $$
DECLARE
  task_date DATE;
BEGIN
  -- Day 5: Check acceptance
  task_date := NEW.start_date + INTERVAL '5 days';
  INSERT INTO breeding_tasks (series_id, breeder_id, task_type, scheduled_day, scheduled_date)
  VALUES (NEW.id, NEW.breeder_id, 'CHECK_ACCEPTANCE', 5, task_date);
  
  -- Day 10: Isolate cells
  task_date := NEW.start_date + INTERVAL '10 days';
  INSERT INTO breeding_tasks (series_id, breeder_id, task_type, scheduled_day, scheduled_date)
  VALUES (NEW.id, NEW.breeder_id, 'ISOLATE_CELLS', 10, task_date);
  
  -- Day 11: Hatching
  task_date := NEW.start_date + INTERVAL '11 days';
  INSERT INTO breeding_tasks (series_id, breeder_id, task_type, scheduled_day, scheduled_date)
  VALUES (NEW.id, NEW.breeder_id, 'HATCHING', 11, task_date);
  
  -- Day 12: Hatching (alternative)
  task_date := NEW.start_date + INTERVAL '12 days';
  INSERT INTO breeding_tasks (series_id, breeder_id, task_type, scheduled_day, scheduled_date)
  VALUES (NEW.id, NEW.breeder_id, 'HATCHING', 12, task_date);
  
  -- Day 20: Check oviposition
  task_date := NEW.start_date + INTERVAL '20 days';
  INSERT INTO breeding_tasks (series_id, breeder_id, task_type, scheduled_day, scheduled_date)
  VALUES (NEW.id, NEW.breeder_id, 'CHECK_OVIPOSITION', 20, task_date);
  
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
-- 9. TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_breeding_series_updated_at
  BEFORE UPDATE ON breeding_series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mating_nucs_updated_at
  BEFORE UPDATE ON mating_nucs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queen_bank_updated_at
  BEFORE UPDATE ON queen_bank
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. VIEW: Dynamic Inventory (Total Stock)
-- ============================================
CREATE OR REPLACE VIEW breeding_inventory AS
SELECT 
  breeder_id,
  (
    (SELECT COUNT(*) FROM mating_nucs WHERE status = 'READY' AND breeder_id = p.id) +
    (SELECT COALESCE(SUM(count), 0) FROM queen_bank WHERE breeder_id = p.id)
  ) AS total_stock
FROM profiles p
WHERE EXISTS (
  SELECT 1 FROM breeding_series WHERE breeder_id = p.id
  UNION
  SELECT 1 FROM mating_nucs WHERE breeder_id = p.id
  UNION
  SELECT 1 FROM queen_bank WHERE breeder_id = p.id
);


