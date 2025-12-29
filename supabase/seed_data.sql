DO $$
DECLARE
    -- IDs
    v_user_id uuid;
    v_apiary1_id uuid;
    v_apiary2_id uuid;
    v_hive_id uuid;
    v_queen_id uuid;

    -- Arrays
    v_good_breeders text[] := ARRAY['Pasieka Zarodowa', 'Mellifera PL', 'Krolowa Beskid', 'Apis Polonia', 'Zloty Roj'];
    v_bad_breeders text[] := ARRAY['Szara Strefa', 'U Zdziska', 'Anonim', 'Agro-Mix', 'Import NoName'];
    v_weather_options text[] := ARRAY['SUNNY', 'CLOUDY', 'VARIABLE'];

    -- Variables
    v_breeder_name text;
    v_breeder_type text; -- 'GOOD' or 'BAD'
    v_hive_type text;
    v_apiary_id uuid;
    v_status text;
    v_year integer;
    v_inspection_date timestamp;
    v_mood text;
    v_strength text;
    v_weather text;
    v_laying text;
    v_treatment text;
    v_counter integer := 0;

    -- Loops
    i integer;
    y integer;
    d date;
BEGIN
    -- 1. CLEAN SLATE
    -- Truncate main tables. Skipped inventory as schema is not verified in context.
    TRUNCATE inspections, queens, hives, apiaries, medications_global CASCADE;

    -- 2. GET USER
    SELECT id INTO v_user_id FROM profiles LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No profile found in profiles table.';
    END IF;

    -- 3. MEDICATIONS
    INSERT INTO medications_global (id, name, active_substance, withdrawal_period_days) VALUES
        (uuid_generate_v4(), 'Apiwarol', 'Amitraz', 2),
        (uuid_generate_v4(), 'Biowar 500', 'Amitraz', 0),
        (uuid_generate_v4(), 'Apiguard', 'Thymol', 0)
    ON CONFLICT DO NOTHING;

    -- 4. APIARIES
    v_apiary1_id := uuid_generate_v4();
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary1_id, v_user_id, 'Pasieka Wedrowna (Las)', '52.2297,21.0122', 'MIGRATORY', false); -- Assuming MIGRATORY is valid if STATIONARY is

    v_apiary2_id := uuid_generate_v4();
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary2_id, v_user_id, 'Pasieka Stacjonarna (ogrod)', '52.2297,21.0122', 'STATIONARY', false);

    -- 5. HIVE LOOP (100)
    FOR i IN 1..100 LOOP
        v_hive_id := uuid_generate_v4();

        -- Logic Split
        IF i <= 50 THEN
            v_apiary_id := v_apiary1_id;
            v_hive_type := 'Wielkopolski';
            v_breeder_type := 'GOOD';
            v_breeder_name := v_good_breeders[floor(random()*array_length(v_good_breeders, 1) + 1)::int];
        ELSE
            v_apiary_id := v_apiary2_id;
            v_hive_type := 'Dadant';
            v_breeder_type := 'BAD';
            v_breeder_name := v_bad_breeders[floor(random()*array_length(v_bad_breeders, 1) + 1)::int];
        END IF;

        -- Create Hive
        INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
        VALUES (v_hive_id, v_apiary_id, to_char(i, 'FM000'), v_hive_type, 'mesh', '2022-03-01', NULL);

        -- 6. QUEENS LOOP (History vs Current)
        -- We loop twice: 1=Old Queen (2022), 2=Current Queen (2024)
        FOR y IN 1..2 LOOP
            v_queen_id := uuid_generate_v4();

            IF y = 1 THEN
                -- Historical
                v_year := 2022;
                v_status := 'DECEASED';
            ELSE
                -- Current
                v_year := 2024;
                v_status := 'ACTIVE';
            END IF;

            INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
            VALUES (v_queen_id, v_user_id, v_hive_id, v_year,
                    (CASE WHEN v_year=2022 THEN 'YEL-' ELSE 'GRN-' END) || to_char(i, 'FM000'),
                    (CASE WHEN v_breeder_type='GOOD' THEN 'Carnica' ELSE 'Buckfast' END),
                    v_breeder_name,
                    v_status::queen_status_type);

            -- Update Hive if Current
            IF v_status = 'ACTIVE' THEN
                UPDATE hives SET current_queen_id = v_queen_id WHERE id = v_hive_id;
            END IF;

            -- 7. INSPECTIONS LOOP (Years)
            -- If Old Queen: Inspections in 2022, 2023
            -- If Current Queen: Inspections in 2024, 2025
            DECLARE
                v_start_year integer := v_year;
                v_end_year integer := v_year + 1;
                v_loop_year integer;
            BEGIN
                FOR v_loop_year IN v_start_year..v_end_year LOOP
                    -- Weekly from April 1 to Sept 30
                    FOR d IN SELECT generate_series(
                        (v_loop_year || '-04-01')::date,
                        (v_loop_year || '-09-30')::date,
                        '7 days'::interval)
                    LOOP
                        -- DATA RANDOMIZATION

                        -- Mood
                        IF v_breeder_type = 'GOOD' THEN
                            IF random() < 0.9 THEN v_mood := 'CALM'; ELSE v_mood := 'AGGRESSIVE'; END IF;
                        ELSE
                            IF random() < 0.2 THEN v_mood := 'CALM'; ELSE v_mood := 'AGGRESSIVE'; END IF;
                        END IF;

                        -- Strength (Spring=Strong, Autumn=Medium)
                        -- Month < 7 (July) -> Strong
                        IF extract(month from d) < 7 THEN v_strength := 'STRONG'; ELSE v_strength := 'MEDIUM'; END IF;

                        -- Weather
                        v_weather := v_weather_options[floor(random()*array_length(v_weather_options, 1) + 1)::int];

                        -- Laying Pattern
                        IF random() < 0.9 THEN v_laying := 'SOLID'; ELSE v_laying := 'SPOTTY'; END IF;

                        -- Treatment (Every ~12th)
                        v_counter := v_counter + 1;
                        v_treatment := NULL;
                        IF v_counter % 12 = 0 THEN v_treatment := 'Apiwarol'; END IF;

                        -- INSERT INSPECTION
                        INSERT INTO inspections (
                            id, hive_id, queen_id, inspection_date,
                            mood, colony_strength, weather_condition, laying_pattern,
                            pests_detected, treatment_applied, user_id
                        )
                        VALUES (
                            uuid_generate_v4(), v_hive_id, v_queen_id, (d + time '10:00:00'),
                            v_mood::mood_type,
                            v_strength::colony_strength_type,
                            v_weather::weather_condition_type,
                            v_laying::laying_pattern_type,
                            '{}', v_treatment, v_user_id
                        );

                    END LOOP; -- Date Loop
                END LOOP; -- Year Loop
            END;

        END LOOP; -- Queen Loop

    END LOOP; -- Hive Loop

    -- Inventory skipped to prevent schema errors.
END $$;
