import { NextResponse } from 'next/server';
import { getAuthURL } from '@/lib/mercadolivre';

export async function GET() {
  const authUrl = getAuthURL();
  return NextResponse.redirect(authUrl);
}
