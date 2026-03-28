import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getShipmentLabels } from '@/lib/mercadolivre';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Labels');

export async function GET(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const itemIds = searchParams.get('items') || 'INV-123';

    // Call ML to get bulk labels PDF
    const res = await getShipmentLabels(itemIds.split(','), tokenData.access_token);
    
    // In a real environment, ML gives a PDF buffer or URL
    // We mock returning the dummy PDF URL and redirecting
    if (res.pdf_url) {
       return NextResponse.redirect(res.pdf_url);
    }
    
    return NextResponse.json(res);

  } catch (err) {
    logger.error('Error generating labels', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
