"use client";

import { useState, useEffect } from "react";
import InspectionFormModal from "./InspectionFormModal";
import { getHivesActiveStatus } from "@/app/actions/get-active-hives";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/toast";

interface AddInspectionButtonProps {
  hiveId: string;
  hiveName?: string;
}

/**
 * AddInspectionButton - Allows adding inspections to active hives
 * 
 * VALIDATION LOGIC:
 * - ONLY subscription limit (isLockedByPlan / suspendedHives) can block form opening
 * - Pending tasks (next_visit_tasks) do NOT block form opening
 * - Pending tasks are informational only and can be handled within the form
 */
export default function AddInspectionButton({ hiveId, hiveName }: AddInspectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLockedByPlan, setIsLockedByPlan] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check ONLY subscription lock status (separated from pending tasks validation)
  useEffect(() => {
    const checkSubscriptionLock = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Only check subscription limits - this is the ONLY blocking condition
          const { suspendedHives } = await getHivesActiveStatus(user.id);
          const isLocked = suspendedHives.includes(hiveId);
          setIsLockedByPlan(isLocked);
        }
      } catch (error) {
        console.error('Error checking hive subscription lock:', error);
        // On error, allow form to open (fail open) to prevent blocking valid users
        setIsLockedByPlan(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkSubscriptionLock();
  }, [hiveId]);

  const handleClick = () => {
    // ONLY check subscription lock - pending tasks do not block
    if (isLockedByPlan) {
      toast.error('Nie można dodać przeglądu do zawieszonego ula. Ul jest poza limitem Twojego planu. Podnieś plan na wyższy aby odblokować dostęp do wszystkich uli.');
      return;
    }
    // Allow form to open - pending tasks will be handled as info/warnings inside the form
    setIsOpen(true);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        disabled={isChecking || isLockedByPlan}
        className={`px-6 py-2 rounded-lg font-bold shadow-md transition-all ${
          isLockedByPlan || isChecking
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
        }`}
        title={isLockedByPlan ? 'Ul jest zawieszony - nie można dodawać przeglądów (limit planu)' : undefined}
      >
        Dodaj Przegląd
      </button>

      {/* Form opens if NOT locked by plan - pending tasks are handled inside form, not as blockers */}
      {!isLockedByPlan && (
        <InspectionFormModal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          hiveId={hiveId}
          hiveName={hiveName}
        />
      )}
    </>
  );
}
