import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const configs = db.prepare('SELECT type, threshold, is_enabled FROM alert_configs WHERE ml_account_id = ?').all(tokenData.user_id);
    
    // Transform to object for easier UI use
    const configMap = {};
    configs.forEach(c => configMap[c.type] = { threshold: c.threshold, is_enabled: c.is_enabled });

    return NextResponse.json(configMap);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const accountId = tokenData.user_id;

    // Use a transaction for atomic updates
    const insert = db.prepare(`
      INSERT INTO alert_configs (ml_account_id, type, threshold, is_enabled)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(ml_account_id, type) DO UPDATE SET
      threshold = excluded.threshold,
      is_enabled = excluded.is_enabled
    `);

    const transaction = db.transaction((data) => {
      if (data.stock_min !== undefined) insert.run(accountId, 'stock_min', data.stock_min, 1);
      if (data.acos_max !== undefined) insert.run(accountId, 'acos_max', data.acos_max, 1);
      if (data.buybox_loss !== undefined) insert.run(accountId, 'buybox_loss', data.buybox_loss, data.buybox_loss ? 1 : 0);
    });

    transaction(body);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
