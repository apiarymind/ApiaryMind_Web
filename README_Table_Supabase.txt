| table_name          | column_name           | data_type                | is_nullable | column_default               |
| ------------------- | --------------------- | ------------------------ | ----------- | ---------------------------- |
| apiaries            | id                    | uuid                     | NO          | uuid_generate_v4()           |
| apiaries            | owner_id              | uuid                     | YES         | null                         |
| apiaries            | name                  | text                     | NO          | null                         |
| apiaries            | location_geo          | text                     | YES         | null                         |
| apiaries            | type                  | text                     | YES         | null                         |
| apiaries            | is_deleted            | boolean                  | YES         | false                        |
| apiary_forage_flows | id                    | uuid                     | NO          | gen_random_uuid()            |
| apiary_forage_flows | apiary_id             | uuid                     | YES         | null                         |
| apiary_forage_flows | forage_type_id        | uuid                     | YES         | null                         |
| apiary_forage_flows | start_date            | date                     | NO          | null                         |
| apiary_forage_flows | end_date              | date                     | YES         | null                         |
| apiary_forage_flows | flow_intensity        | text                     | YES         | null                         |
| apiary_forage_flows | is_forecasted         | boolean                  | YES         | false                        |
| apiary_forage_flows | created_at            | timestamp with time zone | YES         | now()                        |
| apiary_tasks        | id                    | uuid                     | NO          | gen_random_uuid()            |
| apiary_tasks        | user_id               | uuid                     | NO          | null                         |
| apiary_tasks        | hive_id               | uuid                     | YES         | null                         |
| apiary_tasks        | source_inspection_id  | uuid                     | YES         | null                         |
| apiary_tasks        | task_description      | text                     | NO          | null                         |
| apiary_tasks        | due_date              | date                     | YES         | null                         |
| apiary_tasks        | priority              | text                     | YES         | 'normal'::text               |
| apiary_tasks        | status                | text                     | YES         | 'pending'::text              |
| apiary_tasks        | created_at            | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| forage_types        | id                    | uuid                     | NO          | gen_random_uuid()            |
| forage_types        | name                  | text                     | NO          | null                         |
| forage_types        | description           | text                     | YES         | null                         |
| forage_types        | typical_start_month   | integer                  | YES         | null                         |
| forage_types        | typical_end_month     | integer                  | YES         | null                         |
| forage_types        | nectar_potential      | integer                  | YES         | 0                            |
| forage_types        | pollen_potential      | integer                  | YES         | 0                            |
| forage_types        | image_url             | text                     | YES         | null                         |
| hive_types          | id                    | uuid                     | NO          | gen_random_uuid()            |
| hive_types          | translation_key       | character varying        | NO          | null                         |
| hive_types          | default_name          | character varying        | NO          | null                         |
| hive_types          | construction_type     | character varying        | NO          | null                         |
| hive_types          | primary_countries     | ARRAY                    | YES         | '{}'::text[]                 |
| hive_types          | is_global             | boolean                  | YES         | false                        |
| hive_types          | dimensions_metadata   | jsonb                    | YES         | '{}'::jsonb                  |
| hive_types          | created_at            | timestamp with time zone | YES         | now()                        |
| hive_types          | updated_at            | timestamp with time zone | YES         | now()                        |
| hives               | id                    | uuid                     | NO          | uuid_generate_v4()           |
| hives               | apiary_id             | uuid                     | YES         | null                         |
| hives               | hive_number           | text                     | NO          | null                         |
| hives               | type                  | text                     | YES         | null                         |
| hives               | bottom_board_type     | text                     | YES         | null                         |
| hives               | installation_date     | date                     | YES         | null                         |
| hives               | current_queen_id      | uuid                     | YES         | null                         |
| inspections         | id                    | uuid                     | NO          | uuid_generate_v4()           |
| inspections         | hive_id               | uuid                     | YES         | null                         |
| inspections         | queen_id              | uuid                     | YES         | null                         |
| inspections         | inspection_date       | timestamp with time zone | YES         | now()                        |
| inspections         | temperature           | integer                  | YES         | null                         |
| inspections         | weather_condition     | USER-DEFINED             | YES         | null                         |
| inspections         | colony_strength       | USER-DEFINED             | YES         | null                         |
| inspections         | mood                  | USER-DEFINED             | YES         | null                         |
| inspections         | brood_frames_count    | integer                  | YES         | null                         |
| inspections         | swarming_mood         | boolean                  | YES         | false                        |
| inspections         | swarming_date         | date                     | YES         | null                         |
| inspections         | is_queen_seen         | boolean                  | YES         | false                        |
| inspections         | is_queen_marked       | boolean                  | YES         | false                        |
| inspections         | laying_pattern        | USER-DEFINED             | YES         | null                         |
| inspections         | honey_supers_count    | integer                  | YES         | 0                            |
| inspections         | half_supers_count     | integer                  | YES         | 0                            |
| inspections         | frames_sealed_percent | integer                  | YES         | 0                            |
| inspections         | pests_detected        | ARRAY                    | YES         | null                         |
| inspections         | treatment_applied     | text                     | YES         | null                         |
| inspections         | next_visit_tasks      | ARRAY                    | YES         | null                         |
| inspections         | notes                 | text                     | YES         | null                         |
| inspections         | user_id               | uuid                     | YES         | null                         |
| work_logs           | id                    | uuid                     | NO          | gen_random_uuid()            |
| work_logs           | user_id               | uuid                     | YES         | null                         |
| work_logs           | task_id               | uuid                     | YES         | null                         |
| work_logs           | apiary_id             | uuid                     | YES         | null                         |
| work_logs           | start_time            | timestamp with time zone | YES         | null                         |
| work_logs           | end_time              | timestamp with time zone | YES         | null                         |
| work_logs           | duration_minutes      | integer                  | YES         | null                         |
| work_logs           | notes                 | text                     | YES         | null                         |
| work_logs           | verified_by           | uuid                     | YES         | null                         |
| table_name         | column_name            | data_type                | is_nullable | column_default              |
| ------------------ | ---------------------- | ------------------------ | ----------- | --------------------------- |
| breeding_batches   | id                     | uuid                     | NO          | uuid_generate_v4()          |
| breeding_batches   | breeder_id             | uuid                     | YES         | null                        |
| breeding_batches   | batch_code             | text                     | NO          | null                        |
| breeding_batches   | lineage                | text                     | NO          | null                        |
| breeding_batches   | start_date             | date                     | YES         | CURRENT_DATE                |
| breeding_batches   | expected_hatching_date | date                     | YES         | null                        |
| breeding_batches   | larvae_count           | integer                  | YES         | null                        |
| breeding_batches   | accepted_count         | integer                  | YES         | null                        |
| breeding_batches   | status                 | text                     | YES         | null                        |
| breeding_manifests | id                     | uuid                     | NO          | gen_random_uuid()           |
| breeding_manifests | user_id                | uuid                     | YES         | null                        |
| breeding_manifests | series_id              | uuid                     | YES         | null                        |
| breeding_manifests | quantity               | integer                  | YES         | null                        |
| breeding_manifests | destination_type       | character varying        | YES         | null                        |
| breeding_manifests | generated_at           | timestamp with time zone | YES         | now()                       |
| breeding_manifests | qr_code_payload        | text                     | YES         | null                        |
| breeding_mothers   | id                     | uuid                     | NO          | gen_random_uuid()           |
| breeding_mothers   | created_at             | timestamp with time zone | YES         | now()                       |
| breeding_mothers   | user_id                | uuid                     | NO          | null                        |
| breeding_mothers   | name                   | text                     | NO          | null                        |
| breeding_mothers   | breed                  | text                     | YES         | null                        |
| breeding_mothers   | line                   | text                     | YES         | null                        |
| breeding_mothers   | insemination_method    | text                     | YES         | null                        |
| breeding_mothers   | year                   | integer                  | YES         | null                        |
| breeding_mothers   | is_active              | boolean                  | YES         | true                        |
| breeding_mothers   | notes                  | text                     | YES         | null                        |
| breeding_mothers   | mother_ref_number      | text                     | YES         | null                        |
| breeding_mothers   | father_line            | text                     | YES         | null                        |
| breeding_mothers   | breeder_wni            | text                     | YES         | null                        |
| breeding_mothers   | certificate_number     | text                     | YES         | null                        |
| breeding_series    | id                     | uuid                     | NO          | gen_random_uuid()           |
| breeding_series    | user_id                | uuid                     | YES         | null                        |
| breeding_series    | name                   | character varying        | YES         | null                        |
| breeding_series    | mother_queen_id        | uuid                     | YES         | null                        |
| breeding_series    | start_date             | date                     | NO          | null                        |
| breeding_series    | larvae_count           | integer                  | YES         | 0                           |
| breeding_series    | accepted_count         | integer                  | YES         | 0                           |
| breeding_series    | hatched_count          | integer                  | YES         | 0                           |
| breeding_series    | status                 | character varying        | YES         | 'ACTIVE'::character varying |
| breeding_series    | created_at             | timestamp with time zone | YES         | now()                       |
| breeding_series    | mother_id              | uuid                     | YES         | null                        |
| breeding_tasks     | id                     | uuid                     | NO          | gen_random_uuid()           |
| breeding_tasks     | created_at             | timestamp with time zone | YES         | now()                       |
| breeding_tasks     | user_id                | uuid                     | NO          | null                        |
| breeding_tasks     | breeding_series_id     | uuid                     | YES         | null                        |
| breeding_tasks     | task_name              | text                     | NO          | null                        |
| breeding_tasks     | planned_date           | timestamp with time zone | NO          | null                        |
| breeding_tasks     | is_completed           | boolean                  | YES         | false                       |
| breeding_tasks     | notes                  | text                     | YES         | null                        |
| mating_nucs        | id                     | uuid                     | NO          | gen_random_uuid()           |
| mating_nucs        | user_id                | uuid                     | YES         | null                        |
| mating_nucs        | identifier             | character varying        | YES         | null                        |
| mating_nucs        | status                 | character varying        | YES         | 'EMPTY'::character varying  |
| mating_nucs        | current_series_id      | uuid                     | YES         | null                        |
| mating_nucs        | queen_year_color       | character varying        | YES         | null                        |
| mating_nucs        | updated_at             | timestamp with time zone | YES         | now()                       |
| queen_bank         | id                     | uuid                     | NO          | gen_random_uuid()           |
| queen_bank         | user_id                | uuid                     | YES         | null                        |
| queen_bank         | series_id              | uuid                     | YES         | null                        |
| queen_bank         | quantity               | integer                  | YES         | 0                           |
| queen_bank         | status                 | character varying        | YES         | 'READY'::character varying  |
| queens             | id                     | uuid                     | NO          | uuid_generate_v4()          |
| queens             | owner_id               | uuid                     | YES         | null                        |
| queens             | hive_id                | uuid                     | YES         | null                        |
| queens             | year                   | integer                  | NO          | null                        |
| queens             | marking_code           | text                     | YES         | null                        |
| queens             | lineage                | text                     | YES         | null                        |
| queens             | breeder_name           | text                     | YES         | null                        |
| queens             | is_clipped             | boolean                  | YES         | false                       |
| queens             | status                 | USER-DEFINED             | YES         | 'ACTIVE'::queen_status_type |
| queens             | created_at             | timestamp with time zone | YES         | now()                       |
| queens             | batch_id               | uuid                     | YES         | null                        |
| queens             | original_breeder_id    | uuid                     | YES         | null                        |
| table_name          | column_name           | data_type                | is_nullable | column_default                  |
| ------------------- | --------------------- | ------------------------ | ----------- | ------------------------------- |
| equipment_inventory | id                    | uuid                     | NO          | gen_random_uuid()               |
| equipment_inventory | user_id               | uuid                     | NO          | null                            |
| equipment_inventory | hive_type_id          | uuid                     | YES         | null                            |
| equipment_inventory | category              | USER-DEFINED             | NO          | null                            |
| equipment_inventory | material              | USER-DEFINED             | NO          | 'WOOD_INSULATED'::hive_material |
| equipment_inventory | quantity              | integer                  | NO          | 0                               |
| equipment_inventory | is_assembled_set      | boolean                  | YES         | false                           |
| equipment_inventory | sanitary_status       | USER-DEFINED             | NO          | 'NEW'::sanitary_status          |
| equipment_inventory | notes                 | text                     | YES         | null                            |
| equipment_inventory | updated_at            | timestamp with time zone | YES         | now()                           |
| financial_records   | id                    | uuid                     | NO          | gen_random_uuid()               |
| financial_records   | owner_id              | uuid                     | YES         | null                            |
| financial_records   | transaction_type      | text                     | YES         | null                            |
| financial_records   | amount                | numeric                  | YES         | null                            |
| financial_records   | currency              | text                     | YES         | 'PLN'::text                     |
| financial_records   | category              | text                     | YES         | null                            |
| financial_records   | description           | text                     | YES         | null                            |
| financial_records   | transaction_date      | date                     | YES         | CURRENT_DATE                    |
| financial_records   | created_at            | timestamp with time zone | YES         | now()                           |
| harvest_log         | id                    | uuid                     | NO          | gen_random_uuid()               |
| harvest_log         | apiary_id             | uuid                     | YES         | null                            |
| harvest_log         | harvest_date          | date                     | NO          | null                            |
| harvest_log         | honey_type            | text                     | NO          | null                            |
| harvest_log         | total_kg              | numeric                  | YES         | null                            |
| harvest_log         | batch_code            | text                     | YES         | null                            |
| harvest_log         | created_at            | timestamp with time zone | YES         | now()                           |
| inventory           | id                    | uuid                     | NO          | uuid_generate_v4()              |
| inventory           | owner_id              | uuid                     | YES         | null                            |
| inventory           | item_name             | text                     | NO          | null                            |
| inventory           | category              | text                     | YES         | null                            |
| inventory           | quantity              | numeric                  | YES         | 0                               |
| inventory           | unit_price            | numeric                  | YES         | 0.00                            |
| inventory           | unit                  | text                     | YES         | 'szt'::text                     |
| inventory           | is_medication         | boolean                  | YES         | false                           |
| inventory           | medication_global_id  | uuid                     | YES         | null                            |
| inventory           | batch_number          | text                     | YES         | null                            |
| inventory           | expiry_date           | date                     | YES         | null                            |
| inventory           | withdrawal_days       | integer                  | YES         | null                            |
| inventory           | removal_days          | integer                  | YES         | null                            |
| inventory           | active_substance      | text                     | YES         | null                            |
| inventory           | administration_method | text                     | YES         | null                            |
| inventory           | description           | text                     | YES         | null                            |
| medications_global  | id                    | uuid                     | NO          | gen_random_uuid()               |
| medications_global  | name                  | text                     | NO          | null                            |
| medications_global  | active_substance      | text                     | YES         | null                            |
| medications_global  | withdrawal_days       | integer                  | YES         | 0                               |
| medications_global  | description           | text                     | YES         | null                            |
| medications_global  | created_at            | timestamp with time zone | YES         | now()                           |
| medications_global  | removal_days          | integer                  | YES         | null                            |
| medications_global  | administration_method | text                     | YES         | null                            |
| medications_global  | min_temp_celsius      | integer                  | YES         | null                            |
| medications_global  | max_temp_celsius      | integer                  | YES         | null                            |
| medications_global  | dosage                | text                     | YES         | null                            |
| medications_global  | composition           | text                     | YES         | null                            |
| medications_global  | contraindications     | text                     | YES         | null                            |
| medications_global  | side_effects          | text                     | YES         | null                            |
| medications_global  | leaflet_url           | text                     | YES         | null                            |
| products            | id                    | uuid                     | NO          | uuid_generate_v4()              |
| products            | owner_id              | uuid                     | YES         | null                            |
| products            | name                  | text                     | NO          | null                            |
| products            | price                 | numeric                  | NO          | null                            |
| products            | stock                 | integer                  | YES         | 0                               |
| products            | batch_code            | text                     | YES         | null                            |
| sales_log           | id                    | uuid                     | NO          | uuid_generate_v4()              |
| sales_log           | product_id            | uuid                     | YES         | null                            |
| sales_log           | quantity_sold         | integer                  | NO          | null                            |
| sales_log           | sale_date             | timestamp with time zone | YES         | now()                           |
| sales_log           | revenue               | numeric                  | NO          | null                            |
| sales_log           | owner_id              | uuid                     | YES         | null                            |
| treatments_log      | id                    | uuid                     | NO          | uuid_generate_v4()              |
| treatments_log      | hive_id               | uuid                     | YES         | null                            |
| treatments_log      | medication_name       | text                     | NO          | null                            |
| treatments_log      | application_date      | date                     | NO          | null                            |
| treatments_log      | withdrawal_end_date   | date                     | NO          | null                            |
| treatments_log      | removal_date          | timestamp with time zone | YES         | null                            |
| treatments_log      | is_removed            | boolean                  | YES         | false                           |
| treatments_log      | notes                 | text                     | YES         | null                            |
| treatments_log      | batch_number          | text                     | YES         | null                            |
| treatments_log      | quantity_used         | text                     | YES         | null                            |
| treatments_log      | administration_method | text                     | YES         | null                            |
| treatments_log      | administered_by       | text                     | YES         | null                            |
| table_name           | column_name            | data_type                   | is_nullable | column_default                    |
| -------------------- | ---------------------- | --------------------------- | ----------- | --------------------------------- |
| association_finances | id                     | uuid                        | NO          | uuid_generate_v4()                |
| association_finances | association_id         | uuid                        | YES         | null                              |
| association_finances | title                  | text                        | NO          | null                              |
| association_finances | amount                 | numeric                     | NO          | null                              |
| association_finances | transaction_date       | date                        | YES         | CURRENT_DATE                      |
| association_finances | type                   | text                        | YES         | null                              |
| association_finances | description            | text                        | YES         | null                              |
| association_finances | created_by             | uuid                        | YES         | null                              |
| association_members  | id                     | uuid                        | NO          | uuid_generate_v4()                |
| association_members  | association_id         | uuid                        | YES         | null                              |
| association_members  | user_id                | uuid                        | YES         | null                              |
| association_members  | role                   | USER-DEFINED                | YES         | 'MEMBER'::association_member_role |
| association_members  | joined_at              | timestamp without time zone | YES         | now()                             |
| association_members  | notes                  | text                        | YES         | null                              |
| associations         | id                     | uuid                        | NO          | uuid_generate_v4()                |
| associations         | name                   | text                        | NO          | null                              |
| associations         | region                 | text                        | YES         | null                              |
| associations         | is_blocked             | boolean                     | YES         | false                             |
| associations         | created_at             | timestamp with time zone    | YES         | now()                             |
| beta_signups         | id                     | uuid                        | NO          | gen_random_uuid()                 |
| beta_signups         | created_at             | timestamp with time zone    | NO          | timezone('utc'::text, now())      |
| beta_signups         | first_name             | text                        | NO          | null                              |
| beta_signups         | last_name              | text                        | NO          | null                              |
| beta_signups         | email                  | text                        | NO          | null                              |
| beta_signups         | phone_model            | text                        | NO          | null                              |
| beta_signups         | hive_count             | integer                     | NO          | null                              |
| beta_signups         | voivodeship            | text                        | NO          | null                              |
| beta_signups         | is_breeder             | boolean                     | YES         | false                             |
| beta_signups         | has_employees          | boolean                     | YES         | false                             |
| beta_signups         | status                 | text                        | YES         | 'pending'::text                   |
| beta_signups         | is_active_tester       | boolean                     | YES         | false                             |
| business_teams       | id                     | uuid                        | NO          | uuid_generate_v4()                |
| business_teams       | employer_id            | uuid                        | YES         | null                              |
| business_teams       | employee_id            | uuid                        | YES         | null                              |
| business_teams       | role                   | USER-DEFINED                | YES         | 'EMPLOYEE'::business_role_type    |
| business_teams       | created_at             | timestamp without time zone | YES         | now()                             |
| profiles             | id                     | uuid                        | NO          | null                              |
| profiles             | email                  | text                        | YES         | null                              |
| profiles             | full_name              | text                        | YES         | null                              |
| profiles             | rhd_number             | text                        | YES         | null                              |
| profiles             | system_role            | USER-DEFINED                | YES         | 'USER'::app_role                  |
| profiles             | subscription_plan      | USER-DEFINED                | YES         | 'FREE'::subscription_plan_type    |
| profiles             | eyes_coin_balance      | integer                     | YES         | 0                                 |
| profiles             | created_at             | timestamp with time zone    | YES         | now()                             |
| profiles             | updated_at             | timestamp with time zone    | YES         | now()                             |
| profiles             | wni_number             | text                        | YES         | null                              |
| profiles             | kchz_number            | text                        | YES         | null                              |
| profiles             | shp_number             | text                        | YES         | null                              |
| profiles             | arimr_ep_number        | text                        | YES         | null                              |
| profiles             | avatar_url             | text                        | YES         | null                              |
| profiles             | first_name             | text                        | YES         | null                              |
| profiles             | last_name              | text                        | YES         | null                              |
| profiles             | phone_number           | text                        | YES         | null                              |
| profiles             | company_name           | text                        | YES         | null                              |
| profiles             | description            | text                        | YES         | null                              |
| profiles             | voivodeship            | text                        | YES         | null                              |
| profiles             | city                   | text                        | YES         | null                              |
| profiles             | delivery_info          | text                        | YES         | null                              |
| profiles             | website_url            | text                        | YES         | null                              |
| profiles             | facebook_link          | text                        | YES         | null                              |
| profiles             | allegro_link           | text                        | YES         | null                              |
| profiles             | olx_link               | text                        | YES         | null                              |
| profiles             | nip                    | text                        | YES         | null                              |
| profiles             | is_beta_tester         | boolean                     | YES         | false                             |
| profiles             | beta_access_expires_at | timestamp with time zone    | YES         | null                              |
| team_invitations     | id                     | uuid                        | NO          | gen_random_uuid()                 |
| team_invitations     | token                  | text                        | NO          | null                              |
| team_invitations     | email                  | text                        | NO          | null                              |
| team_invitations     | employer_id            | uuid                        | NO          | null                              |
| team_invitations     | role                   | USER-DEFINED                | NO          | 'EMPLOYEE'::business_role_type    |
| team_invitations     | expires_at             | timestamp with time zone    | NO          | null                              |
| team_invitations     | created_at             | timestamp with time zone    | YES         | now()                             |
| table_name             | column_name    | data_type                | is_nullable | column_default                      |
| ---------------------- | -------------- | ------------------------ | ----------- | ----------------------------------- |
| app_settings           | id             | uuid                     | NO          | gen_random_uuid()                   |
| app_settings           | key            | text                     | NO          | null                                |
| app_settings           | value          | jsonb                    | NO          | null                                |
| app_settings           | description    | text                     | YES         | null                                |
| app_settings           | type           | text                     | YES         | null                                |
| app_settings           | created_at     | timestamp with time zone | YES         | now()                               |
| app_settings           | updated_at     | timestamp with time zone | YES         | now()                               |
| survey_questions       | id             | uuid                     | NO          | gen_random_uuid()                   |
| survey_questions       | survey_id      | integer                  | YES         | null                                |
| survey_questions       | question_text  | text                     | NO          | null                                |
| survey_questions       | question_type  | text                     | NO          | null                                |
| survey_questions       | options        | jsonb                    | YES         | null                                |
| survey_questions       | required       | boolean                  | YES         | false                               |
| survey_questions       | order_index    | integer                  | NO          | 0                                   |
| survey_questions       | created_at     | timestamp with time zone | YES         | now()                               |
| survey_responses       | id             | uuid                     | NO          | gen_random_uuid()                   |
| survey_responses       | survey_id      | integer                  | YES         | null                                |
| survey_responses       | question_id    | uuid                     | YES         | null                                |
| survey_responses       | user_id        | uuid                     | YES         | null                                |
| survey_responses       | response_text  | text                     | YES         | null                                |
| survey_responses       | response_json  | jsonb                    | YES         | null                                |
| survey_responses       | submitted_at   | timestamp with time zone | YES         | now()                               |
| survey_responses       | session_id     | text                     | YES         | null                                |
| survey_targets         | id             | uuid                     | NO          | gen_random_uuid()                   |
| survey_targets         | survey_id      | integer                  | YES         | null                                |
| survey_targets         | target_type    | text                     | NO          | null                                |
| survey_targets         | association_id | uuid                     | YES         | null                                |
| survey_targets         | created_at     | timestamp with time zone | YES         | now()                               |
| surveys                | id             | integer                  | NO          | nextval('surveys_id_seq'::regclass) |
| surveys                | title          | text                     | NO          | null                                |
| surveys                | description    | text                     | YES         | null                                |
| surveys                | is_active      | boolean                  | YES         | true                                |
| surveys                | is_built_in    | boolean                  | YES         | false                               |
| surveys                | created_by     | uuid                     | YES         | null                                |
| surveys                | created_at     | timestamp with time zone | YES         | now()                               |
| surveys                | display_type   | text                     | YES         | 'banner'::text                      |
| view_verified_breeders | breeder_id     | uuid                     | YES         | null                                |
| view_verified_breeders | first_name     | text                     | YES         | null                                |
| view_verified_breeders | last_name      | text                     | YES         | null                                |
| view_verified_breeders | company_name   | text                     | YES         | null                                |
| view_verified_breeders | avatar_url     | text                     | YES         | null                                |
| view_verified_breeders | phone_number   | text                     | YES         | null                                |
| view_verified_breeders | city           | text                     | YES         | null                                |
| view_verified_breeders | voivodeship    | text                     | YES         | null                                |
| view_verified_breeders | description    | text                     | YES         | null                                |
| view_verified_breeders | delivery_info  | text                     | YES         | null                                |
| view_verified_breeders | website_url    | text                     | YES         | null                                |
| view_verified_breeders | facebook_link  | text                     | YES         | null                                |
| view_verified_breeders | allegro_link   | text                     | YES         | null                                |
| view_verified_breeders | olx_link       | text                     | YES         | null                                |
| view_verified_breeders | nip            | text                     | YES         | null                                |
| view_verified_breeders | rhd_number     | text                     | YES         | null                                |
| view_verified_breeders | kchz_number    | text                     | YES         | null                                |
