import { NextResponse } from 'next/server';
import { getSessionUser, getUserAccounts, getAccountTokens, isTokenExpired } from '@/lib/auth';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      ML_APP_ID: process.env.ML_APP_ID ? `OK (${process.env.ML_APP_ID.slice(0,6)}...)` : 'FALTANDO',
      ML_CLIENT_SECRET: process.env.ML_CLIENT_SECRET ? `OK (${process.env.ML_CLIENT_SECRET.slice(0,4)}...)` : 'FALTANDO',
      ML_SECRET: process.env.ML_SECRET ? `OK` : 'FALTANDO',
      ML_REDIRECT_URI: process.env.ML_REDIRECT_URI || 'FALTANDO',
      BASE_URL: process.env.BASE_URL || 'FALTANDO',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
    },
    session: null,
    accounts: null,
    token_status: null,
  };

  try {
    const user = await getSessionUser();
    diagnostics.session = user ? { id: user.id, name: user.name, role: user.role } : 'NAO AUTENTICADO';

    if (user) {
      const accounts = await getUserAccounts(user.id);
      diagnostics.accounts = accounts.map(a => ({ id: a.id, nickname: a.nickname }));

      if (accounts.length > 0) {
        const tokens = await getAccountTokens(accounts[0].id);
        const now = Date.now();
        const expired = isTokenExpired(tokens.token_expires_at);
        diagnostics.token_status = {
          seller_id: accounts[0].id,
          expired: expired,
          expires_at: tokens.token_expires_at ? new Date(tokens.token_expires_at).toISOString() : 'null',
          minutes_remaining: tokens.token_expires_at ? Math.round((tokens.token_expires_at - now) / 60000) : 'N/A',
          has_access_token: !!tokens.access_token,
          has_refresh_token: !!tokens.refresh_token,
          access_token_preview: tokens.access_token ? tokens.access_token.slice(0, 15) + '...' : 'VAZIO',
        };
      }
    }
  } catch (e) {
    diagnostics.error = e.message;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
