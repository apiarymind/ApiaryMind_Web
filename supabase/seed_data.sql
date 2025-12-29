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
    -- We perform simple INSERTs. If duplicates exist by ID, it will error, but since we generate random IDs,
    -- it should be fine for seeding. If strict idempotency was needed, we'd check by name.
    INSERT INTO medications_global (id, name, active_substance, withdrawal_period_days)
    VALUES
        (uuid_generate_v4(), 'Apiwarol', 'Amitraz', 2),
        (uuid_generate_v4(), 'Apiguard', 'Thymol', 0),
        (uuid_generate_v4(), 'Bayvarol', 'Flumethrin', 0);

    -- Step 2: Create Test Apiary
    v_apiary_id := uuid_generate_v4();
    -- Use 'STATIONARY' to match constraint
    INSERT INTO apiaries (id, owner_id, name, location_geo, type, is_deleted)
    VALUES (v_apiary_id, v_user_id, 'Poligon Testowy AI', '52.2297,21.0122', 'STATIONARY', false);

    -- Step 3: Scenario A - The "Angel" Lineage
    v_hive1_id := uuid_generate_v4();

    -- Create Hive #001 (initially no current queen)
    INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
    VALUES (v_hive1_id, v_apiary_id, '001', 'Dadant', 'mesh', '2022-04-01', NULL);

    -- Queen 1 (Old): "GRN-01" (Year 2022) - Status MUST be 'Active'
    v_queen1_id := uuid_generate_v4();
    INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
    VALUES (v_queen1_id, v_user_id, v_hive1_id, 2022, 'GRN-01', 'Carnica', 'Breeder A', 'Active');

    -- Inspections for Queen 1: 10 total (9 CALM, 1 AGGRESSIVE)
    FOR i IN 1..9 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive1_id, v_queen1_id, (format('2022-05-%s 10:00:00', 10+i)::timestamp), 'CALM', 'STRONG', '{}', v_user_id);
    END LOOP;

    -- 1 AGGRESSIVE (replacing 'NERVOUS' which is invalid)
    INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
    VALUES (uuid_generate_v4(), v_hive1_id, v_queen1_id, '2023-05-01 10:00:00', 'AGGRESSIVE', 'STRONG', '{}', v_user_id);

    -- Queen 2 (Current): "BLU-01" (Year 2024) - Status 'Active'
    v_queen2_id := uuid_generate_v4();
    INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
    VALUES (v_queen2_id, v_user_id, v_hive1_id, 2024, 'BLU-01', 'Carnica', 'Breeder A', 'Active');

    -- Update Hive #001 with current queen
    UPDATE hives SET current_queen_id = v_queen2_id WHERE id = v_hive1_id;

    -- Inspections for Queen 2: 5 total (5 CALM)
    FOR i IN 1..4 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive1_id, v_queen2_id, (format('2024-06-%s 10:00:00', 10+i)::timestamp), 'CALM', 'STRONG', '{}', v_user_id);
    END LOOP;

    -- 5th Inspection (Latest) - Medication Check
    INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, treatment_applied, user_id)
    VALUES (uuid_generate_v4(), v_hive1_id, v_queen2_id, NOW(), 'CALM', 'STRONG', '{}', 'Apiwarol', v_user_id);


    -- Step 4: Scenario B - The "Demon" Lineage
    v_hive2_id := uuid_generate_v4();

    -- Create Hive #002
    INSERT INTO hives (id, apiary_id, hive_number, type, bottom_board_type, installation_date, current_queen_id)
    VALUES (v_hive2_id, v_apiary_id, '002', 'Warszawski', 'solid', '2023-04-01', NULL);

    -- Queen 3 (Old): "YEL-66" (Year 2023) - Status 'Active'
    v_queen3_id := uuid_generate_v4();
    INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
    VALUES (v_queen3_id, v_user_id, v_hive2_id, 2023, 'YEL-66', 'Buckfast', 'Breeder B', 'Active');

    -- Inspections for Queen 3: 10 total (8 AGGRESSIVE, 2 CALM)
    -- 8 AGGRESSIVE
    FOR i IN 1..8 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive2_id, v_queen3_id, (format('2023-06-%s 10:00:00', 10+i)::timestamp), 'AGGRESSIVE', 'MODERATE', '{}', v_user_id);
    END LOOP;
    -- 2 CALM
    FOR i IN 1..2 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive2_id, v_queen3_id, (format('2023-07-%s 10:00:00', 10+i)::timestamp), 'CALM', 'MODERATE', '{}', v_user_id);
    END LOOP;

    -- Queen 4 (Current): "RED-666" (Year 2025) - Status 'Active'
    v_queen4_id := uuid_generate_v4();
    INSERT INTO queens (id, owner_id, hive_id, year, marking_code, lineage, breeder_name, status)
    VALUES (v_queen4_id, v_user_id, v_hive2_id, 2025, 'RED-666', 'Buckfast', 'Breeder B', 'Active');

    -- Update Hive #002 with current queen
    UPDATE hives SET current_queen_id = v_queen4_id WHERE id = v_hive2_id;

    -- Inspections for Queen 4: 5 total (5 AGGRESSIVE), Strength WEAK
    FOR i IN 1..5 LOOP
        INSERT INTO inspections (id, hive_id, queen_id, inspection_date, mood, colony_strength, pests_detected, user_id)
        VALUES (uuid_generate_v4(), v_hive2_id, v_queen4_id, (format('2025-05-%s 10:00:00', 10+i)::timestamp), 'AGGRESSIVE', 'WEAK', '{}', v_user_id);
    END LOOP;

END $$;
