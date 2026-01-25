import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { reconcileHiveLimits } from '@/app/actions/reconcile-hive-limits';

/**
 * Cron job endpoint for hive limit reconciliation
 * 
 * Runs reconciliation for all users to:
 * 1. Lock NUCs that exceed their validity period
 * 2. Lock excess hives based on plan limits (FIFO)
 * 3. Unlock hives if plan upgrade allows it
 * 
 * This endpoint should be called by Vercel Cron or external cron service
 * Example Vercel Cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reconcile-hive-limits",
 *     "schedule": "0 3 * * *" // Daily at 3 AM
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
    processed: 0,
    totalTimeExpiredLocks: 0,
    totalPlanLimitLocks: 0,
    totalUnlocks: 0,
    errors: [] as string[],
    userResults: [] as Array<{
      userId: string;
      email: string;
      timeExpiredLocks: number;
      planLimitLocks: number;
      unlocks: number;
      errors: string[];
    }>,
  };

  try {
    // Get all users (not just FREE, as reconciliation applies to all plans)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, subscription_plan');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found', results });
    }

    // Process each user
    for (const user of users) {
      try {
        const reconciliationResult = await reconcileHiveLimits(
          user.id,
          user.subscription_plan || 'FREE'
        );

        results.totalTimeExpiredLocks += reconciliationResult.timeExpiredLocks;
        results.totalPlanLimitLocks += reconciliationResult.planLimitLocks;
        results.totalUnlocks += reconciliationResult.unlocks;
        results.processed++;

        results.userResults.push({
          userId: user.id,
          email: user.email || 'Unknown',
          timeExpiredLocks: reconciliationResult.timeExpiredLocks,
          planLimitLocks: reconciliationResult.planLimitLocks,
          unlocks: reconciliationResult.unlocks,
          errors: reconciliationResult.errors,
        });

        if (reconciliationResult.errors.length > 0) {
          results.errors.push(
            `User ${user.email}: ${reconciliationResult.errors.join('; ')}`
          );
        }
      } catch (err: any) {
        const errorMsg = `Error processing user ${user.id}: ${err.message}`;
        results.errors.push(errorMsg);
        console.error(errorMsg, err);
      }
    }

    console.log('[reconcile-hive-limits-cron] Completed:', {
      processed: results.processed,
      totalTimeExpiredLocks: results.totalTimeExpiredLocks,
      totalPlanLimitLocks: results.totalPlanLimitLocks,
      totalUnlocks: results.totalUnlocks,
      errors: results.errors.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Hive limit reconciliation job completed',
      results,
    });
  } catch (error: any) {
    console.error('Error in hive limit reconciliation cron job:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error', results },
      { status: 500 }
    );
  }
}
