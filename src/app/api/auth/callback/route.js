import { NextResponse } from 'next/server';
import { exchangeCode, getUser } from '@/lib/mercadolivre';
import { loginWithML } from '@/lib/auth';

export async function GET(request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  
  const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', baseUrl));
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCode(code);
    
    // Add expiry timestamp
    tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
    
    // Get user profile corresponding to the token
    const user = await getUser(tokenData.access_token);
    
    // Process login, save to database and manage ML Accounts integration
    await loginWithML(tokenData, user);

    return NextResponse.redirect(new URL('/dashboard', baseUrl));
  } catch (err) {
    console.error('Auth callback error:', err);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(err.message)}`, baseUrl)
    );
  }
}
