import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/mercadolivre';
import { getToken } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Orders');

export async function GET(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = {};
    
    if (searchParams.get('offset')) params.offset = searchParams.get('offset');
    if (searchParams.get('limit')) params.limit = searchParams.get('limit');
    if (searchParams.get('order_status')) params['order.status'] = searchParams.get('order_status');
    if (searchParams.get('date_from')) params['order.date_created.from'] = searchParams.get('date_from');
    if (searchParams.get('date_to')) params['order.date_created.to'] = searchParams.get('date_to');

    const orders = await getOrders(tokenData.user_id, tokenData.access_token, params);
    
    console.log(`[API:Orders] Chamando ML para Seller ${tokenData.user_id}. Resultados: ${orders.results?.length || 0}`);

    logger.info('GET request processed', { 
      seller_id: tokenData.user_id,
      returnedResults: orders.results?.length || 0,
      total: orders.paging?.total || 0
    });

    return NextResponse.json(orders);
  } catch (err) {
    logger.error('Orders API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
