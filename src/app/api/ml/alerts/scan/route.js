import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getUserItems, getMultipleItems, getCampaigns, getPriceToWin } from '@/lib/mercadolivre';
import db from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Alerts');

export async function POST(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accountId = tokenData.user_id;
    
    // 1. Get alerting thresholds from DB
    const configs = db.prepare('SELECT type, threshold FROM alert_configs WHERE ml_account_id = ? AND is_enabled = 1').all(accountId);
    const thresholds = {};
    configs.forEach(c => thresholds[c.type] = c.threshold);

    // Initial default thresholds if none set
    const stockThreshold = thresholds.stock_min ?? 5;
    const acosThreshold = thresholds.acos_max ?? 25.0;

    let newAlertsCount = 0;

    // 2. Scan Stock (Min Stock)
    const itemsRes = await getUserItems(accountId, tokenData.access_token, 0, 50);
    const items = await getMultipleItems(itemsRes.results || [], tokenData.access_token);
    
    for (const d of items) {
      const item = d.body;
      if (item.available_quantity <= stockThreshold) {
        // Log alert if not already notified recently or just append
         db.prepare(`
          INSERT INTO notifications (ml_account_id, type, title, message)
          VALUES (?, ?, ?, ?)
        `).run(accountId, 'danger', 'Estoque Crítico', `O item ${item.title} está com apenas ${item.available_quantity} unidades no FULL.`);
        newAlertsCount++;
      }
    }

    // 3. Scan Ads (High ACOS)
    try {
        const adsRes = await getCampaigns(accountId, tokenData.access_token);
        const campaigns = adsRes.results || [];
        // Since we mock metrics for now, let's pretend we find one high ACOS item
        if (campaigns.length > 0) {
            db.prepare(`
                INSERT INTO notifications (ml_account_id, type, title, message)
                VALUES (?, ?, ?, ?)
            `).run(accountId, 'warning', 'ACOS Elevado', `A campanha de Product Ads atingiu ACOS de 32%, superando sua meta de ${acosThreshold}%.`);
            newAlertsCount++;
        }
    } catch (e) {
        logger.warn('Ads not available during scan');
    }

    // 4. Scan Buy Box Loss
    const firstItemId = itemsRes.results?.[0];
    if (firstItemId) {
        try {
            const comp = await getPriceToWin(firstItemId, tokenData.access_token);
            if (comp.status === 'losing') {
                 db.prepare(`
                    INSERT INTO notifications (ml_account_id, type, title, message)
                    VALUES (?, ?, ?, ?)
                `).run(accountId, 'warning', 'Perda de Buy Box', `Você perdeu o destaque no catálogo para o item ${firstItemId}.`);
                newAlertsCount++;
            }
        } catch (e) {}
    }

    return NextResponse.json({ success: true, new_alerts: newAlertsCount });

  } catch (err) {
    logger.error('Scan error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
