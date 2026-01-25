'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

/**
 * Get last purchase price for an inventory item
 * First tries to get unit_price from inventory table, then falls back to financial_records
 * Returns price per 1 unit (e.g., 10.71 PLN/kg)
 */
export async function getLastPurchasePrice(
  itemName: string,
  category: string
): Promise<number | null> {
  const uid = await getSessionUid();
  if (!uid) return null;

  const supabase = createClient();

  try {
    // First, try to get unit_price directly from inventory
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from('inventory')
      .select('unit_price')
      .eq('owner_id', uid)
      .eq('item_name', itemName)
      .not('unit_price', 'is', null)
      .gt('unit_price', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!inventoryError && inventoryItem && inventoryItem.unit_price) {
      return parseFloat(String(inventoryItem.unit_price));
    }

    // Fallback: Search for last expense transaction with this item in description
    const { data: records, error } = await supabase
      .from('financial_records')
      .select('amount, description')
      .eq('owner_id', uid)
      .eq('transaction_type', 'EXPENSE')
      .eq('category', category)
      .ilike('description', `%${itemName}%`)
      .order('transaction_date', { ascending: false })
      .limit(1);

    if (error || !records || records.length === 0) {
      return null;
    }

    // Return absolute value (expenses are stored as negative or positive)
    // Note: This is total amount, not per unit - but better than nothing
    return Math.abs(records[0].amount || 0);
  } catch (err) {
    console.error('Error fetching last purchase price:', err);
    return null;
  }
}

/**
 * Get inventory items by category for inspection form
 * Supports flexible category matching (e.g., "Leki", "Leki / Suplementy", "MEDICATION", "Pokarm")
 * Now includes unit and unit_price support
 */
export async function getInventoryItemsByCategory(
  categories: string[]
): Promise<{ id: string; name: string; quantity: number; category: string; unit: string; unit_price?: number }[]> {
  const uid = await getSessionUid();
  if (!uid) return [];

  const supabase = createClient();

  try {
    // Get all items first (we'll filter in code for flexibility)
    const { data, error } = await supabase
      .from('inventory')
      .select('id, item_name, quantity, category, unit, unit_price')
      .eq('owner_id', uid)
      .gt('quantity', 0) // Only items with quantity > 0
      .order('item_name');

    if (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }

    // Filter by category (case-insensitive, flexible matching)
    const normalizedCategories = categories.map(c => c.toLowerCase());
    const filtered = (data || []).filter((item: any) => {
      const itemCategory = (item.category || '').toLowerCase();
      return normalizedCategories.some(cat => 
        itemCategory.includes(cat) || cat.includes(itemCategory) ||
        // Also match common aliases
        (cat.includes('treatment') || cat.includes('medication') || cat.includes('lek')) && 
        (itemCategory.includes('lek') || itemCategory.includes('medication') || itemCategory.includes('treatment')) ||
        (cat.includes('feed') || cat.includes('karm') || cat.includes('pokarm')) && 
        (itemCategory.includes('karm') || itemCategory.includes('feed') || itemCategory.includes('cukier') || itemCategory.includes('pokarm'))
      );
    });

    return filtered.map((item: any) => ({
      id: item.id,
      name: item.item_name,
      quantity: parseFloat(item.quantity) || 0, // Support decimals
      category: item.category || 'OTHER',
      unit: item.unit || 'szt',
      unit_price: item.unit_price ? parseFloat(item.unit_price) : undefined
    }));
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    return [];
  }
}

/**
 * Decrement inventory quantity (supports fractional quantities)
 * Returns success/error
 */
