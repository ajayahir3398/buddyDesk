/**
 * Subscription Reconciliation Script
 * 
 * This script reconciles all active subscriptions with the store servers
 * to ensure database is up-to-date. Run this periodically (e.g., daily)
 * to catch any missed webhook notifications.
 * 
 * Usage:
 *   node scripts/reconcileSubscriptions.js
 * 
 * Cron (daily at 2 AM):
 *   0 2 * * * node /app/scripts/reconcileSubscriptions.js
 */

const db = require('../models');
const subscriptionService = require('../services/subscriptionService');
const logger = require('../utils/logger');

async function reconcileAllActiveSubscriptions() {
  try {
    logger.info('Starting subscription reconciliation...');

    // Get all active subscriptions
    const subscriptions = await db.Subscription.findAll({
      where: {
        status: {
          [db.Sequelize.Op.in]: ['active', 'grace_period', 'in_retry', 'on_hold']
        }
      }
    });

    logger.info(`Found ${subscriptions.length} subscriptions to reconcile`);

    let successCount = 0;
    let failureCount = 0;
    let updatedCount = 0;

    // Reconcile each subscription
    for (const subscription of subscriptions) {
      try {
        logger.info(`Reconciling subscription ${subscription.id}`, {
          userId: subscription.user_id,
          platform: subscription.platform,
          productId: subscription.product_id
        });

        const result = await subscriptionService.reconcileSubscription(subscription.id);

        if (result.updated) {
          updatedCount++;
          logger.info(`Subscription ${subscription.id} updated`, {
            oldStatus: subscription.status,
            newStatus: result.subscription.status
          });
        }

        successCount++;

        // Add delay to avoid rate limiting (100ms between requests)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failureCount++;
        logger.error(`Failed to reconcile subscription ${subscription.id}`, {
          error: error.message,
          stack: error.stack
        });
      }
    }

    logger.info('Subscription reconciliation completed', {
      total: subscriptions.length,
      success: successCount,
      failed: failureCount,
      updated: updatedCount
    });

    // Also check for expired subscriptions that should be marked as expired
    await markExpiredSubscriptions();

    process.exit(0);

  } catch (error) {
    logger.error('Subscription reconciliation failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Mark subscriptions as expired if expiry date has passed
 */
async function markExpiredSubscriptions() {
  try {
    const result = await db.Subscription.update(
      { 
        status: 'expired',
        updated_at: new Date()
      },
      {
        where: {
          status: {
            [db.Sequelize.Op.in]: ['active', 'grace_period', 'in_retry']
          },
          expiry_date: {
            [db.Sequelize.Op.lt]: new Date()
          }
        }
      }
    );

    if (result[0] > 0) {
      logger.info(`Marked ${result[0]} subscriptions as expired`);
    }
  } catch (error) {
    logger.error('Failed to mark expired subscriptions', {
      error: error.message
    });
  }
}

// Run the reconciliation
reconcileAllActiveSubscriptions();

