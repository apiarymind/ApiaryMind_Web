'use server'

import { createClient } from '@/utils/supabase/server';

export interface PublicApiaryData {
  id: string;
  name: string;
  location_geo: string | null;
  type: string | null;
  owner: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    description: string | null;
    voivodeship: string | null;
    city: string | null;
    phone_number: string | null;
    website_url: string | null;
    facebook_link: string | null;
    allegro_link: string | null;
    olx_link: string | null;
  } | null;
  hives_count: number;
  statistics: {
    total_inspections: number;
    active_hives: number;
    avg_honey_supers: number;
  } | null;
}

export async function getApiaryPublic(apiaryId: string): Promise<{ data: PublicApiaryData | null; error: string | null }> {
  const supabase = createClient();

  try {
    // Get apiary
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select(`
        id,
        name,
        location_geo,
        type,
        owner_id
      `)
      .eq('id', apiaryId)
      .single();

    if (apiaryError || !apiary) {
      return { data: null, error: 'Pasieka nie znaleziona' };
    }

    // Get owner profile (only public info)
    let owner = null;
    if (apiary.owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          company_name,
          description,
          voivodeship,
          city,
          phone_number,
          website_url,
          facebook_link,
          allegro_link,
          olx_link
        `)
        .eq('id', apiary.owner_id)
        .single();
      
      owner = profile || null;
    }

    // Get hives count
    const { count: hivesCount } = await supabase
      .from('hives')
      .select('*', { count: 'exact', head: true })
      .eq('apiary_id', apiaryId);

    // Get basic statistics
    const { data: hives } = await supabase
      .from('hives')
      .select('id')
      .eq('apiary_id', apiaryId);

    const hiveIds = hives?.map(h => h.id) || [];

    let statistics = null;
    if (hiveIds.length > 0) {
      const { count: inspectionsCount } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .in('hive_id', hiveIds);

      // Get active hives (with recent inspections or current queens)
      const { data: activeHives } = await supabase
        .from('hives')
        .select('id')
        .eq('apiary_id', apiaryId)
        .not('current_queen_id', 'is', null);

      // Calculate avg honey supers (last inspection per hive)
      const { data: lastInspections } = await supabase
        .from('inspections')
        .select('hive_id, honey_supers_count')
        .in('hive_id', hiveIds)
        .order('inspection_date', { ascending: false })
        .limit(100);

      let avgHoneySupers = 0;
      if (lastInspections && lastInspections.length > 0) {
        const supers = lastInspections
          .filter((i: any) => i.honey_supers_count !== null)
          .map((i: any) => i.honey_supers_count);
        
        if (supers.length > 0) {
          avgHoneySupers = Math.round(
            supers.reduce((a: number, b: number) => a + b, 0) / supers.length
          );
        }
      }

      statistics = {
        total_inspections: inspectionsCount || 0,
        active_hives: activeHives?.length || 0,
        avg_honey_supers: avgHoneySupers
      };
    }

    const result: PublicApiaryData = {
      id: apiary.id,
      name: apiary.name,
      location_geo: apiary.location_geo,
      type: apiary.type,
      owner: owner,
      hives_count: hivesCount || 0,
      statistics
    };

    return { data: result, error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching apiary:', err);
    return { data: null, error: err.message || 'Nieznany błąd' };
  }
}





