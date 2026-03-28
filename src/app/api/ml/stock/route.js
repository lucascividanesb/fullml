import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { mlFetch } from '@/lib/mercadolivre';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Stock');

export async function GET() {
  try {
    const tokenData = await getToken();
    if (!tokenData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    logger.info('GET request received, starting stock/ABC analysis');

    // Get recent orders for stock analysis
    const orders = await mlFetch(
      `/orders/search?seller=${tokenData.user_id}&sort=date_desc&limit=50`,
      tokenData.access_token
    );

    // Build sales velocity map (items sold per item_id)
    const salesMap = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const order of (orders.results || [])) {
      const orderDate = new Date(order.date_created);
      if (orderDate >= thirtyDaysAgo) {
        for (const item of (order.order_items || [])) {
          const id = item.item?.id;
          if (id) {
            if (!salesMap[id]) {
              salesMap[id] = { 
                id, 
                title: item.item.title, 
                sold_qty: 0, 
                revenue: 0 
              };
            }
            salesMap[id].sold_qty += item.quantity;
            salesMap[id].revenue += item.unit_price * item.quantity;
          }
        }
      }
    }

    // Sort by revenue for ABC curve basic data
    const salesData = Object.values(salesMap).sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = salesData.reduce((sum, s) => sum + s.revenue, 0);
    
    let cumulative = 0;
    for (const item of salesData) {
      cumulative += item.revenue;
      item.cumulative_pct = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
      item.abc_class = item.cumulative_pct <= 80 ? 'A' : item.cumulative_pct <= 95 ? 'B' : 'C';
      item.daily_avg = item.sold_qty / 30;
    }

    const totalItemsSold = salesData.reduce((sum, s) => sum + s.sold_qty, 0);

    logger.info('Successfully calculated stock ABC distribution', {
      totalItemsSold,
      totalRevenue,
      analyzedItemsCount: salesData.length
    });

    return NextResponse.json({
      sales_data: salesData,
      total_revenue: totalRevenue,
      total_items_sold: totalItemsSold,
      period_days: 30,
    });
  } catch (err) {
    logger.error('Stock analysis error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
