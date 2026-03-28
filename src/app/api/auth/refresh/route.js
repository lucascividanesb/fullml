import { NextResponse } from 'next/server';
import { refreshToken } from '@/lib/mercadolivre';
import { getToken, saveToken, isTokenExpired } from '@/lib/auth';

export async function POST() {
  try {
    const tokenData = await getToken();
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isTokenExpired(tokenData)) {
      return NextResponse.json({ 
        access_token: tokenData.access_token,
        message: 'Token still valid' 
      });
    }

    // Refresh the token
    const newTokenData = await refreshToken(tokenData.refresh_token);
    newTokenData.expires_at = Date.now() + (newTokenData.expires_in * 1000);
    
    await saveToken(newTokenData);

    return NextResponse.json({ 
      access_token: newTokenData.access_token,
      message: 'Token refreshed' 
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
