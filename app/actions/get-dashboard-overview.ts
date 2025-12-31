"use server";

import { createClient } from "@/utils/supabase/server";

export interface DashboardOverview {
  hivesCount: number;
  apiariesCount: number;
  forageStatus: {
    current: string;     // e.g., "Akacja" or "Zimowla"
    status: string;      // e.g., "OBFITY" or "SPOKÓJ"
    color: string;       // hex or tailwind class part
    nextName: string;    // e.g., "Lipa"
    daysToNext: number;  // approx days
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const supabase = createClient();
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12

  // A. FETCH REAL STATS (Count)
  const { count: hivesCount } = await supabase
    .from('hives')
    .select('*', { count: 'exact', head: true });

  const { count: apiariesCount } = await supabase
    .from('apiaries')
    .select('*', { count: 'exact', head: true });

  // B. CALCULATE FORAGE (Bio-Logic)
  // Simple phenology map for Poland (Month based)
  // 1-3: Winter/Early Spring, 4: Willow/Rape, 5: Rape/Acacia, 6: Acacia/Lime, 7: Lime, 8: Goldenrod, 9-12: Winter

  let forageData = {
    current: "Zimowla",
    status: "SPOKÓJ",
    color: "bg-blue-500", // Winter color
    nextName: "Wierzba/Leszczyna",
    daysToNext: 0
  };

  if (currentMonth >= 11 || currentMonth <= 2) {
    // WINTER (Nov - Feb)
    const nextSpring = new Date(today.getFullYear() + (currentMonth > 2 ? 1 : 0), 2, 15); // March 15th approx
    const diffTime = Math.abs(nextSpring.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    forageData = {
        current: "Zimowla",
        status: "SPOKÓJ",
        color: "bg-blue-900",
        nextName: "Wierzba (Wiosna)",
        daysToNext: diffDays
    };
  }
  else if (currentMonth === 3 || currentMonth === 4) {
      // EARLY SPRING
      forageData = { current: "Wierzba / Mniszek", status: "ROZWOJOWY", color: "bg-yellow-400", nextName: "Rzepak", daysToNext: 20 };
  }
  else if (currentMonth === 5) {
      // MAY
      forageData = { current: "Rzepak", status: "OBFITY", color: "bg-yellow-300", nextName: "Akacja", daysToNext: 15 };
  }
  else if (currentMonth === 6) {
      // JUNE
      forageData = { current: "Akacja", status: "EKSTREMALNY", color: "bg-white text-black", nextName: "Lipa", daysToNext: 15 };
  }
  else if (currentMonth === 7) {
      // JULY
      forageData = { current: "Lipa", status: "OBFITY", color: "bg-green-400", nextName: "Nawłoć", daysToNext: 20 };
  }
  else if (currentMonth === 8 || currentMonth === 9) {
      // LATE SUMMER
      forageData = { current: "Nawłoć / Spadź", status: "KOŃCOWY", color: "bg-orange-500", nextName: "Zimowla", daysToNext: 30 };
  }
  else {
      // FALL (Oct)
      forageData = { current: "Przygotowanie do zimy", status: "KARMIENIE", color: "bg-amber-700", nextName: "Zimowla", daysToNext: 10 };
  }

  return {
    hivesCount: hivesCount || 0,
    apiariesCount: apiariesCount || 0,
    forageStatus: forageData
  };
}
