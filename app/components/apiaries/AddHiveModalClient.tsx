'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import AddHiveModal from './AddHiveModal'
import { useRouter } from 'next/navigation'

interface AddHiveModalClientProps {
  apiaryId: string
}

export default function AddHiveModalClient({ apiaryId }: AddHiveModalClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Dodaj Ul
      </button>
      
      <AddHiveModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        apiaryId={apiaryId}
        onSuccess={handleSuccess}
      />
    </>
  )
}
