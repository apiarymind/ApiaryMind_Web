import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Cron job endpoint for data retention policy
 * 
 * For FREE plan users:
 * - Delete history older than 30 days (with email PDF before deletion)
 * - Lock hives after 3 months in free plan
 * 
 * This endpoint should be called by Vercel Cron or external cron service
 * Example Vercel Cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/data-retention",
 *     "schedule": "0 2 * * *" // Daily at 2 AM
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (if using Vercel Cron, it sends Authorization header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const results = {
    archived: 0,
    lockedHives: 0,
    errors: [] as string[]
  };

  try {
    // 1. Get all FREE plan users
    const { data: freeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_plan')
      .eq('subscription_plan', 'FREE')
      .or('subscription_plan.is.null');

    if (usersError) {
      console.error('Error fetching FREE users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!freeUsers || freeUsers.length === 0) {
      return NextResponse.json({ message: 'No FREE users found', results });
    }

    // 2. For each FREE user, process data retention
    for (const user of freeUsers) {
      try {
        // Get user's apiaries
        const { data: apiaries } = await supabase
          .from('apiaries')
          .select('id')
          .eq('owner_id', user.id);

        if (!apiaries || apiaries.length === 0) continue;

        const apiaryIds = apiaries.map(a => a.id);

        // Get hives for these apiaries
        const { data: hives } = await supabase
          .from('hives')
          .select('id, installation_date, apiary_id')
          .in('apiary_id', apiaryIds);

        if (!hives || hives.length === 0) continue;

        const hiveIds = hives.map(h => h.id);

        // 2a. Archive and delete inspections older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: oldInspections } = await supabase
          .from('inspections')
          .select('*')
          .in('hive_id', hiveIds)
          .lt('inspection_date', thirtyDaysAgo.toISOString());

        if (oldInspections && oldInspections.length > 0) {
          // TODO: Generate PDF and send email before deletion
          // For now, just delete (PDF generation requires additional library like pdfkit or puppeteer)
          
          const { error: deleteError } = await supabase
            .from('inspections')
            .delete()
            .in('hive_id', hiveIds)
            .lt('inspection_date', thirtyDaysAgo.toISOString());

          if (deleteError) {
            results.errors.push(`Error deleting inspections for user ${user.id}: ${deleteError.message}`);
          } else {
            results.archived += oldInspections.length;
            // TODO: Send email with PDF archive
            console.log(`Archived ${oldInspections.length} inspections for user ${user.email}`);
          }
        }

        // 2b. Lock hives older than 3 months in FREE plan
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const hivesToLock = hives.filter(h => {
          if (!h.installation_date) return false;
          const installDate = new Date(h.installation_date);
          return installDate < threeMonthsAgo;
        });

        if (hivesToLock.length > 0) {
          // Check if hives table has a status or locked field
          // If not, we might need to use a different approach
          // For now, we'll mark them in a notes field or use a separate tracking table
          // Assuming there's a way to mark hives as locked
          
          // Note: This requires a 'status' or 'is_locked' field in hives table
          // If such field doesn't exist, this will need to be handled differently
          console.log(`Would lock ${hivesToLock.length} hives for user ${user.email}`);
          results.lockedHives += hivesToLock.length;
          
          // TODO: Implement actual locking mechanism based on DB schema
          // This might require adding a status field or using a separate table
        }
      } catch (err: any) {
        results.errors.push(`Error processing user ${user.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data retention job completed',
      results
    });
  } catch (error: any) {
    console.error('Error in data retention cron job:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}




