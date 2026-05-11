// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      const authUid = await handleGroobyteCallback(request);

      const cleanUrl = new URL('/', request.url);
      const response = NextResponse.redirect(cleanUrl);

      // Mark this redirect so we don't double-log
      response.cookies.set('_redirect', '1', {
        httpOnly: true,
        path: '/',
        maxAge: 10,
      });

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
    } else {
      // Only log if this isn't our own redirect
      const isRedirect = request.cookies.get('_redirect')?.value === '1';
      if (!isRedirect) {
        await logVisit(request);
      } else {
        // Clear the flag and continue
        const response = NextResponse.next();
        response.cookies.delete('_redirect');
        return response;
      }
    }
  }

  return NextResponse.next();
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
  });

  if (error) {
    console.error('Failed to log visit:', error);
  }
}

/**
 * Normalize phone number to E.164 format.
 */
function normalizePhone(raw: string): string | null {
  let cleaned = raw.replace(/[^\d+]/g, '');

  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  cleaned = '+' + cleaned.slice(1).replace(/\+/g, '');

  if (!/^\+\d{7,15}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
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

  const supabaseAdmin = getSupabaseAdmin();

  // 1. Log the JWT callback
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
  });

  if (error) {
    console.error('Failed to insert groobyte_callback:', error);
  }

  // 2. Normalize phone number to E.164
  const rawMsisdn = payload.userId ?? null;
  if (!rawMsisdn) return null;

  const msisdn = normalizePhone(rawMsisdn);
  if (!msisdn) return null;

  // 3. Look up existing auth user by phone first
  let supabaseAuthId: string | null = null;

  const { data: existingId } = await supabaseAdmin
    .rpc('get_auth_user_id_by_phone', { phone_input: msisdn });

  if (existingId) {
    supabaseAuthId = existingId;
  } else {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      phone: msisdn,
      phone_confirm: true,
    });

    if (newUser?.user) {
      supabaseAuthId = newUser.user.id;
    } else if (createError) {
      console.error('Auth user creation error:', createError);
    }
  }

  // 4. Upsert user_profiles
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .upsert(
      {
        msisdn,
        supabase_auth_id: supabaseAuthId,
        updated_at: new Date().toISOString(),
      },
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
