'use client';

import { useState } from 'react';
import { Inspection } from '@/types/supabase';
import InspectionFormModal from './InspectionFormModal';

interface AddInspectionButtonProps {
  hiveId: string;
  previousInspection?: Inspection | null;
}

export default function AddInspectionButton({ hiveId, previousInspection }: AddInspectionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all"
      >
        Dodaj Przegląd
      </button>

      <InspectionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hiveId={hiveId}
        previousInspection={previousInspection}
      />
    </>
  );
}
