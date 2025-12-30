DO $$
DECLARE
    -- IDs
    v_main_user_id uuid;
    v_apiary1_id uuid;
    v_apiary2_id uuid;
    v_hive_id uuid;
    v_old_queen_id uuid;
    v_new_queen_id uuid;

    -- Breeder Arrays
    v_good_emails text[] := ARRAY['top1@demo.pl', 'top2@demo.pl', 'top3@demo.pl', 'top4@demo.pl', 'top5@demo.pl'];
    v_good_names text[] := ARRAY['Mellifera Center', 'Pasieka Zarodowa', 'Krolowa Beskid', 'Apis Polonia', 'Zloty Roj'];
    v_bad_emails text[] := ARRAY['bad1@demo.pl', 'bad2@demo.pl', 'bad3@demo.pl', 'bad4@demo.pl', 'bad5@demo.pl'];
    v_bad_names text[] := ARRAY['U Zdziska', 'Szara Strefa', 'Anonim', 'Agro-Mix', 'Import NoName'];

    v_good_breeder_ids uuid[] := '{}';
    v_bad_breeder_ids uuid[] := '{}';

    -- Loop Variables
    i integer;
    y integer;
    d date;
    v_email text;
    v_uid uuid;
    v_breeder_id uuid;
    v_breeder_name text;
    v_is_good boolean;

    -- Data Vars
    v_mood text;

