"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom"; // requires react-dom@latest
import { PlusCircle, X, Package, Layers } from "lucide-react";
import { addWarehouseItem } from "@/app/actions/add-warehouse-item";

const initialState = {
  message: "",
  error: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary hover:bg-amber-400 text-black font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
    >
      {pending ? "Zapisywanie..." : "Zapisz w Magazynie"}
    </button>
  );
}

export default function AddStockModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "product">("product");
  const [state, formAction] = useFormState(addWarehouseItem, initialState);

  // Close modal on success
  if (state.success && isOpen) {
     setIsOpen(false);
     // Reset state manually or handle via useEffect if needed,
     // but for simplicity we just close the modal.
     // In a real app, use a Toast here.
     alert("Dodano pomyślnie!");
     state.success = false; // Reset simple flag
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-primary/20"
      >
        <PlusCircle size={20} />
        Dodaj Dostawę
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-xl font-bold text-white">Dodaj do Magazynu</h3>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-2 bg-black/20">
              <button
                type="button"
                onClick={() => setActiveTab("product")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "product" ? "bg-amber-500 text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <Package size={16} /> Produkty (Miód)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "inventory" ? "bg-blue-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <Layers size={16} /> Sprzęt
              </button>
            </div>

            {/* Form */}
            <form action={formAction} className="p-6 space-y-4">
              <input type="hidden" name="type" value={activeTab} />

              {/* Common Field: Name */}
              <div>
                <label className="block text-xs uppercase text-white/50 mb-1">Nazwa</label>
                {activeTab === 'product' ? (
                   <select name="name" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none">
                      <option value="Miód Rzepakowy 2025">Miód Rzepakowy 2025</option>
                      <option value="Miód Akacjowy 2025">Miód Akacjowy 2025</option>
                      <option value="Miód Lipowy 2025">Miód Lipowy 2025</option>
                      <option value="Miód Spadziowy 2025">Miód Spadziowy 2025</option>
                      <option value="Miód Wielokwiatowy 2025">Miód Wielokwiatowy 2025</option>
                   </select>
                ) : (
                   <input type="text" name="name" placeholder="np. Korpus Wlkp" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none" required />
                )}
              </div>

              {/* Specific Fields */}
              {activeTab === "inventory" ? (
                <div>
                  <label className="block text-xs uppercase text-white/50 mb-1">Kategoria</label>
                  <select name="category" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none">
                    <option value="Sprzęt Pszczelarski">Sprzęt Pszczelarski</option>
                    <option value="Elementy Ula">Elementy Ula</option>
                    <option value="Narzędzia">Narzędzia</option>
                    <option value="Leki">Leki / Suplementy</option>
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-white/50 mb-1">Cena (PLN)</label>
                    <input type="number" step="0.01" name="price" placeholder="0.00" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-white/50 mb-1">Kod Partii</label>
                    <input type="text" name="batch" placeholder="np. 2025/01" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                  </div>
                </div>
              )}

              {/* Common Field: Quantity */}
              <div>
                <label className="block text-xs uppercase text-white/50 mb-1">Ilość (Sztuki)</label>
                <input type="number" name="quantity" min="1" defaultValue="1" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-lg font-bold focus:border-white/50 focus:outline-none" required />
              </div>

              {state.error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">{state.error}</p>
              )}

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
