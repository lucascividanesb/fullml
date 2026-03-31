import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import db from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Notifications');

export async function GET(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accountId = tokenData.user_id;

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE ml_account_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all(accountId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE ml_account_id = ? AND is_read = 0
    `).get(accountId).count;

    return NextResponse.json({
      notifications,
      unread_count: unreadCount
    });

  } catch (err) {
    logger.error('Notifications API error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accountId = tokenData.user_id;
    const { id } = await request.json();

    if (id === 'all') {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE ml_account_id = ?').run(accountId);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND ml_account_id = ?').run(id, accountId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
