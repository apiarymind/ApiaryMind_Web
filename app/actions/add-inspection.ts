"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface InspectionFormData {
  hive_id: string;
  inspection_date: string;
  notes: string;
  weather_condition: string;
  temperature?: number;
  colony_strength: string;
  mood: string;
  brood_frames_count?: number;
  swarming_mood: boolean;
  is_queen_seen: boolean;
  is_queen_marked: boolean;
  laying_pattern: string;
  honey_supers_count?: number;
  half_supers_count?: number;
  frames_sealed_percent?: number;
  pests_detected: string[];
  treatment_applied?: string; // Medication Name
  next_visit_tasks: string[];
  medication_id?: string; // ID from medications_global
  withdrawal_days?: number; // Days from medications_global
}

export async function addInspection(data: InspectionFormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // Calculate Alert Level based on data
  let alert_level = 'LOW';
  if (data.swarming_mood) alert_level = 'HIGH';
  if (data.pests_detected.some(p => ['VARROA', 'AFB', 'ZGNILEC'].includes(p.toUpperCase()))) alert_level = 'CRITICAL';
  if (data.treatment_applied) {
      // User request: "Auto-set the alert_level to 'MEDIUM' or 'HIGH' if a treatment is applied."
      if (alert_level !== 'CRITICAL') alert_level = 'MEDIUM'; 
  }

  // 1. Insert Inspection
  const { data: inspectionData, error: inspectionError } = await supabase
    .from('inspections')
    .insert({
      hive_id: data.hive_id,
      user_id: user.id,
      inspection_date: data.inspection_date,
      notes: data.notes,
      weather_condition: data.weather_condition,
      temperature: data.temperature,
      colony_strength: data.colony_strength,
      mood: data.mood,
      brood_frames_count: data.brood_frames_count,
      swarming_mood: data.swarming_mood,
      is_queen_seen: data.is_queen_seen,
      is_queen_marked: data.is_queen_marked,
      laying_pattern: data.laying_pattern,
      honey_supers_count: data.honey_supers_count,
      half_supers_count: data.half_supers_count,
      frames_sealed_percent: data.frames_sealed_percent,
      pests_detected: data.pests_detected,
      treatment_applied: data.treatment_applied,
      next_visit_tasks: data.next_visit_tasks,
      alert_level: alert_level // Ensure DB has this column or ignore if it generates it. Schema wasn't fully explicit but 'alert_level' is used in Dashboard query.
    })
    .select()
    .single();

  if (inspectionError) {
    console.error('Error adding inspection:', inspectionError);
    return { error: inspectionError.message };
  }

  // 2. Handle Treatment Log (If medication applied)
  if (data.treatment_applied && data.withdrawal_days !== undefined && data.withdrawal_days > 0) {
      const inspectionDate = new Date(data.inspection_date);
      const withdrawalEndDate = new Date(inspectionDate);
      withdrawalEndDate.setDate(withdrawalEndDate.getDate() + data.withdrawal_days);

      const { error: treatmentError } = await supabase
        .from('treatments_log')
        .insert({
            hive_id: data.hive_id,
            medication_name: data.treatment_applied,
            application_date: data.inspection_date,
            withdrawal_end_date: withdrawalEndDate.toISOString(),
            inspection_id: inspectionData.id // Optional linkage if schema supports it
        });
      
      if (treatmentError) {
          console.error('Error logging treatment:', treatmentError);
          // Non-blocking error, but good to know
      }
  }

  revalidatePath(`/dashboard/apiaries/[id]/hive/${data.hive_id}`, 'page');
  revalidatePath(`/dashboard/hives`);
  revalidatePath(`/dashboard`); // For the Sick Bay

  return { success: true, id: inspectionData.id };
}
