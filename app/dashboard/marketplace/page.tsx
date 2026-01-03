import { getSalesLog, checkRhdAccess, getUserProductsForSale } from "@/app/actions/sales-log";
import MarketplaceClient from "./MarketplaceClient";
import { getSessionUid } from "@/app/actions/auth-session";
import { redirect } from "next/navigation";

export default async function MarketplacePage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  // Fetch data independently to avoid Promise.all failure
  const salesResult = await getSalesLog().catch((err) => {
    console.error('Error fetching sales log in page:', err);
    return { data: [], error: err?.message || 'Error fetching sales' };
  });
  const rhdCheck = await checkRhdAccess().catch(() => ({ hasAccess: false, error: undefined }));
  const userProductsResult = await getUserProductsForSale().catch((err) => {
    console.error('Error fetching user products in page:', err);
    return { data: [], error: err?.message };
  });

  console.log('MarketplacePage: Sales result:', salesResult);
  console.log('MarketplacePage: Sales data sample:', salesResult.data?.[0]);
  console.log('MarketplacePage: User products result:', userProductsResult);
  console.log('MarketplacePage: User products sample:', userProductsResult.data?.[0]);

  return (
    <MarketplaceClient
      initialSales={salesResult.data || []}
      hasRhdAccess={rhdCheck.hasAccess}
      userProducts={userProductsResult.data || []}
      rhdError={rhdCheck.error}
    />
  );
}
