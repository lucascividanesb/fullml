import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { updateItemPrice } from '@/lib/mercadolivre';
import db from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Items:Price');

export async function PUT(request, { params }) {
  try {
    const { id: itemId } = params;
    const { price } = await request.json();
    const tokenData = await getToken();

    if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!price || price <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 });

    logger.info('Updating price', { itemId, price });

    // 1. Update in ML
    const mlResponse = await updateItemPrice(itemId, price, tokenData.access_token);

    // 2. Log in our item_configs if exists or just let it be
    // We could store the "Manual Update" in a price history table here
    
    return NextResponse.json({ success: true, item: mlResponse });

  } catch (err) {
    logger.error('Price update error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
