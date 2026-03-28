import { NextResponse } from 'next/server';
import { getSessionUser, getUserAccounts } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const accounts = await getUserAccounts(user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accounts: accounts.map(acc => ({
        id: acc.id,
        nickname: acc.nickname,
        thumbnail: acc.thumbnail,
        email: acc.email,
        is_active: acc.is_active === 1
      }))
    });
  } catch (err) {
    console.error('Session API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
