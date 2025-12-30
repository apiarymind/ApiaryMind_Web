DO $$
DECLARE
    -- IDs
    v_main_user_id uuid;
    v_apiary_id uuid;
    v_hive_id uuid;
    v_queen_id uuid;

    -- Users Management
    v_all_users uuid[];
    v_breeder_users uuid[] := '{}';
    v_breeder_id uuid;
    v_temp_user uuid;

    -- Breeder Data Arrays (Name, City, Quality)
    -- Quality: 1=TOP, 2=MID, 3=BAD
    v_top_names text[] := ARRAY['Pasieka Mistrz', 'Krolowe Premium', 'Zlota Pszczola'];
    v_mid_names text[] := ARRAY['Pasieka Nowaka', 'Miodoland', 'Pszczeli Raj', 'Pasieka Wzgorze'];
    v_bad_names text[] := ARRAY['Pasieka u Zdzicha', 'Tanie Matki', 'Import NoName'];

    -- Lines (2 per breeder category for simplicity, or we generate dynamically)
    v_top_lines text[] := ARRAY['Krainka Gold', 'Singer'];
    v_mid_lines text[] := ARRAY['Nieska', 'Alpejka'];
    v_bad_lines text[] := ARRAY['Agresor', 'Rojliwa'];

    -- Variables
    i integer;
    j integer;
    k integer;
    v_breeder_idx integer;
    v_quality integer; -- 1, 2, 3
    v_breeder_name text;
    v_lineage text;
    v_city text := 'Warszawa';

    -- Inspection Vars
    v_mood text;
    v_strength text;
    v_swarming boolean;
    v_supers integer;
    v_date timestamp;

BEGIN
    -- 1. CLEANUP
    TRUNCATE inspections, queens, hives, apiaries, medications_global CASCADE;

    -- 2. FETCH USERS (Need 11: 1 Main + 10 Breeders)
    SELECT array_agg(id) INTO v_all_users FROM profiles LIMIT 11;

    IF array_length(v_all_users, 1) < 2 THEN
        RAISE EXCEPTION 'Not enough users in profiles table. Need at least 2 (1 Breeder + 1 Main). Found %', array_length(v_all_users, 1);
    END IF;

    -- Assign Main User (Last one)
    v_main_user_id := v_all_users[array_length(v_all_users, 1)];

    -- Assign Breeders (First 10, or less if fewer users)
    -- We loop up to 10 or max available - 1
    FOR i IN 1..(array_length(v_all_users, 1) - 1) LOOP
        v_temp_user := v_all_users[i];
        v_breeder_users := array_append(v_breeder_users, v_temp_user);

        -- Determine Quality based on index
        -- 1-3: TOP (3)
        -- 4-7: MID (4)
        -- 8-10: BAD (3)
        IF i <= 3 THEN
            v_quality := 1; -- TOP
            v_breeder_name := v_top_names[i];
        ELSIF i <= 7 THEN
            v_quality := 2; -- MID
            v_breeder_name := v_mid_names[i - 3];
        ELSE
            v_quality := 3; -- BAD
            v_breeder_name := v_bad_names[i - 7];
        END IF;

        -- Default/Fallback logic for names if index out of bounds (e.g. if we have only 2 users)
        IF v_breeder_name IS NULL THEN v_breeder_name := 'Breeder ' || i; END IF;

        -- Update Profile
        -- Note: description skipped as not in schema. Using company_name for Business Name.
        UPDATE profiles
        SET subscription_plan = 'BUSINESS'::subscription_plan_type,
            company_name = v_breeder_name,
            city = CASE WHEN v_quality=1 THEN 'Krakow' WHEN v_quality=2 THEN 'Poznan' ELSE 'Radom' END,
            nip = '123456789' || i,
            phone_number = '500-000-00' || i,
            rhd_number = 'RHD-' || i
        WHERE id = v_temp_user;

    END LOOP;

    -- 3. CREATE MAIN APIARY (100 Hives)
    v_apiary_id := uuid_generate_v4();
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary_id, v_main_user_id, 'Moja Wielka Pasieka', '52.0,21.0', 'STATIONARY', false);

    -- 4. HIVE LOOP (100)
    FOR i IN 1..100 LOOP
        v_hive_id := uuid_generate_v4();

        -- Assign Breeder (Round Robin among available breeders)
        v_breeder_idx := (i % array_length(v_breeder_users, 1)) + 1;
        v_breeder_id := v_breeder_users[v_breeder_idx];

        -- Re-Determine Quality/Name from DB to ensure consistency or derive from index logic again
        -- Logic:
        -- If breeder_idx <= 3 -> TOP
        -- If breeder_idx <= 7 -> MID
        -- Else -> BAD
        IF v_breeder_idx <= 3 THEN
            v_quality := 1;
            v_breeder_name := v_top_names[v_breeder_idx];
            v_lineage := v_top_lines[(i % 2) + 1];
        ELSIF v_breeder_idx <= 7 THEN
            v_quality := 2;
            v_breeder_name := v_mid_names[v_breeder_idx - 3];
            v_lineage := v_mid_lines[(i % 2) + 1];
        ELSE
            v_quality := 3;
            v_breeder_name := v_bad_names[v_breeder_idx - 7];
            v_lineage := v_bad_lines[(i % 2) + 1];
        END IF;

        -- Create Hive
        INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
        VALUES (v_hive_id, v_apiary_id, to_char(i, 'FM000'), 'Wielkopolski', 'mesh', '2023-01-01', NULL);

        -- Create Queen
        v_queen_id := uuid_generate_v4();
        INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
        VALUES (v_queen_id, v_main_user_id, v_hive_id, 2023, 'RED-' || i, v_lineage, v_breeder_name, 'ACTIVE'::queen_status_type);

        UPDATE hives SET current_queen_id = v_queen_id WHERE id = v_hive_id;

        -- 5. INSPECTIONS (3-5 per hive)
        FOR j IN 1..(3 + (i % 3)) LOOP
            -- Date: Spring to Now (Simple logic: May, June, July, Aug)
            v_date := (format('2023-0%s-15 12:00:00', 4+j)::timestamp);

            -- Quality Logic
            IF v_quality = 1 THEN -- TOP
                v_mood := 'CALM';
                v_strength := 'STRONG';
                v_supers := 3;
                v_swarming := false;
            ELSIF v_quality = 3 THEN -- BAD
                v_mood := 'AGGRESSIVE';
                v_strength := CASE WHEN random() < 0.5 THEN 'WEAK' ELSE 'MEDIUM' END;
                v_supers := 1;
                v_swarming := true;
            ELSE -- MID
                v_mood := CASE WHEN random() < 0.8 THEN 'CALM' ELSE 'AGGRESSIVE' END;
                v_strength := 'MEDIUM';
                v_supers := 2;
                v_swarming := false;
            END IF;

            INSERT INTO inspections (
                id, hive_id, queen_id, inspection_date,
                mood, colony_strength, honey_supers_count, swarming_mood,
                weather_condition, laying_pattern, pests_detected, treatment_applied, user_id
            ) VALUES (
                uuid_generate_v4(), v_hive_id, v_queen_id, v_date,
                v_mood::mood_type, v_strength::colony_strength_type, v_supers, v_swarming,
                'SUNNY'::weather_condition_type, 'SOLID'::laying_pattern_type, '{}', NULL, v_main_user_id
            );
        END LOOP;

    END LOOP; -- Hive Loop

END $$;
