// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CONTENT_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE || 'nsfw';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  const jwt = searchParams.get('jwt');

  if (pathname === '/') {
    if (jwt) {
      const result = await handleGroobyteCallback(request);

      const cleanUrl = new URL('/', request.url);
      const response = NextResponse.redirect(cleanUrl);

      if (result?.carrierUserId) {
        response.cookies.set('carrier_user_id', result.carrierUserId, {
          httpOnly: false,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      return response;
    } else {
      await logVisit(request);
    }
  }

  return NextResponse.next();
}

/**
 * Handle Groobyte JWT callback.
 * Only decodes the JWT and logs to groobyte_callbacks.
 * User creation and profile upsert are handled by /api/auth/provision.
 */
async function handleGroobyteCallback(request: NextRequest): Promise<{ carrierUserId: string | null }> {
  const { searchParams } = request.nextUrl;
  const rawJwt = searchParams.get('jwt');
  if (!rawJwt) return { carrierUserId: null };

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

  const supabaseAdmin = getSupabaseAdmin();

  // Log the callback — this is the only DB operation in the middleware
  const { error } = await supabaseAdmin.from('groobyte_callbacks').insert({
    raw_url: request.nextUrl.toString(),
    raw_jwt: rawJwt,
    has_jwt: true,
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
    content_rating: CONTENT_MODE,
  });

  if (error) {
    console.error('Failed to insert groobyte_callback:', error);
  }

  return { carrierUserId: payload.userId ?? null };
}

/**
 * Log a visit without JWT.
 */
async function logVisit(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.from('groobyte_callbacks').insert({
    raw_url: request.nextUrl.toString(),
    has_jwt: false,
    track: searchParams.get('track'),
    pubid: searchParams.get('pubid'),
    clickid: searchParams.get('clickid'),
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
    tid: searchParams.get('tid'),
    raw_jwt: null,
    carrier_user_id: null,
    product_id: null,
    plan_type: null,
    reason: null,
    jwt_iat: null,
    jwt_exp: null,
    jwt_verified: false,
    notes: 'visit_without_jwt',
    content_rating: CONTENT_MODE,
  });

  if (error) {
    console.error('Failed to log visit:', error);
  }
}

export const config = {
  matcher: '/',
};
