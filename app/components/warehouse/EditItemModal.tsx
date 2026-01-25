"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { updateInventoryItem, updateProductItem } from "@/app/actions/update-warehouse-item";
import { InventoryItem, ProductItem } from "@/app/actions/get-warehouse-data";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | ProductItem;
  type: "inventory" | "product";
  onSuccess?: () => void;
}

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
      {pending ? "Zapisywanie..." : "Zapisz zmiany"}
    </button>
  );
}

export default function EditItemModal({
  isOpen,
  onClose,
  item,
  type,
  onSuccess,
}: EditItemModalProps) {
  const [unit, setUnit] = useState<"szt" | "kg" | "l">("szt");
  
  // Create wrapper functions that capture item.id
  // Also double-check the actual type based on item properties
  const actualType = "category" in item ? "inventory" : "product";
  
  const handleUpdateInventory = async (prevState: any, formData: FormData) => {
    return await updateInventoryItem(item.id, formData);
  };
  
  const handleUpdateProduct = async (prevState: any, formData: FormData) => {
    return await updateProductItem(item.id, formData);
  };
  
  const [state, formAction] = useFormState(
    actualType === "inventory" ? handleUpdateInventory : handleUpdateProduct,
    initialState
  );

  // Initialize form with item data
  useEffect(() => {
    if (item && isOpen) {
      if ("unit" in item && item.unit) {
        setUnit(item.unit as "szt" | "kg" | "l");
      }
    }
  }, [item, isOpen]);

  // Close modal on success
  useEffect(() => {
    if (state?.success && isOpen) {
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 100);
    }
  }, [state?.success, isOpen, onClose, onSuccess]);
  
  // Log errors for debugging
  useEffect(() => {
    if (state?.error) {
      console.error("Edit error:", state.error);
    }
  }, [state?.error]);

  if (!isOpen) return null;

  // Determine if it's inventory based on item properties (category) rather than passed type
  const isInventory = "category" in item;
  const currentPrice = isInventory
    ? (item as InventoryItem).unit_price || 0
    : (item as ProductItem).price || 0;
  // Products use 'stock', inventory uses 'quantity'
  const currentQuantity = isInventory
    ? (typeof (item as InventoryItem).quantity === "number" ? (item as InventoryItem).quantity : parseFloat(String((item as InventoryItem).quantity)) || 0)
    : (item as ProductItem).stock || 0;
  const calculatedTotalPrice = currentPrice > 0 && currentQuantity > 0 ? currentPrice * currentQuantity : 0;
  
  // Get current category for inventory items
  const currentCategory = isInventory ? ((item as InventoryItem).category || "Sprzęt Pszczelarski") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
          <h3 className="text-xl font-bold text-white">Edytuj pozycję</h3>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">
              Nazwa
            </label>
            {isInventory ? (
              <input
                type="text"
                name="name"
                defaultValue={item.name}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                required
              />
            ) : (
              <input
                type="text"
                name="name"
                defaultValue={(item as ProductItem).name}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                required
              />
            )}
          </div>

          {/* Category (inventory only) */}
          {isInventory && (
            <div>
              <label className="block text-xs uppercase text-white/50 mb-1">
                Kategoria
              </label>
              <select
                name="category"
                key={`category-${item.id}-${currentCategory}`}
                defaultValue={currentCategory}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Sprzęt Pszczelarski">Sprzęt Pszczelarski</option>
                <option value="Elementy Ula">Elementy Ula</option>
                <option value="Narzędzia">Narzędzia</option>
                <option value="Leki">Leki</option>
                <option value="Leki / Suplementy">Leki / Suplementy</option>
                <option value="Pokarm">Pokarm</option>
                {/* Fallback option if category not in list */}
                {!["Sprzęt Pszczelarski", "Elementy Ula", "Narzędzia", "Leki", "Leki / Suplementy", "Pokarm"].includes(currentCategory) && (
                  <option value={currentCategory} key={`custom-${currentCategory}`}>{currentCategory}</option>
                )}
              </select>
            </div>
          )}

          {/* Unit (inventory only) */}
          {isInventory && (
            <div>
              <label className="block text-xs uppercase text-white/50 mb-1">
                Jednostka
              </label>
              <select
                name="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as "szt" | "kg" | "l")}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="szt">
                  {currentCategory === "Leki" || currentCategory === "Leki / Suplementy"
                    ? "szt (opakowania)"
                    : "szt (sztuki)"}
                </option>
                <option value="kg">kg (kilogramy)</option>
                <option value="l">l (litry)</option>
              </select>
            </div>
          )}

          {/* Batch (products only) */}
          {!isInventory && (
            <>
              <div>
                <label className="block text-xs uppercase text-white/50 mb-1">
                  Kod Partii
                </label>
                <input
                  type="text"
                  name="batch"
                  defaultValue={(item as ProductItem).batch_number || ""}
                  placeholder="np. 2025/01"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
              {/* Volume and Weight (products only) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-white/50 mb-1">
                    Pojemność (ml)
                  </label>
                  <input
                    type="number"
                    name="volume_ml"
                    defaultValue={(item as ProductItem).volume_ml || ""}
                    placeholder="np. 900"
                    min="0"
                    step="1"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-white/50 mb-1">
                    Waga Netto (g)
                  </label>
                  <input
                    type="number"
                    name="weight_g"
                    defaultValue={(item as ProductItem).weight_g || ""}
                    placeholder="np. 1250"
                    min="1"
                    step="1"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">
              Ilość{" "}
              {isInventory
                ? currentCategory === "Leki" || currentCategory === "Leki / Suplementy"
                  ? unit === "szt"
                    ? "(Opakowania)"
                    : unit === "kg"
                    ? "(Kilogramy)"
                    : "(Litry)"
                  : unit === "szt"
                  ? "(Sztuki)"
                  : unit === "kg"
                  ? "(Kilogramy)"
                  : "(Litry)"
                : "(Sztuki)"}
            </label>
            <input
              type="number"
              step={isInventory && (unit === "kg" || unit === "l") ? "0.01" : "1"}
              name="quantity"
              min={isInventory && (unit === "kg" || unit === "l") ? "0.01" : "1"}
              defaultValue={
                isInventory
                  ? (unit === "szt" ? Math.round(currentQuantity) : currentQuantity)
                  : Math.round(currentQuantity) // Products always use whole numbers
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-lg font-bold focus:border-white/50 focus:outline-none"
              required
            />
            {isInventory && (unit === "kg" || unit === "l") && (
              <p className="text-xs text-white/40 mt-1">
                Możesz wpisać ułamki, np. 1.5 {unit}
              </p>
            )}
          </div>

          {/* Price */}
          {isInventory ? (
            <div>
              <label className="block text-xs uppercase text-white/50 mb-1">
                Cena całkowita za zakup (PLN)
              </label>
              <input
                type="number"
                step="0.01"
                name="total_price"
                defaultValue={calculatedTotalPrice > 0 ? calculatedTotalPrice.toFixed(2) : "0"}
                placeholder="np. 150.00"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-white/40 mt-1">
                System przeliczy na cenę za 1 {unit}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs uppercase text-white/50 mb-1">
                Cena za sztukę (PLN)
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                defaultValue={currentPrice > 0 ? currentPrice.toFixed(2) : "0"}
                placeholder="0.00"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {state.error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">
              {state.error}
            </p>
          )}

          {state.message && (
            <p className="text-green-400 text-sm text-center bg-green-500/10 p-2 rounded">
              {state.message}
            </p>
          )}

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}

