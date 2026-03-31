import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Goals');

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const month = searchParams.get('month'); // YYYY-MM

    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
    }

    let query = 'SELECT * FROM account_goals WHERE ml_account_id = ?';
    const params = [accountId];

    if (month) {
      query += ' AND month = ?';
      params.push(month);
    }

    const goals = db.prepare(query).all(...params);
    return NextResponse.json(goals);
  } catch (err) {
    logger.error('Error fetching goals', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { accountId, month, target } = body;

    if (!accountId || !month || target === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO account_goals (ml_account_id, month, target_revenue)
      VALUES (?, ?, ?)
      ON CONFLICT(ml_account_id, month) DO UPDATE SET target_revenue = excluded.target_revenue
    `);

    stmt.run(accountId, month, target);
    
    logger.info('Goal updated', { accountId, month, target });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Error saving goal', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
