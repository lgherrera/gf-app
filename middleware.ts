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

/**
 * DIAGNOSTIC: coarse device bucket from the User-Agent string.
 * Good enough to split iOS / Android / desktop and rough OS version.
 * NOT a reliable retail model name — browsers increasingly freeze UA model tokens.
 */
function parseDevice(ua: string): string {
  const s = ua.toLowerCase();
  if (/iphone/.test(s)) {
    const m = s.match(/iphone os (\d+[_\d]*)/);
    return m ? `ios${m[1].replace(/_/g, '.')}` : 'ios';
  }
  if (/ipad/.test(s)) return 'ipad';
  if (/android/.test(s)) {
    const m = s.match(/android (\d+(?:\.\d+)?)/);
    return m ? `android${m[1]}` : 'android';
  }
  if (/windows|macintosh|linux|cros/.test(s)) return 'desktop';
  if (!s) return 'none';
  return 'other';
}

/**
 * DIAGNOSTIC: build a short request-classification tag from headers + URL.
 * Goal is to explain the ~95% of new_subscription conversions that arrive
 * without a readable JWT. Three candidate causes we want to tell apart:
 *   1. JWT sits in the URL fragment (#jwt=...) — server can NEVER see it → client-side fix.
 *   2. JWT stripped by a redirect hop before middleware → edge/redirect-config fix.
 *   3. JWT present but on a param name / path we don't read → middleware fix.
 * This tag is folded into the existing `notes` text field (no schema change).
 */
function classifyRequest(request: NextRequest): string {
  const { searchParams } = request.nextUrl;

  // What kind of request is this? (real navigation vs RSC/prefetch echo vs bot)
  const secFetchMode = request.headers.get('sec-fetch-mode') || 'none';
  const secFetchDest = request.headers.get('sec-fetch-dest') || 'none';
  const isRsc = request.headers.get('rsc') === '1';
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    (request.headers.get('purpose') || '').toLowerCase() === 'prefetch' ||
    (request.headers.get('x-purpose') || '').toLowerCase() === 'prefetch';
  const ua = request.headers.get('user-agent') || '';
  const isBot = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slurp|bingpreview/.test(ua.toLowerCase());

  // Is a JWT-shaped value hiding somewhere the server CAN read (i.e. not the fragment)?
  const jwtLike = /eyJ[A-Za-z0-9_-]{10,}\./; // header segment of a JWT
  const altParamNames = ['token', 'access_token', 'sso', 'auth', 'data', 'payload'];
  const altParamHit = altParamNames.find((p) => {
    const v = searchParams.get(p);
    return v && jwtLike.test(v);
  });
  const referer = request.headers.get('referer') || '';
  const refererHasJwt = jwtLike.test(referer);

  const parts = [`mode:${secFetchMode}`, `dest:${secFetchDest}`, `dev:${parseDevice(ua)}`];
  if (isRsc) parts.push('rsc');
  if (isPrefetch) parts.push('prefetch');
  if (isBot) parts.push('bot');
  if (altParamHit) parts.push(`altparam:${altParamHit}`);
  if (refererHasJwt) parts.push('jwt_in_referer');
  return parts.join('|');
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
  const userAgent = request.headers.get('user-agent') || null;

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
    notes: `learning_phase_no_verification [${classifyRequest(request)}]`,
    content_rating: CONTENT_MODE,
    user_agent: userAgent,
  });

  if (error) {
    console.error('Failed to insert groobyte_callback:', error);
  }

  return { carrierUserId: payload.userId ?? null };
}

/**
 * Log a visit without JWT.
 * DIAGNOSTIC: this is where the lost new_subscription conversions currently land.
 * The classifyRequest tag tells us whether they are real navigations (JWT lost
 * upstream / in fragment) or just prefetch/RSC/bot noise.
 */
async function logVisit(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const supabaseAdmin = getSupabaseAdmin();
  const userAgent = request.headers.get('user-agent') || null;

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
    notes: `visit_without_jwt [${classifyRequest(request)}]`,
    content_rating: CONTENT_MODE,
    user_agent: userAgent,
  });

  if (error) {
    console.error('Failed to log visit:', error);
  }
}

export const config = {
  matcher: '/',
};
