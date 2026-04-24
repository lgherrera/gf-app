// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  console.log('🔥 MIDDLEWARE RAN', request.nextUrl.toString());

  const { searchParams, pathname } = request.nextUrl;
  const jwt = searchParams.get('jwt');

  if (pathname === '/' && jwt) {
    const authUid = await handleGroobyteCallback(request);
    
    const cleanUrl = new URL('/', request.url);
    const response = NextResponse.redirect(cleanUrl);

    if (authUid) {
      response.cookies.set('carrier_auth_uid', authUid, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  }

  return NextResponse.next();
}

async function handleGroobyteCallback(request: NextRequest): Promise<string | null> {
  const { searchParams } = request.nextUrl;
  const rawJwt = searchParams.get('jwt');
  if (!rawJwt) return null;

  let payload: {
    tid?: string;
    userId?: string;
    productId?: string;
    planType?: string;
    reason?: string;
    iat?: number;
    exp?: number;
  } = {};

  try {
    const base64Payload = rawJwt.split('.')[1];
    const jsonPayload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    payload = JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode JWT payload:', err);
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  // 1. Log the raw callback
  const { error } = await supabaseAdmin.from('groobyte_callbacks').insert({
    raw_url: request.nextUrl.toString(),
    raw_jwt: rawJwt,
    track: searchParams.get('track'),
    pubid: searchParams.get('pubid'),
    clickid: searchParams.get('clickid'),
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
    tid: searchParams.get('tid'),
    carrier_user_id: payload.userId ?? null,
    product_id: payload.productId ?? null,
    plan_type: payload.planType ?? null,
    reason: payload.reason ?? null,
    jwt_iat: payload.iat ?? null,
    jwt_exp: payload.exp ?? null,
    jwt_verified: false,
    notes: 'learning_phase_no_verification',
  });

  if (error) {
    console.error('Failed to insert groobyte_callback:', error);
  }

  // 2. Normalize phone number
  const rawMsisdn = payload.userId ?? null;
  const msisdn = rawMsisdn && !rawMsisdn.startsWith('+') ? `+${rawMsisdn}` : rawMsisdn;
  console.log('📱 MSISDN normalized:', { rawMsisdn, msisdn });

  if (!msisdn) return null;

  // 3. Create or find pre-verified auth user
  let supabaseAuthId: string | null = null;

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    phone: msisdn,
    phone_confirm: true,
  });

  console.log('👤 createUser result:', { newUser: newUser?.user?.id, createError: createError?.message });

  if (newUser?.user) {
    supabaseAuthId = newUser.user.id;
  } else if (createError?.message?.includes('already been registered')) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existing = users?.users?.find(u => u.phone === msisdn);
    supabaseAuthId = existing?.id ?? null;
    console.log('👤 Found existing user:', supabaseAuthId);
  } else if (createError) {
    console.error('Auth user creation error:', createError);
  }

  // 4. Upsert user_profiles
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .upsert(
      { msisdn, supabase_auth_id: supabaseAuthId },
      { onConflict: 'msisdn' }
    );

  if (profileError) {
    console.error('user_profiles upsert error:', profileError);
  }

  return supabaseAuthId;
}

export const config = {
  matcher: '/',
};
