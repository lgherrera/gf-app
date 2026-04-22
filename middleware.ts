// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  console.log('🔥 MIDDLEWARE RAN', request.nextUrl.toString());

  const { searchParams, pathname } = request.nextUrl;
  const jwt = searchParams.get('jwt');

  // Only intercept if we're at the root AND there's a jwt param
  if (pathname === '/' && jwt) {
    await handleGroobyteCallback(request);
    
    // Redirect to clean root URL (no query params)
    const cleanUrl = new URL('/', request.url);
    return NextResponse.redirect(cleanUrl);
  }

  // No JWT or different path — let the request continue normally
  return NextResponse.next();
}

async function handleGroobyteCallback(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawJwt = searchParams.get('jwt');
  if (!rawJwt) return;

  // Decode JWT payload WITHOUT verifying signature (learning phase only)
  // TODO(before production): Add JWT signature verification using Groobyte's public key
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

  const { error } = await supabaseAdmin.from('groobyte_callbacks').insert({
    raw_url: request.nextUrl.toString(),
    raw_jwt: rawJwt,

    // Query string parameters
    track: searchParams.get('track'),
    pubid: searchParams.get('pubid'),
    clickid: searchParams.get('clickid'),
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
    tid: searchParams.get('tid'),

    // Decoded JWT claims
    carrier_user_id: payload.userId ?? null,
    product_id: payload.productId ?? null,
    plan_type: payload.planType ?? null,
    reason: payload.reason ?? null,
    jwt_iat: payload.iat ?? null,
    jwt_exp: payload.exp ?? null,

    // Processing metadata
    jwt_verified: false,
    notes: 'learning_phase_no_verification',
  });

  if (error) {
    console.error('Failed to insert groobyte_callback:', error);
  }

  // Upsert into user_profiles
  const carrier_user_id = payload.userId ?? null;
  if (carrier_user_id) {
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        { carrier_user_id },
        { onConflict: 'carrier_user_id' }
      );

    if (profileError) {
      console.error('user_profiles upsert error:', profileError);
    }
  }
}

export const config = {
  matcher: '/',
};
