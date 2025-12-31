"use client";

import { useState } from "react";
import InspectionFormModal from "./InspectionFormModal";

interface AddInspectionButtonProps {
  hiveId: string;
}

export default function AddInspectionButton({ hiveId }: AddInspectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all"
      >
        Dodaj Przegląd
      </button>

      <InspectionFormModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        hiveId={hiveId} 
      />
    </>
  );
}
