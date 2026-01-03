'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { canAccessFinancialData } from '@/app/utils/security-check';
import { revalidatePath } from 'next/cache';

export interface SalesLogEntry {
  id: string;
  product_id: string;
  quantity_sold: number;
  sale_date: string;
  revenue: number;
  owner_id: string;
  product_name?: string; // Joined from products
  batch_code?: string; // Joined from products
  customer_name?: string; // Optional: odbiorca
}

export interface SalesReportEntry {
  lp: number;
  sale_date: string;
  product_name: string;
  quantity: number;
  unit: string;
  daily_revenue?: number;
  cumulative_revenue?: number;
  customer_name?: string;
  batch_code?: string | null;
  isDailySummary?: boolean; // Flag to mark daily summary rows
}

/**
 * Check if user has RHD/SB number (required for sales logging)
 */
export async function checkRhdAccess(): Promise<{ hasAccess: boolean; error?: string }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { hasAccess: false, error: "Unauthorized" };
    }

    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('rhd_number, shp_number')
      .eq('id', uid)
      .single();

    if (error) {
      return { hasAccess: false, error: error.message };
    }

    const hasRhd = !!(profile?.rhd_number && profile.rhd_number.trim().length > 0);
    const hasShp = !!(profile?.shp_number && profile.shp_number.trim().length > 0);
    const hasAccess = hasRhd || hasShp;

    return { hasAccess };
  } catch (error: any) {
    return { hasAccess: false, error: error.message };
  }
}

/**
 * Get sales log entries with product details
 * "Ślepy Admin" - Only Super Admin or data owner can access
 */
export async function getSalesLog(ownerId?: string, startDate?: string, endDate?: string): Promise<{ data: SalesLogEntry[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const profile = await getCurrentUserProfile(uid);
  
  // "Ślepy Admin" - Check access for non-super-admin users
  if (profile?.role !== 'super_admin') {
    const accessCheck = await canAccessFinancialData(ownerId || uid, 'sales_log');
    if (!accessCheck.allowed) {
      return { data: [], error: accessCheck.reason || 'Forbidden' };
    }
  }

  const supabase = createClient();

  try {
    let query = supabase
      .from('sales_log')
      .select('*')
      .order('sale_date', { ascending: false });

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('sale_date', startDate);
    }
    if (endDate) {
      query = query.lte('sale_date', endDate + 'T23:59:59');
    }

    // Filter by owner - always filter by owner_id for security (even super_admin sees only own data unless ownerId specified)
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    } else {
      // Default: show only own data (even for super_admin for security)
      query = query.eq('owner_id', uid);
    }

    console.log('getSalesLog: Query params - ownerId:', ownerId, 'uid:', uid, 'role:', profile?.role);
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sales log:', error);
      return { data: [], error: error.message };
    }

    console.log('getSalesLog: Raw data from DB:', data);
    console.log('getSalesLog: Data count:', data?.length || 0);

    // Fetch products using the same method as getUserProductsForSale (RLS handles filtering)
    // This ensures we can access products that belong to the user
    let productsMap = new Map();
    if (data && data.length > 0) {
      // Fetch ALL user's products (RLS will filter automatically, just like getUserProductsForSale)
      const { data: allProductsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, batch_code')
        .order('name', { ascending: true });
      
      if (productsError) {
        console.error('getSalesLog: Error fetching products:', productsError);
      } else {
        console.log('getSalesLog: Fetched all user products:', allProductsData?.length || 0);
        
        // Create map from all products
        productsMap = new Map((allProductsData || []).map((p: any) => [p.id, p]));
        
        // Debug: Show what we have
        const productIds = [...new Set(data.map((entry: any) => entry.product_id).filter(Boolean))];
        console.log('getSalesLog: Product IDs from sales_log:', productIds);
        console.log('getSalesLog: ProductsMap keys:', Array.from(productsMap.keys()));
      }
    }

    // Map data with product details
    const mappedData: SalesLogEntry[] = (data || []).map((entry: any) => {
      // Debug: Log entry details
      console.log('getSalesLog: Processing entry:', {
        id: entry.id,
        product_id: entry.product_id,
        product_id_type: typeof entry.product_id,
        productsMap_size: productsMap.size,
        productsMap_has_product: productsMap.has(entry.product_id)
      });
      
      const product = productsMap.get(entry.product_id);
      
      // Try to find product by converting to string if needed
      if (!product && entry.product_id) {
        const productIdStr = String(entry.product_id);
        for (const [key, value] of productsMap.entries()) {
          if (String(key) === productIdStr) {
            console.log('getSalesLog: Found product by string match:', value);
            return {
              id: entry.id,
              product_id: entry.product_id,
              quantity_sold: entry.quantity_sold,
              sale_date: entry.sale_date,
              revenue: entry.revenue,
              owner_id: entry.owner_id,
              product_name: value.name || 'Nieznany produkt',
              batch_code: value.batch_code || null,
              customer_name: entry.customer_name,
            };
          }
        }
      }
      
      console.log(`getSalesLog: Entry product_id: ${entry.product_id}, Found product:`, product);
      
      return {
        id: entry.id,
        product_id: entry.product_id,
        quantity_sold: entry.quantity_sold,
        sale_date: entry.sale_date,
        revenue: entry.revenue,
        owner_id: entry.owner_id,
        product_name: product?.name || 'Nieznany produkt',
        batch_code: product?.batch_code || null,
        customer_name: entry.customer_name,
      };
    });

    console.log('getSalesLog: Mapped data sample (first 2):', JSON.stringify(mappedData.slice(0, 2), null, 2));
    return { data: mappedData, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Unknown error' };
  }
}