BEGIN
    -- 1. CLEANUP
    -- Truncate tables we know exist.
    TRUNCATE inspections, queens, hives, apiaries, medications_global, treatments_log CASCADE;
    -- Skipped: inventory, sales_log, products (Schema not verified in codebase)

    -- 2. SETUP PROFILES (Binding & Config)

    -- Good Breeders
    FOR i IN 1..5 LOOP
        v_email := v_good_emails[i];

        -- Fetch UUID from auth.users
        SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

        IF v_uid IS NOT NULL THEN
            -- Update Profile: Name, Plan, Role, Balance
            UPDATE profiles
            SET full_name = v_good_names[i],
                subscription_plan = 'PRO_PLUS'::subscription_plan_type,
                system_role = 'USER'::app_role,
                eyescoin_balance = 10000
            WHERE id = v_uid;

            -- Add to Array
            v_good_breeder_ids := array_append(v_good_breeder_ids, v_uid);
        END IF;
    END LOOP;

    -- Bad Breeders
    FOR i IN 1..5 LOOP
        v_email := v_bad_emails[i];

        -- Fetch UUID
        SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

        IF v_uid IS NOT NULL THEN
            -- Update Profile
            UPDATE profiles
            SET full_name = v_bad_names[i],
                subscription_plan = 'PRO_PLUS'::subscription_plan_type,
                system_role = 'USER'::app_role,
                eyescoin_balance = 10000
            WHERE id = v_uid;

            -- Add to Array
            v_bad_breeder_ids := array_append(v_bad_breeder_ids, v_uid);
        END IF;
    END LOOP;

    -- 3. SETUP RESOURCES (Main User)
    -- Find main user (not a breeder)
    SELECT id INTO v_main_user_id FROM profiles
    WHERE id != ALL(v_good_breeder_ids) AND id != ALL(v_bad_breeder_ids)
    LIMIT 1;

    -- Fallback
    IF v_main_user_id IS NULL THEN
        v_main_user_id := v_good_breeder_ids[1];
    END IF;

    -- Medications
    INSERT INTO medications_global (id, name, active_substance, withdrawal_period_days) VALUES
        (uuid_generate_v4(), 'Apiwarol', 'Amitraz', 2),
        (uuid_generate_v4(), 'Biowar 500', 'Amitraz', 0),
        (uuid_generate_v4(), 'Apiguard', 'Thymol', 0)
    ON CONFLICT DO NOTHING;

    -- 4. APIARIES
    v_apiary1_id := uuid_generate_v4();
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary1_id, v_main_user_id, 'Pasieka Las', '52.0,21.0', 'MIGRATORY', false);

    v_apiary2_id := uuid_generate_v4();
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary2_id, v_main_user_id, 'Pasieka Ogrod', '52.1,21.1', 'STATIONARY', false);

    -- 5. MAIN LOOP (100 HIVES)
    FOR i IN 1..100 LOOP
        v_hive_id := uuid_generate_v4();

        -- Create Hive
        INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
        VALUES (
            v_hive_id,
            CASE WHEN i % 2 <> 0 THEN v_apiary1_id ELSE v_apiary2_id END,
            to_char(i, 'FM000'),
            CASE WHEN i % 2 <> 0 THEN 'Wielkopolski' ELSE 'Dadant' END,
            'mesh', '2022-01-01', NULL
        );

        -- PHASE 1: OLD QUEEN (2022-2023)
        -- Random Breeder Selection
        IF random() < 0.5 THEN
             v_breeder_id := v_good_breeder_ids[floor(random()*array_length(v_good_breeder_ids, 1) + 1)::int];
             v_is_good := true;
        ELSE
             v_breeder_id := v_bad_breeder_ids[floor(random()*array_length(v_bad_breeder_ids, 1) + 1)::int];
             v_is_good := false;
        END IF;

        SELECT full_name INTO v_breeder_name FROM profiles WHERE id = v_breeder_id;

        -- Insert Old Queen
        v_old_queen_id := uuid_generate_v4();
        -- Using breeder_name text. original_breeder_id skipped as verified missing in codebase.
        INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
        VALUES (v_old_queen_id, v_main_user_id, v_hive_id, 2022, 'YEL-' || i, 'Carnica', v_breeder_name, 'DECEASED'::queen_status_type);

        -- Inspections 2022-2023
        FOR y IN 2022..2023 LOOP
             FOR d IN SELECT generate_series((y || '-05-01')::date, (y || '-08-30')::date, '14 days'::interval) LOOP
                 -- Logic: Bad -> Aggressive
                 IF v_is_good THEN
                     v_mood := CASE WHEN random() < 0.9 THEN 'CALM' ELSE 'AGGRESSIVE' END;
                 ELSE
                     v_mood := CASE WHEN random() < 0.2 THEN 'CALM' ELSE 'AGGRESSIVE' END;
                 END IF;

                 INSERT INTO inspections (
                    id, hive_id, queen_id, inspection_date, mood, colony_strength,
                    weather_condition, laying_pattern, pests_detected, treatment_applied,
                    is_queen_seen, user_id
                 ) VALUES (
                    uuid_generate_v4(), v_hive_id, v_old_queen_id, d + time '12:00',
                    v_mood::mood_type, 'STRONG'::colony_strength_type, 'SUNNY'::weather_condition_type,
                    'SOLID'::laying_pattern_type, '{}', NULL,
                    TRUE, -- UI Fix
                    v_main_user_id
                 );
             END LOOP;
        END LOOP;


        -- PHASE 2: NEW QUEEN (2024-2025) - REPLACEMENT
        -- If Old was Bad, REPLACE with Good.
        IF NOT v_is_good THEN
            v_breeder_id := v_good_breeder_ids[floor(random()*array_length(v_good_breeder_ids, 1) + 1)::int];
            v_is_good := true;
        ELSE
            -- Keep Good (pick random good)
            v_breeder_id := v_good_breeder_ids[floor(random()*array_length(v_good_breeder_ids, 1) + 1)::int];
            v_is_good := true;
        END IF;

        SELECT full_name INTO v_breeder_name FROM profiles WHERE id = v_breeder_id;

        v_new_queen_id := uuid_generate_v4();
        INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
        VALUES (v_new_queen_id, v_main_user_id, v_hive_id, 2024, 'GRN-' || i, 'Carnica', v_breeder_name, 'ACTIVE'::queen_status_type);

        UPDATE hives SET current_queen_id = v_new_queen_id WHERE id = v_hive_id;

        -- Inspections 2024-2025 (Calm)
        FOR y IN 2024..2025 LOOP
             FOR d IN SELECT generate_series((y || '-05-01')::date, (y || '-08-30')::date, '10 days'::interval) LOOP

                 INSERT INTO inspections (
                    id, hive_id, queen_id, inspection_date, mood, colony_strength,
                    weather_condition, laying_pattern, pests_detected, treatment_applied,
                    is_queen_seen, user_id
                 ) VALUES (
                    uuid_generate_v4(), v_hive_id, v_new_queen_id, d + time '12:00',
                    'CALM'::mood_type, 'STRONG'::colony_strength_type, 'SUNNY'::weather_condition_type,
                    'SOLID'::laying_pattern_type, '{}', NULL,
                    TRUE,
                    v_main_user_id
                 );
             END LOOP;

             -- Insert Treatment Log (Sept)
             INSERT INTO treatments_log (id, hive_id, medication_name, application_date, withdrawal_end_date)
             VALUES (
                uuid_generate_v4(),
                v_hive_id,
                'Apiwarol',
                (y || '-09-15')::date,
                (y || '-09-17')::date
             );
        END LOOP;

    END LOOP;

END $$;
