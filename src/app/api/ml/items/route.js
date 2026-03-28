import { NextResponse } from 'next/server';
import { getUserItems, getMultipleItems } from '@/lib/mercadolivre';
import { getToken } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Items');

export async function GET(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    logger.info('GET request received', { offset, limit });

    // Get item IDs
    const searchResult = await getUserItems(
      tokenData.user_id, 
      tokenData.access_token, 
      offset, 
      limit
    );

    // Get item details in batches of 20
    const itemIds = searchResult.results || [];
    const items = [];

    for (let i = 0; i < itemIds.length; i += 20) {
      const batch = itemIds.slice(i, i + 20);
      if (batch.length > 0) {
        const details = await getMultipleItems(batch, tokenData.access_token);
        items.push(...details.map(d => d.body));
      }
    }

    logger.info('Successfully fetched items', { 
      total: searchResult.paging?.total || 0, 
      fetchedLength: items.length 
    });

    return NextResponse.json({
      items,
      total: searchResult.paging?.total || 0,
      offset,
      limit,
    });
  } catch (err) {
    logger.error('Items API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