/**
 * Add sales log entry
 * Requires RHD/SB number
 */
export async function addSalesLogEntry(
  entryData: {
    product_id: string;
    quantity_sold: number;
    sale_date: string;
    revenue: number;
    customer_name?: string; // Optional odbiorca
  }
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  // Check RHD access
  const rhdCheck = await checkRhdAccess();
  if (!rhdCheck.hasAccess) {
    return { 
      success: false, 
      error: "Aby rejestrować sprzedaż, musisz posiadać numer weterynaryjny RHD lub SHP. Dodaj go w ustawieniach profilu." 
    };
  }

  const profile = await getCurrentUserProfile(uid);
  
  // "Ślepy Admin" - Check access for non-super-admin users
  if (profile?.role !== 'super_admin') {
    const accessCheck = await canAccessFinancialData(uid, 'sales_log');
    if (!accessCheck.allowed) {
      return { success: false, error: accessCheck.reason || 'Forbidden' };
    }
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('sales_log')
    .insert({
      product_id: entryData.product_id,
      quantity_sold: entryData.quantity_sold,
      sale_date: entryData.sale_date,
      revenue: entryData.revenue,
      owner_id: uid
    });

  if (error) {
    console.error('Error adding sales log entry:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/marketplace');
  return { success: true };
}

/**
 * Get RHD report (dzienny z przychodem narastającym od początku roku)
 * Returns entries grouped by date with daily and cumulative revenue from year start
 */
export async function getRhdReport(startDate?: string, endDate?: string): Promise<{ data: SalesReportEntry[]; error: string | null; totalRevenue: number; totalQuantity: number }> {
  const currentYear = new Date().getFullYear();
  const yearStart = startDate || `${currentYear}-01-01`;
  const yearEnd = endDate || `${currentYear}-12-31`;

  const result = await getSalesLog(undefined, yearStart, yearEnd);
  if (result.error) {
    return { ...result, totalRevenue: 0, totalQuantity: 0 };
  }

  const allData = result.data;
  
  // Calculate totals
  const totalRevenue = allData.reduce((sum, entry) => sum + (entry.revenue || 0), 0);
  const totalQuantity = allData.reduce((sum, entry) => sum + (entry.quantity_sold || 0), 0);

  // Group by date
  const groupedByDate: { [date: string]: SalesLogEntry[] } = {};
  allData.forEach(entry => {
    const date = entry.sale_date.split('T')[0]; // Get date part only
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(entry);
  });

  // Sort dates chronologically
  const dates = Object.keys(groupedByDate).sort();

  // Build report with cumulative revenue from year start
  let cumulativeRevenue = 0;
  let lp = 1;
  const report: SalesReportEntry[] = [];

  dates.forEach(date => {
    const dayEntries = groupedByDate[date];
    const dailyRevenue = dayEntries.reduce((sum, entry) => sum + (entry.revenue || 0), 0);
    const dailyQuantity = dayEntries.reduce((sum, entry) => sum + (entry.quantity_sold || 0), 0);
    
    const dayStartIndex = report.length;
    
    // Add entries for this day - each entry has its own revenue (from entry.revenue)
    dayEntries.forEach(entry => {
      report.push({
        lp: lp++,
        sale_date: date,
        product_name: entry.product_name || 'Nieznany produkt',
        quantity: entry.quantity_sold,
        unit: 'szt',
        daily_revenue: entry.revenue || 0, // Individual product revenue
        cumulative_revenue: 0, // Will be updated after summary
        isDailySummary: false,
      });
    });
    
    // Update cumulative revenue
    cumulativeRevenue += dailyRevenue;
    
    // Update cumulative revenue for all entries of this day
    for (let i = dayStartIndex; i < report.length; i++) {
      report[i].cumulative_revenue = cumulativeRevenue;
    }
    
    // Add daily summary row
    report.push({
      lp: lp++,
      sale_date: date,
      product_name: `Razem dnia ${date}`,
      quantity: dailyQuantity,
      unit: 'szt',
      daily_revenue: dailyRevenue,
      cumulative_revenue: cumulativeRevenue,
      isDailySummary: true,
    });
  });

  return { data: report, error: null, totalRevenue, totalQuantity };
}

/**
 * Get SB report (miesięczny ilościowy - tylko ilości, bez wartości)
 * Returns monthly summary with quantities only
 */
export async function getSbReport(month?: string, year?: number): Promise<{ data: SalesReportEntry[]; error: string | null; totalQuantity: number }> {
  const currentDate = new Date();
  const reportMonth = month || String(currentDate.getMonth() + 1);
  const reportYear = year || currentDate.getFullYear();
  
  const startDate = `${reportYear}-${reportMonth.padStart(2, '0')}-01`;
  const lastDay = new Date(reportYear, parseInt(reportMonth), 0).getDate();
  const endDate = `${reportYear}-${reportMonth.padStart(2, '0')}-${lastDay}`;

  const result = await getSalesLog(undefined, startDate, endDate);
  if (result.error) {
    return { ...result, totalQuantity: 0 };
  }

  const filteredData = result.data;

  // Calculate total quantity
  const totalQuantity = filteredData.reduce((sum, entry) => sum + (entry.quantity_sold || 0), 0);

  // Group by product
  const groupedByProduct: { [productId: string]: { name: string; totalQuantity: number; batchCode?: string } } = {};
  filteredData.forEach(entry => {
    const productId = entry.product_id;
    if (!groupedByProduct[productId]) {
      groupedByProduct[productId] = {
        name: entry.product_name || 'Nieznany produkt',
        totalQuantity: 0,
        batchCode: entry.batch_code,
      };
    }
    groupedByProduct[productId].totalQuantity += entry.quantity_sold;
  });

  // Convert to array and sort by product name
  const report = Object.values(groupedByProduct)
    .map((product, index) => ({
      lp: index + 1,
      product_name: product.name,
      quantity: product.totalQuantity,
      unit: 'szt',
      batch_code: product.batchCode,
    }))
    .sort((a, b) => a.product_name.localeCompare(b.product_name));

  return { data: report, error: null, totalQuantity };
}

/**
 * Get user's products for sale logging
 */
export async function getUserProductsForSale(): Promise<{ data: any[]; error?: string }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      console.error('getUserProductsForSale: No UID found');
      return { data: [], error: "Unauthorized" };
    }

    console.log('getUserProductsForSale: Fetching products for UID:', uid);

    const supabase = createClient();
    
    // Use EXACTLY the same method as getWarehouseData - select('*') without owner_id filter
    // RLS policy should handle filtering automatically
    const { data: productsData, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('getUserProductsForSale: Error fetching products:', error);
      return { data: [], error: error.message };
    }

    // Map to the same format as warehouse (if needed) or just return as is
    const products = (productsData || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      stock: item.stock,
      batch_code: item.batch_code,
      price: item.price,
      owner_id: item.owner_id
    }));

    console.log('getUserProductsForSale: Fetched', products.length, 'products');
    console.log('getUserProductsForSale: Products:', products);
    
    return { data: products };
  } catch (error: any) {
    console.error('getUserProductsForSale: Exception:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Get sales statistics
 */
export async function getSalesStatistics(startDate?: string, endDate?: string): Promise<{ 
  totalRevenue: number; 
  totalQuantity: number; 
  saleCount: number; 
  error: string | null 
}> {
  const result = await getSalesLog(undefined, startDate, endDate);
  if (result.error) {
    return { totalRevenue: 0, totalQuantity: 0, saleCount: 0, error: result.error };
  }

  const totalRevenue = result.data.reduce((sum, entry) => sum + (entry.revenue || 0), 0);
  const totalQuantity = result.data.reduce((sum, entry) => sum + (entry.quantity_sold || 0), 0);
  const saleCount = result.data.length;

  return { totalRevenue, totalQuantity, saleCount, error: null };
}
