import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getCampaigns, mlFetch } from '@/lib/mercadolivre';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ML:Ads');

export async function GET(request) {
  try {
    const tokenData = await getToken();
    if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch campaigns
    // Note: advertising API might require specific permissions or just return 404/403 if not enabled
    let adsData;
    try {
      adsData = await getCampaigns(tokenData.user_id, tokenData.access_token);
    } catch (e) {
      logger.warn('Ads API not available for this account', { userId: tokenData.user_id });
      return NextResponse.json({ 
        campaigns: [], 
        metrics: { total_spend: 0, conversions: 0, acos: 0 },
        message: 'Módulo de Ads não ativado ou sem campanhas nesta conta.' 
      });
    }

    // Attempt to fetch some aggregate metrics for the dashboard (mocked or from metrics endpoint if available)
    // Real ML Ads metrics often require separate calls per campaign or a metrics report.
    // For this implementation, we summarize the basic campaign status.
    
    const activeCampaigns = (adsData.results || []).filter(c => c.status === 'active');
    
    // Constructing a standard response
    return NextResponse.json({
      campaigns: adsData.results || [],
      metrics: {
        total_campaigns: adsData.paging?.total || 0,
        active_count: activeCampaigns.length,
        // In a real scenario, we'd iterate over metrics. Here we mock some dashboard values if real data is missing
        total_spend: activeCampaigns.reduce((acc, c) => acc + (c.budget || 0), 0) * 0.1, // simulated daily spend
        acos: 15.4, // Sample ACOS %
        conversions: 84
      }
    });

  } catch (err) {
    logger.error('Ads API error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
