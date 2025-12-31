
export interface InventoryItem {
  id: string;
  name: string;
  category: 'EQUIPMENT' | 'MEDICATION' | 'FEED' | 'OTHER';
  quantity: number;
  unit: string;
  updated_at: string;
}

export interface ProductItem {
  id: string;
  name: string;
  batch_number?: string;
  type: 'HONEY' | 'PROPOLIS' | 'POLLEN' | 'WAX' | 'ROYAL_JELLY' | 'OTHER';
  quantity: number;
  unit: string;
  expiry_date?: string;
  created_at: string;
}
