/**
 * Seed script for hive_types table
 * 
 * This script populates the hive_types table with reference data
 * including localization, construction types, and frame compatibility.
 * 
 * Usage:
 *   npx tsx scripts/seed-hive-types.ts
 * 
 * Or via Supabase CLI:
 *   supabase db reset --seed
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - set via environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Hive Type Data Structure
 */
interface HiveTypeSeed {
  name: string;
  translation_key: string;
  primary_countries: string[]; // ISO 3166-1 alpha-2 codes
  is_global: boolean;
  construction_type: 'VERTICAL' | 'HORIZONTAL' | 'TOP_BAR';
  frame_width_mm?: number;
  frame_height_mm?: number;
  frame_type?: string;
  description?: string;
  notes?: string;
}

/**
 * Comprehensive hive types data
 * Based on popular European, North American, and other international hive types
 */
const hiveTypesData: HiveTypeSeed[] = [
  // ========================================
  // POLAND - Typy uli polskich
  // ========================================
  {
    name: 'Wielkopolski',
    translation_key: 'hive_type_wielkopolski',
    primary_countries: ['PL'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 360,
    frame_height_mm: 260,
    frame_type: 'wielkopolski_standard',
    description: 'Klasiczny polski ul wielkopolski z ramkami 360x260mm. Najpopularniejszy typ ula w Polsce.',
    notes: 'Standardowy ul wielkopolski używany w całej Polsce. Ramki są wymienne z niektórymi wariantami Warmińskiego.'
  },
  {
    name: 'Warmiński',
    translation_key: 'hive_type_warminski',
    primary_countries: ['PL'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 360,
    frame_height_mm: 230,
    frame_type: 'warminski_standard',
    description: 'Ul warmiński z ramkami 360x230mm. Popularny w północnej Polsce.',
    notes: 'Częściowo kompatybilny z ulami wielkopolskimi (ta sama szerokość ramek).'
  },
  {
    name: 'Dadant Blatt',
    translation_key: 'hive_type_dadant_blatt',
    primary_countries: ['PL'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 435,
    frame_height_mm: 300,
    frame_type: 'dadant_blatt_standard',
    description: 'Polska wersja ula Dadant z ramkami 435x300mm.',
    notes: 'Popularny wśród profesjonalnych pszczelarzy. Kompatybilny z międzynarodowym standardem Dadant.'
  },
  {
    name: 'Warszawski Zwykły',
    translation_key: 'hive_type_warszawski_zwykly',
    primary_countries: ['PL'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 240,
    frame_height_mm: 435,
    frame_type: 'warszawski_standard',
    description: 'Ul warszawski zwykły z ramkami wąskowysokimi 240x435mm.',
    notes: 'Stary typ ula, obecnie rzadko używany, ale nadal spotykany w niektórych pasiekach.'
  },
  {
    name: 'Ostrowskiej',
    translation_key: 'hive_type_ostrowskiej',
    primary_countries: ['PL'],
    is_global: false,
    construction_type: 'HORIZONTAL',
    frame_width_mm: 435,
    frame_height_mm: 300,
    frame_type: 'ostrowskiej_standard',
    description: 'Polski ul leżak (horizontalny) z ramkami 435x300mm.',
    notes: 'Typ leżaka, nie wymaga dźwigania korpusów. Popularny dla osób starszych lub z problemami pleców.'
  },
  
  // ========================================
  // GERMANY - Typy uli niemieckich
  // ========================================
  {
    name: 'Zander',
    translation_key: 'hive_type_zander',
    primary_countries: ['DE', 'AT', 'CH'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 420,
    frame_height_mm: 220,
    frame_type: 'zander_standard',
    description: 'Niemiecki ul Zander z ramkami 420x220mm. Popularny w Niemczech, Austrii i Szwajcarii.',
    notes: 'Standardowy ul w niemieckojęzycznych krajach. Niekompatybilny z polskimi standardami.'
  },
  {
    name: 'Deutsch Normalmass (DNM)',
    translation_key: 'hive_type_dnm',
    primary_countries: ['DE', 'AT'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 370,
    frame_height_mm: 223,
    frame_type: 'dnm_standard',
    description: 'Niemiecki standard DNM z ramkami 370x223mm.',
    notes: 'Stary niemiecki standard, obecnie mniej popularny niż Zander.'
  },
  {
    name: 'Segeberger',
    translation_key: 'hive_type_segeberger',
    primary_countries: ['DE'],
    is_global: false,
    construction_type: 'HORIZONTAL',
    frame_width_mm: 370,
    frame_height_mm: 370,
    frame_type: 'segeberger_standard',
    description: 'Niemiecki ul leżak Segeberger z kwadratowymi ramkami 370x370mm.',
    notes: 'Leżak popularny w północnych Niemczech.'
  },
  
  // ========================================
  // USA / INTERNATIONAL - Globalne standardy
  // ========================================
  {
    name: 'Langstroth',
    translation_key: 'hive_type_langstroth',
    primary_countries: ['US', 'CA', 'AU', 'NZ', 'GB', 'IE', 'ZA', 'BR', 'MX', 'AR'],
    is_global: true,
    construction_type: 'VERTICAL',
    frame_width_mm: 448,
    frame_height_mm: 232, // Deep frame (full depth)
    frame_type: 'langstroth_deep',
    description: 'Międzynarodowy standard Langstroth z ramkami 448x232mm (deep). Najpopularniejszy ul na świecie.',
    notes: 'Używany na całym świecie. Występuje w wariantach: Deep (232mm), Medium (159mm), Shallow (108mm). Ramki są wymienne między wariantami (ta sama szerokość).'
  },
  {
    name: 'Langstroth Medium',
    translation_key: 'hive_type_langstroth_medium',
    primary_countries: ['US', 'CA', 'AU', 'NZ', 'GB', 'IE'],
    is_global: true,
    construction_type: 'VERTICAL',
    frame_width_mm: 448,
    frame_height_mm: 159,
    frame_type: 'langstroth_medium',
    description: 'Wariant Langstroth z ramkami medium 448x159mm.',
    notes: 'Lżejszy niż deep, popularny dla korpusów miodnych.'
  },
  {
    name: 'Dadant',
    translation_key: 'hive_type_dadant',
    primary_countries: ['US', 'FR', 'IT', 'ES', 'BE', 'NL', 'PL'],
    is_global: true,
    construction_type: 'VERTICAL',
    frame_width_mm: 435,
    frame_height_mm: 285, // Deep brood frame
    frame_type: 'dadant_deep',
    description: 'Międzynarodowy standard Dadant z ramkami 435x285mm. Popularny w USA i Europie Zachodniej.',
    notes: 'Popularny w USA i Francji. Używany również w Polsce jako "Dadant Blatt". Kompatybilny z polskimi wariantami Dadant.'
  },
  {
    name: 'Dadant-Blatt',
    translation_key: 'hive_type_dadant_blatt_international',
    primary_countries: ['FR', 'BE', 'IT', 'ES'],
    is_global: true,
    construction_type: 'VERTICAL',
    frame_width_mm: 435,
    frame_height_mm: 300,
    frame_type: 'dadant_blatt_international',
    description: 'Europejski wariant Dadant z ramkami 435x300mm.',
    notes: 'Nieznacznie wyższy niż standardowy Dadant. Używany głównie w Europie Zachodniej.'
  },
  
  // ========================================
  // UK / BRITISH STANDARDS
  // ========================================
  {
    name: 'British National',
    translation_key: 'hive_type_british_national',
    primary_countries: ['GB', 'IE'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 460,
    frame_height_mm: 222, // Full depth
    frame_type: 'british_national_standard',
    description: 'Brytyjski standard National z ramkami 460x222mm.',
    notes: 'Najpopularniejszy typ ula w Wielkiej Brytanii i Irlandii.'
  },
  {
    name: 'WBC',
    translation_key: 'hive_type_wbc',
    primary_countries: ['GB'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 460,
    frame_height_mm: 222,
    frame_type: 'wbc_standard',
    description: 'Brytyjski ul WBC (William Broughton Carr) z ramkami 460x222mm.',
    notes: 'Klasyczny brytyjski ul z podwójnymi ścianami. Rzadziej używany niż British National.'
  },
  
  // ========================================
  // FRANCE / FRENCH STANDARDS
  // ========================================
  {
    name: 'Dadant 10',
    translation_key: 'hive_type_dadant_10',
    primary_countries: ['FR', 'BE'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 435,
    frame_height_mm: 300,
    frame_type: 'dadant_10_french',
    description: 'Francuski standard Dadant 10 z ramkami 435x300mm.',
    notes: 'Popularny we Francji i Belgii. Wariant Dadant-Blatt.'
  },
  {
    name: 'Voirnot',
    translation_key: 'hive_type_voirnot',
    primary_countries: ['FR'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 350,
    frame_height_mm: 350,
    frame_type: 'voirnot_standard',
    description: 'Francuski ul Voirnot z kwadratowymi ramkami 350x350mm.',
    notes: 'Popularny we Francji, szczególnie na południu. Kwadratowe ramki.'
  },
  
  // ========================================
  // SCANDINAVIA
  // ========================================
  {
    name: 'Nordic',
    translation_key: 'hive_type_nordic',
    primary_countries: ['SE', 'NO', 'DK', 'FI'],
    is_global: false,
    construction_type: 'VERTICAL',
    frame_width_mm: 370,
    frame_height_mm: 220,
    frame_type: 'nordic_standard',
    description: 'Skandynawski standard Nordic z ramkami 370x220mm.',
    notes: 'Popularny w krajach skandynawskich. Podobny do niemieckiego Zander, ale z innymi wymiarami.'
  },
  
  // ========================================
  // ALTERNATIVE / SPECIAL TYPES
  // ========================================
  {
    name: 'Top Bar Hive (Kenian)',
    translation_key: 'hive_type_top_bar_kenian',
    primary_countries: ['KE', 'TZ', 'ZA', 'US', 'GB'],
    is_global: true,
    construction_type: 'TOP_BAR',
    frame_width_mm: null, // Top bar hives don't use standard frames
    frame_height_mm: null,
    frame_type: 'top_bar',
    description: 'Top bar hive (Kenian style) - ul z listwami u góry zamiast ramek.',
    notes: 'Alternatywny typ ula, popularny w Afryce i wśród pszczelarzy naturalnych. Nie używa standardowych ramek.'
  },
  {
    name: 'Warre',
    translation_key: 'hive_type_warre',
    primary_countries: ['FR', 'US', 'GB', 'CA'],
    is_global: true,
    construction_type: 'VERTICAL',
    frame_width_mm: null, // Warre uses bars, not full frames
    frame_height_mm: 210,
    frame_type: 'warre_bar',
    description: 'Ul Warre (People\'s Hive) - pionowy ul z listwami zamiast ramek.',
    notes: 'Alternatywny typ ula, popularny wśród pszczelarzy naturalnych. Używa listewek zamiast pełnych ramek.'
  },
  {
    name: 'Layens',
    translation_key: 'hive_type_layens',
    primary_countries: ['FR', 'ES', 'IT'],
    is_global: false,
    construction_type: 'HORIZONTAL',
    frame_width_mm: 340,
    frame_height_mm: 300,
    frame_type: 'layens_standard',
    description: 'Francuski ul leżak Layens z ramkami 340x300mm.',
    notes: 'Popularny leżak we Francji, Hiszpanii i Włoszech. Nie wymaga dźwigania korpusów.'
  }
];

/**
 * Helper function to determine construction type from name
 * (already done in data, but kept for validation)
 */
function inferConstructionType(name: string): 'VERTICAL' | 'HORIZONTAL' | 'TOP_BAR' {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('leżak') || lowerName.includes('layens') || lowerName.includes('segeberger') || lowerName.includes('horizontal') || lowerName.includes('ostrowskiej')) {
    return 'HORIZONTAL';
  }
  if (lowerName.includes('top bar') || lowerName.includes('kenian') || lowerName.includes('warre')) {
    return 'TOP_BAR';
  }
  return 'VERTICAL';
}

/**
 * Main seeding function
 */
async function seedHiveTypes() {
  console.log('🌱 Starting hive_types seeding...\n');

  try {
    // Check if table exists and is accessible
    const { data: existingTypes, error: checkError } = await supabase
      .from('hive_types')
      .select('name')
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = table not found
      throw checkError;
    }

    // Clear existing data (optional - remove if you want to preserve existing data)
    console.log('🗑️  Clearing existing hive_types data...');
    const { error: deleteError } = await supabase
      .from('hive_types')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (trick to delete all rows)
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('⚠️  Warning: Could not clear existing data:', deleteError.message);
      console.log('   Continuing with insert (may cause duplicates if names conflict)...\n');
    } else {
      console.log('✅ Existing data cleared\n');
    }

    // Insert hive types data
    console.log(`📦 Inserting ${hiveTypesData.length} hive types...\n`);
    
    const insertPromises = hiveTypesData.map(async (hiveType, index) => {
      const { data, error } = await supabase
        .from('hive_types')
        .insert([hiveType])
        .select()
        .single();

      if (error) {
        // Check if it's a unique constraint violation (duplicate name/translation_key)
        if (error.code === '23505') {
          console.log(`   ⚠️  [${index + 1}/${hiveTypesData.length}] Skipped "${hiveType.name}" - already exists`);
          return { success: false, skipped: true, name: hiveType.name };
        }
        throw error;
      }

      console.log(`   ✅ [${index + 1}/${hiveTypesData.length}] Inserted "${hiveType.name}" (${hiveType.primary_countries.join(', ')})`);
      return { success: true, data, name: hiveType.name };
    });

    const results = await Promise.allSettled(insertPromises);
    
    // Summary
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value.skipped).length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 Seeding Summary:');
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ⚠️  Skipped (duplicates): ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('='.repeat(60) + '\n');

    if (failed > 0) {
      console.error('❌ Some inserts failed. Check errors above.');
      process.exit(1);
    }

    // Verify final count
    const { count, error: countError } = await supabase
      .from('hive_types')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`✅ Total hive types in database: ${count}\n`);
    }

    console.log('🎉 Hive types seeding completed successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Error during seeding:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedHiveTypes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedHiveTypes, hiveTypesData, type HiveTypeSeed };
