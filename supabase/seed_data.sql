DO $$
DECLARE
    -- IDs
    v_main_user_id uuid;
    v_apiary_id uuid;
    v_hive_id uuid;
    v_queen_id uuid;

    -- User Arrays
    v_all_users uuid[];
    v_breeder_users uuid[] := '{}';
    v_top_breeders uuid[] := '{}';
    v_mid_breeders uuid[] := '{}';
    v_bad_breeders uuid[] := '{}';

    -- Breeder Data
    v_top_names text[] := ARRAY['Pasieka Mistrz', 'Krolowe Premium', 'Zlota Pszczola'];
    v_mid_names text[] := ARRAY['Pasieka Nowaka', 'Miodoland', 'Pszczeli Raj', 'Pasieka Wzgorze'];
    v_bad_names text[] := ARRAY['Pasieka u Zdzicha', 'Tanie Matki', 'Import NoName'];

    -- Simulation Vars
    i integer;
    j integer;
    y integer;
    v_rand float;
    v_breeder_id uuid;
    v_breeder_name text;
    v_quality integer; -- 1=TOP, 2=MID, 3=BAD

    -- Inspection Vars
    v_date timestamp;
    v_mood text;
    v_strength text;
    v_honey integer;
    v_swarm boolean;
    v_weather text;
    v_weather_opts text[] := ARRAY['SUNNY', 'CLOUDY', 'VARIABLE', 'WINDY'];

