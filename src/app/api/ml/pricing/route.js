import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getUserItems, getMultipleItems, getPriceToWin } from '@/lib/mercadolivre';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Pricing');

export async function GET(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10'); // limit to few items for quick competition check

    // Get item IDs
    const searchResult = await getUserItems(tokenData.user_id, tokenData.access_token, 0, limit);
    const itemIds = searchResult.results || [];
    
    // Fetch basic details
    const itemsDetails = await getMultipleItems(itemIds, tokenData.access_token);
    
    // Fetch competition data for each (concurrently)
    const competitionData = await Promise.all(
      itemIds.map(id => getPriceToWin(id, tokenData.access_token).catch(() => null))
    );

    const enrichedItems = itemsDetails.map((d, index) => {
      const item = d.body;
      const comp = competitionData[index];
      
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        thumbnail: item.thumbnail,
        permalink: item.permalink,
        catalog_listing: item.catalog_listing,
        competition: comp ? {
          status: comp.status, // winning, losing, sharing_first_place
          price_to_win: comp.price_to_win,
          competitor_price: comp.best_offer?.price || null,
          is_winner: comp.status === 'winning' || comp.status === 'sharing_first_place'
        } : null
      };
    });

    return NextResponse.json({ items: enrichedItems });

  } catch (err) {
    logger.error('Pricing API error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  // Logic for updating price will go here
  return NextResponse.json({ message: 'Use PUT to update price' });
}