export async function decrementInventory(
  itemId: string,
  quantity: number // Can be fractional (e.g., 1.5 kg)
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // First, get current quantity (now supports decimals)
    const { data: item, error: fetchError } = await supabase
      .from('inventory')
      .select('quantity, owner_id, unit')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return { success: false, error: 'Item not found' };
    }

    // Verify ownership
    if (item.owner_id !== uid) {
      return { success: false, error: 'Access denied' };
    }

    // Parse quantities as decimals
    const currentQty = parseFloat(String(item.quantity)) || 0;
    const requestedQty = parseFloat(String(quantity)) || 0;

    // Check if enough quantity
    if (currentQty < requestedQty) {
      const unit = item.unit || 'szt';
      return { 
        success: false, 
        error: `Niewystarczająca ilość w magazynie. Dostępne: ${currentQty.toFixed(currentQty % 1 === 0 ? 0 : 2)} ${unit}, wymagane: ${requestedQty.toFixed(requestedQty % 1 === 0 ? 0 : 2)} ${unit}` 
      };
    }

    // Decrement quantity (support decimals)
    const newQuantity = Math.max(0, currentQty - requestedQty);

    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', itemId)
      .eq('owner_id', uid); // Additional safety check

    if (updateError) {
      console.error('Error decrementing inventory:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get inventory item details (now includes unit and unit_price)
 */
export async function getInventoryItem(
  itemId: string
): Promise<{ id: string; name: string; quantity: number; category: string; unit: string; unit_price?: number } | null> {
  const uid = await getSessionUid();
  if (!uid) return null;

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('id, item_name, quantity, category, unit, unit_price')
      .eq('id', itemId)
      .eq('owner_id', uid)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.item_name,
      quantity: parseFloat(String(data.quantity)) || 0, // Support decimals
      category: data.category || 'OTHER',
      unit: data.unit || 'szt',
      unit_price: data.unit_price ? parseFloat(String(data.unit_price)) : undefined
    };
  } catch (err) {
    return null;
  }
}

/**
 * Get inventory items by physical type (for hive deployment)
 * Returns items matching BOTTOM_BOARD, ROOF, HIVE_BODY_FULL, HIVE_BODY_HALF
 */
export async function getInventoryItemsByPhysicalType(
  type: 'BOTTOM_BOARD' | 'ROOF' | 'HIVE_BODY_FULL' | 'HIVE_BODY_HALF',
  hiveType?: string // Optional: filter by hive type (e.g., "Wielkopolski")
): Promise<Array<{ id: string; name: string; quantity: number; category: string; unit: string; hiveType?: string }>> {
  const uid = await getSessionUid();
  if (!uid) return [];

  const supabase = createClient();

  try {
    // Build search patterns based on type
    let searchPatterns: string[] = [];
    
    switch (type) {
      case 'BOTTOM_BOARD':
        searchPatterns = ['%denk%', '%bottom%', '%podstaw%', '%dno%'];
        break;
      case 'ROOF':
        searchPatterns = ['%dasz%', '%roof%', '%dach%', '%pokryw%'];
        break;
      case 'HIVE_BODY_FULL':
        searchPatterns = ['%korpus%', '%body%', '%pełn%', '%full%'];
        // Exclude half bodies
        break;
      case 'HIVE_BODY_HALF':
        searchPatterns = ['%pół%', '%half%', '%nadstaw%'];
        break;
    }

    // Build query - search by name and category
    let query = supabase
      .from('inventory')
      .select('id, item_name, quantity, category, unit')
      .eq('owner_id', uid)
      .gt('quantity', 0);

    // Apply search patterns
    if (searchPatterns.length > 0) {
      const orConditions = searchPatterns
        .map(pattern => `item_name.ilike.${pattern}`)
        .join(',');
      
      // Also search in category
      const categoryPatterns = searchPatterns
        .map(pattern => `category.ilike.${pattern}`)
        .join(',');
      
      query = query.or(`${orConditions},${categoryPatterns}`);
    }

    // Exclude unwanted items for FULL bodies
    if (type === 'HIVE_BODY_FULL') {
      query = query
        .not('item_name', 'ilike', '%pół%')
        .not('item_name', 'ilike', '%half%')
        .not('item_name', 'ilike', '%nadstaw%');
    }

    const { data, error } = await query.order('item_name', { ascending: true });

    if (error) {
      console.error('Error fetching inventory items by type:', error);
      return [];
    }

    // Filter and map results
    const items = (data || []).map((item: any) => ({
      id: item.id,
      name: item.item_name,
      quantity: parseFloat(String(item.quantity)) || 0,
      category: item.category || 'OTHER',
      unit: item.unit || 'szt',
      hiveType: hiveType ? (item.item_name.toLowerCase().includes(hiveType.toLowerCase()) ? hiveType : undefined) : undefined,
    }));

    // If hiveType is specified, prefer items matching that type
    if (hiveType) {
      const matchingItems = items.filter(item => item.hiveType);
      if (matchingItems.length > 0) {
        return matchingItems;
      }
    }

    return items;
  } catch (err) {
    console.error('Error fetching inventory items by physical type:', err);
    return [];
  }
}