BEGIN
    -- 1. CLEANUP
    TRUNCATE inspections, queens, hives, apiaries, medications_global CASCADE;

    -- 2. FETCH USERS (Need 11)
    SELECT array_agg(id) INTO v_all_users FROM profiles LIMIT 11;

    IF array_length(v_all_users, 1) < 2 THEN
        RAISE EXCEPTION 'Not enough users. Need at least 2.';
    END IF;

    -- Main User = Last one
    v_main_user_id := v_all_users[array_length(v_all_users, 1)];

    -- Configure Breeders (Up to 10)
    FOR i IN 1..(array_length(v_all_users, 1) - 1) LOOP
        -- Assign Quality Tier based on index
        IF i <= 3 THEN
            v_quality := 1; -- TOP
            v_breeder_name := v_top_names[i];
            v_top_breeders := array_append(v_top_breeders, v_all_users[i]);
        ELSIF i <= 7 THEN
            v_quality := 2; -- MID
            v_breeder_name := v_mid_names[i-3];
            v_mid_breeders := array_append(v_mid_breeders, v_all_users[i]);
        ELSE
            v_quality := 3; -- BAD
            v_breeder_name := v_bad_names[i-7];
            v_bad_breeders := array_append(v_bad_breeders, v_all_users[i]);
        END IF;

        -- Fallback name
        IF v_breeder_name IS NULL THEN v_breeder_name := 'Breeder ' || i; END IF;

        -- Update Profile (Business Card)
        UPDATE profiles SET
            subscription_plan = 'BUSINESS'::subscription_plan_type,
            company_name = v_breeder_name,
            city = CASE WHEN v_quality=1 THEN 'Krakow' WHEN v_quality=2 THEN 'Warszawa' ELSE 'Radom' END,
            nip = '123456789' || i,
            phone_number = '500-000-00' || i,
            rhd_number = 'RHD-' || i
        WHERE id = v_all_users[i];
    END LOOP;

    -- 3. CREATE APIARY
    v_apiary_id := uuid_generate_v4();
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary_id, v_main_user_id, 'Pasieka Testowa (100 Uli)', '52.0,21.0', 'STATIONARY', false);

    -- 4. HIVE LOOP (100)
    FOR i IN 1..100 LOOP
        v_hive_id := uuid_generate_v4();

        -- Create Hive
        INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
        VALUES (v_hive_id, v_apiary_id, to_char(i, 'FM000'), 'Wielkopolski', 'mesh', '2022-03-01', NULL);

        -- Pick Breeder (Probabilistic)
        v_rand := random();
        IF v_rand < 0.30 AND array_length(v_top_breeders, 1) > 0 THEN
            -- TOP
            v_quality := 1;
            v_breeder_id := v_top_breeders[floor(random()*array_length(v_top_breeders, 1) + 1)::int];
        ELSIF v_rand < 0.70 AND array_length(v_mid_breeders, 1) > 0 THEN
            -- MID
            v_quality := 2;
            v_breeder_id := v_mid_breeders[floor(random()*array_length(v_mid_breeders, 1) + 1)::int];
        ELSE
            -- BAD
            v_quality := 3;
            IF array_length(v_bad_breeders, 1) > 0 THEN
                v_breeder_id := v_bad_breeders[floor(random()*array_length(v_bad_breeders, 1) + 1)::int];
            ELSE
                 -- Fallback if no bad breeders (unlikely)
                 v_breeder_id := v_mid_breeders[1];
                 v_quality := 2;
            END IF;
        END IF;

        -- Get Name
        SELECT company_name INTO v_breeder_name FROM profiles WHERE id = v_breeder_id;

        -- Create Queen (2022)
        v_queen_id := uuid_generate_v4();
        INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
        VALUES (v_queen_id, v_main_user_id, v_hive_id, 2022, 'YEL-' || i, 'Carnica', v_breeder_name, 'ACTIVE'::queen_status_type);

        UPDATE hives SET current_queen_id = v_queen_id WHERE id = v_hive_id;

        -- 5. MASS INSPECTION HISTORY (2022-2025)
        FOR y IN 2022..2025 LOOP
            -- 28 Inspections per year (~Weekly Apr-Oct)
            FOR j IN 1..28 LOOP
                -- Date: Start Apr 1st + (j * 6-7 days) + jitter
                v_date := (y || '-04-01')::timestamp + (j * 6 || ' days')::interval + (floor(random()*2) || ' days')::interval;

                -- Logic based on Quality
                IF v_quality = 1 THEN -- TOP
                    v_mood := 'CALM';
                    v_strength := CASE WHEN random() < 0.2 THEN 'STRONG' ELSE 'STRONG' END; -- "very_strong" mapped to STRONG
                    v_supers := floor(random() * 2 + 2)::int; -- 2-3
                    v_swarm := false;
                ELSIF v_quality = 3 THEN -- BAD
                    v_mood := 'AGGRESSIVE';
                    v_strength := CASE WHEN random() < 0.5 THEN 'WEAK' ELSE 'MEDIUM' END;
                    v_supers := floor(random() * 2)::int; -- 0-1
                    -- Swarming often true in May/June (inspections 5-12 approx)
                    IF j BETWEEN 5 AND 12 AND random() < 0.6 THEN v_swarm := true; ELSE v_swarm := false; END IF;
                ELSE -- MID
                    v_mood := CASE WHEN random() < 0.7 THEN 'CALM' ELSE 'AGGRESSIVE' END;
                    v_strength := 'MEDIUM';
                    v_supers := floor(random() * 3)::int; -- 0-2
                    v_swarm := (random() < 0.1);
                END IF;

                v_weather := v_weather_opts[floor(random()*array_length(v_weather_opts, 1) + 1)::int];

                INSERT INTO inspections (
                    id, hive_id, queen_id, inspection_date,
                    mood, colony_strength, honey_supers_count, swarming_mood,
                    weather_condition, laying_pattern, pests_detected, treatment_applied, user_id
                ) VALUES (
                    uuid_generate_v4(), v_hive_id, v_queen_id, v_date + time '11:00',
                    v_mood::mood_type, v_strength::colony_strength_type, v_supers, v_swarm,
                    v_weather::weather_condition_type, 'SOLID'::laying_pattern_type, '{}', NULL, v_main_user_id
                );
            END LOOP;
        END LOOP;

    END LOOP; -- Hive Loop

END $$;
