import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getInbounds } from '@/lib/mercadolivre';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Inbounds');

export async function GET() {
  try {
    const tokenData = await getToken();
    if (!tokenData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    logger.info('GET request received, looking up active inbound shipments');

    const inbounds = await getInbounds(tokenData.user_id, tokenData.access_token);
    
    // Process inbound shipments to normalize format for the front-end
    const shipments = (inbounds?.results || []).map(sh => ({
      id: sh.id,
      status: sh.status,
      date_created: sh.date_created,
      estimated_delivery: sh.estimated_delivery_time,
      declared_units: sh.declared_units || 0,
      received_units: sh.received_units || 0,
      destination: sh.destination_id || 'Full Center'
    }));

    return NextResponse.json({ shipments });
  } catch (err) {
    logger.error('Inbounds API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
