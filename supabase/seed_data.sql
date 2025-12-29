DO $$
DECLARE
    v_user_id uuid;
    v_apiary_id uuid;
    v_hive_id uuid;
    v_old_queen_id uuid;
    v_curr_queen_id uuid;
    v_breeder_names text[] := ARRAY['Pasieka Mistrz', 'NaturaBee', 'QueenKings', 'Zlota Pszczola', 'Miodoland', 'Krolowe Polnocy', 'Beskidzki Miod', 'Mazurska Pasieka', 'Wielkopolskie Matki', 'ApiGenetic'];
    v_breeder_name text;
    v_lineage_name text;
    v_mood text;
    v_strength text;
    v_medication text;
    i integer;
    j integer;
    v_rand_val integer;
BEGIN
    -- 0. CLEANUP (Optional but recommended for fresh start)
    -- Using CASCADE to remove dependent rows
    TRUNCATE inspections, queens, hives, apiaries CASCADE;

    -- 0. Get User (Owner/Inspector)
    SELECT id INTO v_user_id FROM profiles LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No profile found in profiles table. Please create a user first.';
    END IF;

    -- Step 1: Global Medications
    INSERT INTO medications_global (id, name, active_substance, withdrawal_period_days)
    VALUES
        (uuid_generate_v4(), 'Apiwarol', 'Amitraz', 2),
        (uuid_generate_v4(), 'Apiguard', 'Thymol', 0),
        (uuid_generate_v4(), 'Bayvarol', 'Flumethrin', 0)
    ON CONFLICT DO NOTHING; -- Just in case

    -- Step 2: Create Main Apiary
    v_apiary_id := uuid_generate_v4();
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary_id, v_user_id, 'Wielka Pasieka Testowa (100 Uli)', '52.2297,21.0122', 'STATIONARY', false);

    -- Step 3: The Loop (100 Hives)
    FOR i IN 1..100 LOOP
        v_hive_id := uuid_generate_v4();

        -- Determine Lineage
        IF i <= 50 THEN
            -- Line A ("Angel"): High Score
            v_lineage_name := 'Angel';
            -- Probability: 90% CALM, 10% AGGRESSIVE
            -- Strength: 90% STRONG, 10% MEDIUM
        ELSE
            -- Line B ("Demon"): Low Score
            v_lineage_name := 'Demon';
            -- Probability: 90% AGGRESSIVE, 10% CALM
            -- Strength: 90% WEAK, 10% MEDIUM
        END IF;

        -- Create Hive (initially no queen)
        INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
        VALUES (v_hive_id, v_apiary_id, to_char(i, 'FM000'), 'Dadant', 'mesh', '2023-04-01', NULL);

        -- Pick a random breeder
        v_breeder_name := v_breeder_names[floor(random()*array_length(v_breeder_names, 1) + 1)::int];

        -- Step A: The History (Dead Queen, 2023)
        v_old_queen_id := uuid_generate_v4();
        INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
        VALUES (v_old_queen_id, v_user_id, v_hive_id, 2023, 'RED-' || to_char(i, 'FM000'), v_lineage_name, v_breeder_name, 'DECEASED');

        -- Generate ~10 Inspections for Old Queen in 2023
        FOR j IN 1..10 LOOP
            -- Determine Mood & Strength based on Lineage
            v_rand_val := floor(random() * 100 + 1)::int;
            IF v_lineage_name = 'Angel' THEN
                IF v_rand_val <= 90 THEN v_mood := 'CALM'; v_strength := 'STRONG'; ELSE v_mood := 'AGGRESSIVE'; v_strength := 'MEDIUM'; END IF;
            ELSE
                IF v_rand_val <= 90 THEN v_mood := 'AGGRESSIVE'; v_strength := 'WEAK'; ELSE v_mood := 'CALM'; v_strength := 'MEDIUM'; END IF;
            END IF;

            -- Occasional Medication (20% chance)
            v_medication := NULL;
            IF (random() < 0.2) THEN v_medication := 'Apiwarol'; END IF;

            INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, treatment_applied, user_id)
            VALUES (uuid_generate_v4(), v_hive_id, v_old_queen_id, (format('2023-05-%s 10:00:00', 10+j)::timestamp), v_mood, v_strength, '{}', v_medication, v_user_id);
        END LOOP;

        -- Step B: The Present (Active Queen, 2024/2025)
        v_curr_queen_id := uuid_generate_v4();
        -- Marking code color based on year (2024=Green/Blue? 2024 ends in 4->Green, but let's just use string code)
        INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
        VALUES (v_curr_queen_id, v_user_id, v_hive_id, 2024, 'GRN-' || to_char(i, 'FM000'), v_lineage_name, v_breeder_name, 'ACTIVE');

        -- Update Hive with Current Queen
        UPDATE hives SET current_queen_id = v_curr_queen_id WHERE id = v_hive_id;

        -- Generate ~5 Inspections for Current Queen in 2024
        FOR j IN 1..5 LOOP
            -- Same logic for Mood/Strength
             v_rand_val := floor(random() * 100 + 1)::int;
            IF v_lineage_name = 'Angel' THEN
                IF v_rand_val <= 90 THEN v_mood := 'CALM'; v_strength := 'STRONG'; ELSE v_mood := 'AGGRESSIVE'; v_strength := 'MEDIUM'; END IF;
            ELSE
                IF v_rand_val <= 90 THEN v_mood := 'AGGRESSIVE'; v_strength := 'WEAK'; ELSE v_mood := 'CALM'; v_strength := 'MEDIUM'; END IF;
            END IF;

            -- Occasional Medication
            v_medication := NULL;
            IF (random() < 0.2) THEN v_medication := 'Apiguard'; END IF;

            INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, treatment_applied, user_id)
            VALUES (uuid_generate_v4(), v_hive_id, v_curr_queen_id, (format('2024-06-%s 10:00:00', 10+j)::timestamp), v_mood, v_strength, '{}', v_medication, v_user_id);
        END LOOP;

    END LOOP; -- End 100 Hives Loop

    -- Step 4: Financials & Inventory (Skipped as tables not present in standard context)
    -- However, we ensured treatment_applied is populated to test costs if calculated from inspections.

END $$;
