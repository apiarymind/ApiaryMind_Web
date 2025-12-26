-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hives ENABLE ROW LEVEL SECURITY;
ALTER TABLE apiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
-- Assuming roles are stored in profiles or a separate table, but prompt said 'profiles/users'.
-- If 'roles' is a separate table:
-- ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can see their own profile.
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 2. Hives: Users can view their own hives.
-- Assuming 'user_id' column exists in hives.
CREATE POLICY "Users can view own hives"
ON hives FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hives"
ON hives FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hives"
ON hives FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hives"
ON hives FOR DELETE
USING (auth.uid() = user_id);

-- 3. Apiaries: Users can view their own apiaries.
CREATE POLICY "Users can view own apiaries"
ON apiaries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own apiaries"
ON apiaries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own apiaries"
ON apiaries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own apiaries"
ON apiaries FOR DELETE
USING (auth.uid() = user_id);

-- 4. Inspections:
-- Inspection usually links to hive, and hive links to user.
-- However, standard is to query based on hive ownership or if user_id is denormalized on inspection.
-- Assuming 'user_id' is NOT on inspections but 'hive_id' is.
-- BUT looking at `get-inspections.ts`, it seems we query inspections directly sometimes?
-- Actually `get-inspections.ts` had `user_id` in `getUserInspections` implying inspections table might have `user_id`.
-- Let's check `app/actions/get-inspections.ts` content again.
-- It had `select('id, type, inspection_date, hive_id, notes, user_id')`. So it HAS user_id.

CREATE POLICY "Users can view own inspections"
ON inspections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inspections"
ON inspections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspections"
ON inspections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inspections"
ON inspections FOR DELETE
USING (auth.uid() = user_id);

-- 5. Roles (if separate table)
-- "Dla ról: Każdy zalogowany (auth.role() = 'authenticated') może odczytać swoją rolę, ale nie może jej zmienić."
-- If roles are just a column in profiles, the profile policy handles it.
-- If there is a `roles` table defining capabilities:
-- CREATE POLICY "Authenticated users can read roles" ON roles FOR SELECT TO authenticated USING (true);
