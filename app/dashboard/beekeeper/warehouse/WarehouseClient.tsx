"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, Pill, Layers, Droplets } from "lucide-react";
import { InventoryItem, ProductItem } from "@/app/actions/get-warehouse-data";
import { translateCategory } from "@/utils/equipment-translations";
import EditItemModal from "@/app/components/warehouse/EditItemModal";
import { deleteInventoryItem, deleteProductItem } from "@/app/actions/delete-warehouse-item";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface WarehouseClientProps {
  inventory: InventoryItem[];
  products: ProductItem[];
}

type TabType = "feed" | "medication" | "equipment" | "products";

export default function WarehouseClient({ inventory, products }: WarehouseClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [editingItem, setEditingItem] = useState<{
    item: InventoryItem | ProductItem;
    type: "inventory" | "product";
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [debugProducts, setDebugProducts] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  // Ensure arrays are defined
  const safeInventory = useMemo(
    () => (Array.isArray(inventory) ? inventory : []),
    [inventory]
  );
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  // Debug logging - Props data
  console.log("=== WAREHOUSE CLIENT DEBUG ===");
  console.log("WarehouseClient - Inventory count:", safeInventory.length);
  console.log("WarehouseClient - Products count (from props):", safeProducts.length);
  console.log("WarehouseClient - Products data (from props):", safeProducts);

  // DEBUG: Fetch products directly from Supabase when products tab is active
  useEffect(() => {
    const fetchProductsDebug = async () => {
      if (activeTab === 'products') {
        console.log("--- DEBUG PRODUKTY ---");
        console.log("Pobieranie danych z tabeli products...");
        
        try {
          // Get current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error("Błąd pobierania użytkownika:", userError);
            return;
          }
          
          if (!user) {
            console.error("Brak użytkownika w sesji");
            return;
          }
          
          console.log("User ID:", user.id);
          
          // Fetch products
          // FIX: Sort by 'name' then by 'volume_ml' (descending) to group variants
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('owner_id', user.id)
            .order('name', { ascending: true })
            .order('volume_ml', { ascending: false, nullsFirst: false });
          
          console.log("--- DEBUG PRODUKTY ---");
          console.log("Błąd:", error);
          console.log("Pobrane dane (raw):", data);
          console.log("Liczba rekordów:", data?.length || 0);
          
          if (error) {
            console.error("Błąd pobierania produktów:", error.message);
            console.error("Szczegóły błędu:", error);
          }
          
          if (data && data.length > 0) {
            console.log("Przykładowy rekord:", data[0]);
            console.log("Struktura rekordu:", {
              id: data[0].id,
              name: data[0].name,
              stock: data[0].stock,
              price: data[0].price,
              batch_code: data[0].batch_code,
              owner_id: data[0].owner_id
            });
            
            // Mapowanie danych zgodnie z wymaganiami
            const mappedProducts = data.map((p: any) => {
              // Determine type from name (if contains miód/honey -> Miód, etc.)
              let productType = 'Miód';
              const nameLower = (p.name || '').toLowerCase();
              if (nameLower.includes('propolis')) {
                productType = 'Propolis';
              } else if (nameLower.includes('pyłek') || nameLower.includes('pollen')) {
                productType = 'Pyłek';
              } else if (nameLower.includes('wosk') || nameLower.includes('wax')) {
                productType = 'Wosk';
              } else if (nameLower.includes('mleczko') || nameLower.includes('royal')) {
                productType = 'Mleczko Pszczele';
              }
              
              return {
                id: p.id,
                name: p.name,           // products.name -> name
                item_name: p.name,      // Dla kompatybilności
                type: productType,      // WAŻNE: Pole 'type' jest kluczowe do rozróżnienia ProductItem od InventoryItem
                stock: p.stock !== null && p.stock !== undefined ? parseInt(String(p.stock)) : 0,  // products.stock -> stock
                unit_price: p.price !== null && p.price !== undefined ? parseFloat(String(p.price)) : undefined,  // products.price -> unit_price
                price: p.price,         // Zachowaj oryginalne pole
                category: 'Produkt Gotowy',
                unit: 'szt',
                batch_code: p.batch_code || '',
                batch_number: p.batch_code || '',
                volume_ml: p.volume_ml !== null && p.volume_ml !== undefined ? parseInt(String(p.volume_ml)) : undefined,
                weight_g: p.weight_g !== null && p.weight_g !== undefined ? parseInt(String(p.weight_g)) : undefined
              };
            });
            
            console.log("Zmapowane produkty:", mappedProducts);
            console.log("Liczba zmapowanych produktów:", mappedProducts.length);
            setDebugProducts(mappedProducts);
          } else {
            console.warn("Brak danych produktów w odpowiedzi");
            setDebugProducts([]);
          }
        } catch (err: any) {
          console.error("Wyjątek podczas pobierania produktów:", err);
          console.error("Szczegóły wyjątku:", err.message, err.stack);
        }
      } else {
        setDebugProducts([]);
      }
    };
    
    fetchProductsDebug();
  }, [activeTab, supabase]);

  // Categorize inventory items using the new 'type' field
  const feedItems = safeInventory.filter(
    (item) => {
      // Filter by category for feed items (not equipment or medication)
      if (item.type === 'SUPPLY' && (item.category === "Pokarm" || item.name.toLowerCase().includes("cukier") || 
          item.name.toLowerCase().includes("inwert") || item.name.toLowerCase().includes("ciasto"))) {
        return true;
      }
      return false;
    }
  );

  // Medications: Use type field for accurate filtering
  const medicationItems = safeInventory.filter(
    (item) => {
      // Use type field (most reliable) - set based on is_medication flag from database
      if (item.type === 'MEDICATION') {
        return true;
      }
      // Fallback: Check is_medication flag if type is not set (backward compatibility)
      if (item.is_medication === true) {
        return true;
      }
      // Fallback: Check category for medications
      if (item.category === "Leki" || item.category === "Leki / Suplementy") {
        return true;
      }
      return false;
    }
  );

  // Equipment: Use type field for accurate filtering
  const equipmentItems = safeInventory.filter(
    (item) => {
      // Use type field (most reliable) - items from equipment_inventory table
      if (item.type === 'EQUIPMENT') {
        return true;
      }
      // Fallback: Check equipment_category (from equipment_inventory)
      if ('equipment_category' in item && (item as any).equipment_category) {
        return true;
      }
      // Fallback: Check category for equipment (but not medications)
      if (item.type !== 'MEDICATION' && 
          (item.category === "Sprzęt Pszczelarski" || 
           item.category === "Elementy Ula" || 
           item.category === "Narzędzia")) {
        return true;
      }
      return false;
    }
  );

  // Get current tab items
  const getCurrentItems = (): (InventoryItem | ProductItem)[] => {
    switch (activeTab) {
      case "feed":
        return feedItems;
      case "medication":
        return medicationItems;
      case "equipment":
        return equipmentItems;
      case "products":
        // Use debug products if available, otherwise fall back to props
        let products: ProductItem[];
        if (debugProducts.length > 0) {
          console.log("Używanie produktów z debug fetch:", debugProducts.length);
          products = debugProducts as ProductItem[];
        } else {
          console.log("Używanie produktów z props:", safeProducts.length);
          products = safeProducts;
        }
        // Sort products by name, then by volume (descending) to group variants
        return [...products].sort((a, b) => {
          const nameCompare = a.name.localeCompare(b.name);
          if (nameCompare !== 0) return nameCompare;
          const aVolume = (a as ProductItem).volume_ml || 0;
          const bVolume = (b as ProductItem).volume_ml || 0;
          return bVolume - aVolume; // Descending order (largest first)
        });
      default:
        return [];
    }
  };

  const currentItems = getCurrentItems();
  
  // Debug: Log current items when products tab is active
  useEffect(() => {
    if (activeTab === 'products') {
      console.log("=== CURRENT ITEMS DEBUG ===");
      console.log("Active tab:", activeTab);
      console.log("Current items count:", currentItems.length);
      console.log("Current items:", currentItems);
      console.log("Debug products count:", debugProducts.length);
      console.log("Safe products count (props):", safeProducts.length);
    }
  }, [activeTab, currentItems, debugProducts, safeProducts]);

  // Format quantity with unit
  const formatQuantity = (item: InventoryItem | ProductItem): string => {
    // Products use 'stock', inventory uses 'quantity'
    const isProduct = "stock" in item;
    const qty = isProduct 
      ? (item as ProductItem).stock 
      : typeof (item as InventoryItem).quantity === "number" 
        ? (item as InventoryItem).quantity 
        : parseFloat(String((item as InventoryItem).quantity));
    const safeQty = Number(qty) || 0;
    const unit = item.unit || "szt";
    // Display "opakowania" instead of "szt" for medications (only for inventory items)
    const category = !isProduct ? (item as InventoryItem).category : null;
    const displayUnit = !isProduct && (category === "Leki" || category === "Leki / Suplementy") && unit === "szt"
      ? "opak."
      : unit;
    return `${safeQty.toFixed(safeQty % 1 === 0 ? 0 : 2)} ${displayUnit}`;
  };

  // Calculate total value
  const calculateTotalValue = (item: InventoryItem | ProductItem): number => {
    // Products use 'stock', inventory uses 'quantity'
    const isProduct = "stock" in item;
    const qty = isProduct 
      ? (item as ProductItem).stock 
      : typeof (item as InventoryItem).quantity === "number" 
        ? (item as InventoryItem).quantity 
        : parseFloat(String((item as InventoryItem).quantity));
    // FIX: Poprawne pobranie ceny - sprawdzamy 'stock', bo 'category' mają obie struktury
    const price = isProduct ? (item as ProductItem).price : (item as InventoryItem).unit_price;
    if (!price || price <= 0 || isNaN(price)) return 0;
    if (isNaN(qty) || qty <= 0) return 0;
    return qty * price;
  };

  const tabs = [
    { id: "feed" as TabType, label: "Pasza / Pokarm", icon: Droplets, count: feedItems.length },
    { id: "medication" as TabType, label: "Leki", icon: Pill, count: medicationItems.length },
    { id: "equipment" as TabType, label: "Sprzęt", icon: Layers, count: equipmentItems.length },
    { id: "products" as TabType, label: "Produkty Gotowe", icon: Package, count: safeProducts.length },
  ];

  const handleEdit = (item: InventoryItem | ProductItem) => {
    // Determine type based on activeTab - products tab = product, others = inventory
    const type = activeTab === "products" ? "product" : "inventory";
    setEditingItem({ item, type });
  };

  const handleDelete = async (itemId: string, type: "inventory" | "product") => {
    if (!confirm("Czy na pewno chcesz usunąć tę pozycję?")) {
      return;
    }

    setDeletingId(itemId);
    try {
      const result =
        type === "inventory"
          ? await deleteInventoryItem(itemId)
          : await deleteProductItem(itemId);

      if (result.error) {
        alert(`Błąd: ${result.error}`);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      alert(`Błąd: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-300 dark:border-primary/20 overflow-x-auto bg-[#F8F9FA] dark:bg-transparent px-2 py-1 rounded-t-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors
                border-b-2 relative
                ${activeTab === tab.id
                  ? "border-primary text-primary dark:text-primary"
                  : "border-transparent text-gray-700 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80"
                }
              `}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${activeTab === tab.id
                    ? "bg-primary/20 text-primary dark:bg-primary/20 dark:text-primary"
                    : "bg-gray-200 dark:bg-secondary/30 text-gray-700 dark:text-amber-200/80"
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {currentItems.length > 0 ? (
        <div className="bg-[#F8F9FA] dark:bg-black/30 dark:backdrop-blur-xl overflow-hidden rounded-xl border border-gray-300 dark:border-primary/20 shadow-lg dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-transparent border-b border-gray-300 dark:border-primary/20">
                <tr>
                  <th className="text-left p-4 text-xs uppercase font-bold text-gray-900 dark:text-gray-100">Nazwa</th>
                  <th className="text-left p-4 text-xs uppercase font-bold text-gray-900 dark:text-gray-100">Kategoria</th>
                  <th className="text-right p-4 text-xs uppercase font-bold text-gray-900 dark:text-gray-100">Ilość</th>
                  <th className="text-right p-4 text-xs uppercase font-bold text-gray-900 dark:text-gray-100">Cena jedn.</th>
                  <th className="text-right p-4 text-xs uppercase font-bold text-gray-900 dark:text-gray-100">Wartość całkowita</th>
                  <th className="text-center p-4 text-xs uppercase font-bold text-gray-900 dark:text-gray-100">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => {
                  const totalValue = calculateTotalValue(item);
                  // FIX: Poprawne pobranie ceny - sprawdzamy 'type', bo 'category' mają obie struktury
                  const isProduct = "stock" in item;
                  const price = isProduct ? (item as ProductItem).price : (item as InventoryItem).unit_price;
                  return (
                    <tr
                      key={item.id}
                      className="bg-white dark:bg-transparent border-b border-gray-200 dark:border-primary/10 hover:bg-gray-50 dark:hover:bg-primary/10 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-gray-100">{item.name}</span>
                          {isProduct && ((item as ProductItem).volume_ml || (item as ProductItem).weight_g) && (
                            <span className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                              Słoik: {(item as ProductItem).volume_ml || '?'}ml | Waga: {(item as ProductItem).weight_g || '?'}g
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs px-2 py-1 rounded font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                          {isProduct 
                            ? (item as ProductItem).category || (item as ProductItem).type 
                            : translateCategory((item as InventoryItem).category) || "Inne"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-gray-900 dark:text-gray-100">
                        {formatQuantity(item)}
                      </td>
                      <td className="p-4 text-right font-mono text-gray-800 dark:text-gray-100">
                        {price && price > 0 ? `${price.toFixed(2)} PLN` : "-"}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-amber-600 dark:text-primary">
                        {totalValue > 0 ? `${totalValue.toFixed(2)} PLN` : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              handleEdit(item);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-bold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Edytuj"
                            disabled={deletingId === item.id}
                          >
                            Edytuj
                          </button>
                          <span className="text-gray-300 dark:text-white/20">|</span>
                          <button
                            onClick={() => {
                              // Determine type based on activeTab - products tab = product, others = inventory
                              const itemType = activeTab === "products" ? "product" : "inventory";
                              handleDelete(item.id, itemType);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Usuń"
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? "Usuwanie..." : "Usuń"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#F8F9FA] dark:bg-black/30 dark:backdrop-blur-xl p-12 text-center rounded-xl border border-gray-300 dark:border-primary/20 shadow-lg dark:shadow-none">
          <div className="text-4xl mb-4 opacity-50">📦</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Brak pozycji</h3>
          <p className="text-gray-700 dark:text-white/60">
            Nie znaleziono żadnych pozycji w tej kategorii.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem.item}
          type={editingItem.type}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

