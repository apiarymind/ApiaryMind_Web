DO $$
DECLARE
    v_user_id uuid;
    v_apiary_id uuid;
    v_hive1_id uuid;
    v_hive2_id uuid;
    v_queen1_id uuid;
    v_queen2_id uuid;
    v_queen3_id uuid;
    v_queen4_id uuid;
    i integer;
BEGIN
    -- 0. Get User (Owner/Inspector)
    SELECT id INTO v_user_id FROM profiles LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No profile found in profiles table. Please create a user first.';
    END IF;

    -- Step 1: Global Medications
    -- Using strict insert as requested
    INSERT INTO medications_global (id, name, active_substance, withdrawal_period_days)
    VALUES
        (uuid_generate_v4(), 'Apiwarol', 'Amitraz', 2),
        (uuid_generate_v4(), 'Apiguard', 'Thymol', 0),
        (uuid_generate_v4(), 'Bayvarol', 'Flumethrin', 0);

    -- Step 2: Create Test Apiary
    v_apiary_id := uuid_generate_v4();
    -- Type 'STATIONARY' used as per previous successful constraint resolution
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary_id, v_user_id, 'Poligon Testowy AI', '52.2297,21.0122', 'STATIONARY', false);

    -- Step 3: Scenario A - The "Angel" Lineage (Good Lineage)
    v_hive1_id := uuid_generate_v4();

    -- Create Hive #001 (initially no current queen)
    INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
    VALUES (v_hive1_id, v_apiary_id, '001', 'Dadant', 'mesh', '2022-04-01', NULL);

    -- Old Queen ("GRN-01", 2022): Status 'DECEASED'
    v_queen1_id := uuid_generate_v4();
    INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
    VALUES (v_queen1_id, v_user_id, v_hive1_id, 2022, 'GRN-01', 'Carnica', 'Breeder A', 'DECEASED');

    -- Inspections for Old Queen (Mood 'CALM', Strength 'STRONG')
    FOR i IN 1..10 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive1_id, v_queen1_id, (format('2022-05-%s 10:00:00', 10+i)::timestamp), 'CALM', 'STRONG', '{}', v_user_id);
    END LOOP;

    -- Current Queen ("BLU-01", 2024): Status 'ACTIVE'
    v_queen2_id := uuid_generate_v4();
    INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
    VALUES (v_queen2_id, v_user_id, v_hive1_id, 2024, 'BLU-01', 'Carnica', 'Breeder A', 'ACTIVE');

    -- Update Hive #001 with current queen
    UPDATE hives SET current_queen_id = v_queen2_id WHERE id = v_hive1_id;

    -- Inspections for Current Queen (Mood 'CALM', Strength 'STRONG')
    FOR i IN 1..4 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive1_id, v_queen2_id, (format('2024-06-%s 10:00:00', 10+i)::timestamp), 'CALM', 'STRONG', '{}', v_user_id);
    END LOOP;

    -- Latest Inspection with Medication Check (Step 5 logic included here)
    INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, treatment_applied, user_id)
    VALUES (uuid_generate_v4(), v_hive1_id, v_queen2_id, NOW(), 'CALM', 'STRONG', '{}', 'Apiwarol', v_user_id);


    -- Step 4: Scenario B - The "Demon" Lineage (Aggressive Lineage)
    v_hive2_id := uuid_generate_v4();

    -- Create Hive #002
    INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
    VALUES (v_hive2_id, v_apiary_id, '002', 'Warszawski', 'solid', '2023-04-01', NULL);

    -- Old Queen ("YEL-66", 2023): Status 'DECEASED'
    v_queen3_id := uuid_generate_v4();
    INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
    VALUES (v_queen3_id, v_user_id, v_hive2_id, 2023, 'YEL-66', 'Buckfast', 'Breeder B', 'DECEASED');

    -- Inspections for Old Queen (Mood 'AGGRESSIVE', Strength 'MEDIUM')
    FOR i IN 1..10 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive2_id, v_queen3_id, (format('2023-06-%s 10:00:00', 10+i)::timestamp), 'AGGRESSIVE', 'MEDIUM', '{}', v_user_id);
    END LOOP;

    -- Current Queen ("RED-666", 2025): Status 'ACTIVE'
    v_queen4_id := uuid_generate_v4();
    INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
    VALUES (v_queen4_id, v_user_id, v_hive2_id, 2025, 'RED-666', 'Buckfast', 'Breeder B', 'ACTIVE');

    -- Update Hive #002 with current queen
    UPDATE hives SET current_queen_id = v_queen4_id WHERE id = v_hive2_id;

    -- Inspections for Current Queen (Mood 'AGGRESSIVE', Strength 'WEAK')
    FOR i IN 1..5 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive2_id, v_queen4_id, (format('2025-05-%s 10:00:00', 10+i)::timestamp), 'AGGRESSIVE', 'WEAK', '{}', v_user_id);
    END LOOP;

END $$;
