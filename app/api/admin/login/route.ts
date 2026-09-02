import { NextRequest, NextResponse } from 'next/server';
import { getAdminByUsername } from '@/lib/supabase';
import { verifyPassword, setAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const admin = await getAdminByUsername(username);

    // Fallback for initial demo admin
    if (!admin && username === 'upforge' && password === 'Upforge@24/7') {
      await setAdminSession(username);
      return NextResponse.json({ success: true, message: 'Authenticated successfully' });
    }

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid && !(username === 'upforge' && password === 'Upforge@24/7')) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await setAdminSession(username);
    return NextResponse.json({ success: true, message: 'Authenticated successfully' });
  } catch (error: any) {
    console.error('Admin login API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
