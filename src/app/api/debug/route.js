import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      ML_APP_ID: process.env.ML_APP_ID ? `✅ (${process.env.ML_APP_ID.slice(0,6)}...)` : '❌ NÃO CONFIGURADO',
      ML_CLIENT_SECRET: process.env.ML_CLIENT_SECRET ? `✅ (${process.env.ML_CLIENT_SECRET.slice(0,4)}...)` : '❌ NÃO CONFIGURADO',
      ML_REDIRECT_URI: process.env.ML_REDIRECT_URI || '❌ NÃO CONFIGURADO',
      BASE_URL: process.env.BASE_URL || '❌ NÃO CONFIGURADO',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
    },
    token: null,
    ml_test: null,
  };

  try {
    const tokenData = await getToken();
    if (!tokenData) {
      diagnostics.token = { status: '❌ Sem token - Usuário não autenticado' };
    } else {
      const now = Date.now();
      const expiresAt = tokenData.expires_at;
      const isExpired = now >= expiresAt - 60000;
      diagnostics.token = {
        status: isExpired ? '⚠️ EXPIRADO' : '✅ Válido',
        user_id: tokenData.user_id,
        expires_at: new Date(expiresAt).toISOString(),
        expires_in_minutes: Math.round((expiresAt - now) / 60000),
        token_preview: tokenData.access_token ? `${tokenData.access_token.slice(0,12)}...` : 'null',
        has_refresh: !!tokenData.refresh_token,
      };

      // Test ML API call
      try {
        const testRes = await fetch(`https://api.mercadolibre.com/users/${tokenData.user_id}`, {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const testBody = await testRes.json();
        diagnostics.ml_test = {
          status: testRes.status,
          ok: testRes.ok,
          nickname: testBody.nickname || null,
          error: testBody.message || testBody.error || null,
        };
      } catch (e) {
        diagnostics.ml_test = { status: 'ERRO', error: e.message };
      }
    }
  } catch (e) {
    diagnostics.token = { status: '❌ Erro ao obter token', error: e.message };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
