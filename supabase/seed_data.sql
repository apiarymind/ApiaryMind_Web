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
    -- 1. CLEANUP
    -- Removing old data to ensure clean state
    TRUNCATE inspections, queens, hives, apiaries, medications_global CASCADE;

    -- 2. GET USER
    SELECT id INTO v_user_id FROM profiles LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No profile found in profiles table. Please create a user first.';
    END IF;

    -- 3. GLOBAL MEDICATIONS
    INSERT INTO medications_global (id, name, active_substance, withdrawal_period_days)
    VALUES
        (uuid_generate_v4(), 'Apiwarol', 'Amitraz', 2),
        (uuid_generate_v4(), 'Apiguard', 'Thymol', 0),
        (uuid_generate_v4(), 'Bayvarol', 'Flumethrin', 0)
    ON CONFLICT DO NOTHING;

    -- 4. APIARY
    v_apiary_id := uuid_generate_v4();
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary_id, v_user_id, 'Wielka Pasieka Produkcyjna', '52.2297,21.0122', 'STATIONARY', false);

    -- 5. MASSIVE LOOP (100 HIVES)
    FOR i IN 1..100 LOOP
        v_hive_id := uuid_generate_v4();

        -- Logic: Lineage Assignment
        IF i <= 50 THEN
            -- Angel Line (Good)
            v_lineage_name := 'Angel';
        ELSE
            -- Demon Line (Bad)
            v_lineage_name := 'Demon';
        END IF;

        -- Create Hive
        INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
        VALUES (v_hive_id, v_apiary_id, to_char(i, 'FM000'), 'Dadant', 'mesh', '2023-04-01', NULL);

        -- Pick Random Breeder
        v_breeder_name := v_breeder_names[floor(random()*array_length(v_breeder_names, 1) + 1)::int];

        -- Step A: Historical Queen (2023)
        v_old_queen_id := uuid_generate_v4();
        INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
        VALUES (v_old_queen_id, v_user_id, v_hive_id, 2023, 'RED-' || to_char(i, 'FM000'), v_lineage_name, v_breeder_name, 'DECEASED'::queen_status_type);

        -- Inspections for Old Queen (2023)
        FOR j IN 1..10 LOOP
            -- Determine Traits based on Lineage
            v_rand_val := floor(random() * 100 + 1)::int;
            IF v_lineage_name = 'Angel' THEN
                -- Angel: 90% Calm/Strong
                IF v_rand_val <= 90 THEN v_mood := 'CALM'; v_strength := 'STRONG'; ELSE v_mood := 'AGGRESSIVE'; v_strength := 'MEDIUM'; END IF;
            ELSE
                -- Demon: 90% Aggressive/Weak
                IF v_rand_val <= 90 THEN v_mood := 'AGGRESSIVE'; v_strength := 'WEAK'; ELSE v_mood := 'CALM'; v_strength := 'MEDIUM'; END IF;
            END IF;

            -- Medication Logic (20% chance)
            v_medication := NULL;
            IF (random() < 0.2) THEN v_medication := 'Apiwarol'; END IF;

            INSERT INTO inspections (
                id, hive_id, queen_id, inspection_date,
                mood, colony_strength, weather_condition, laying_pattern,
                pests_detected, treatment_applied, user_id
            )
            VALUES (
                uuid_generate_v4(), v_hive_id, v_old_queen_id, (format('2023-05-%s 10:00:00', 10+j)::timestamp),
                v_mood::mood_type,
                v_strength::colony_strength_type,
                'SUNNY'::weather_condition_type,
                'SOLID'::laying_pattern_type,
                '{}', v_medication, v_user_id
            );
        END LOOP;

        -- Step B: Current Queen (2025)
        v_curr_queen_id := uuid_generate_v4();
        INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
        VALUES (v_curr_queen_id, v_user_id, v_hive_id, 2025, 'GRN-' || to_char(i, 'FM000'), v_lineage_name, v_breeder_name, 'ACTIVE'::queen_status_type);

        -- Update Hive
        UPDATE hives SET current_queen_id = v_curr_queen_id WHERE id = v_hive_id;

        -- Inspections for Current Queen (2025)
        FOR j IN 1..5 LOOP
             -- Determine Traits
            v_rand_val := floor(random() * 100 + 1)::int;
            IF v_lineage_name = 'Angel' THEN
                IF v_rand_val <= 90 THEN v_mood := 'CALM'; v_strength := 'STRONG'; ELSE v_mood := 'AGGRESSIVE'; v_strength := 'MEDIUM'; END IF;
            ELSE
                IF v_rand_val <= 90 THEN v_mood := 'AGGRESSIVE'; v_strength := 'WEAK'; ELSE v_mood := 'CALM'; v_strength := 'MEDIUM'; END IF;
            END IF;

            -- Medication
            v_medication := NULL;
            IF (random() < 0.2) THEN v_medication := 'Apiguard'; END IF;

            INSERT INTO inspections (
                id, hive_id, queen_id, inspection_date,
                mood, colony_strength, weather_condition, laying_pattern,
                pests_detected, treatment_applied, user_id
            )
            VALUES (
                uuid_generate_v4(), v_hive_id, v_curr_queen_id, (format('2025-06-%s 10:00:00', 10+j)::timestamp),
                v_mood::mood_type,
                v_strength::colony_strength_type,
                'SUNNY'::weather_condition_type,
                'SOLID'::laying_pattern_type,
                '{}', v_medication, v_user_id
            );
        END LOOP;

    END LOOP;
END $$;
