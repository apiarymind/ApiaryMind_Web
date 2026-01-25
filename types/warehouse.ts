
export interface InventoryItem {
  id: string;
  name: string;
  category: string; // e.g., 'Sprzęt Pszczelarski', 'Leki', 'Pokarm', 'Elementy Ula', 'Narzędzia'
  quantity: number; // Decimal support (e.g., 1.5 kg)
  unit: string; // 'szt', 'kg', 'l'
  unit_price?: number; // Price per 1 unit (e.g., 10.71 PLN/kg)
  updated_at?: string;
  created_at?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  batch_number?: string;
  type: 'HONEY' | 'PROPOLIS' | 'POLLEN' | 'WAX' | 'ROYAL_JELLY' | 'OTHER';
  stock: number; // Stock quantity from DB 'stock' column
  unit: string;
  price?: number; // Price per unit for products
  expiry_date?: string;
  created_at?: string;
}
