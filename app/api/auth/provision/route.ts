// app/api/auth/provision/route.ts
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

export async function POST(request: NextRequest) {
  try {
    const { carrierUserId } = await request.json();

    if (!carrierUserId) {
      return NextResponse.json({ error: 'Missing carrierUserId' }, { status: 400 });
    }

    const msisdn = normalizePhone(carrierUserId);
    if (!msisdn) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Look up existing auth user by phone
    let supabaseAuthId: string | null = null;

    const { data: existingId } = await supabaseAdmin
      .rpc('get_auth_user_id_by_phone', { phone_input: msisdn });

    if (existingId) {
      supabaseAuthId = existingId;
    } else {
      // 2. Create new auth user if not found
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone: msisdn,
        phone_confirm: true,
      });

      if (newUser?.user) {
        supabaseAuthId = newUser.user.id;
      } else if (createError) {
        console.error('Auth user creation error:', createError);
        return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
      }
    }

    // 3. Upsert user_profiles
    if (supabaseAuthId) {
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
    }

    return NextResponse.json({ supabaseAuthId });
  } catch (err) {
    console.error('Provision error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}