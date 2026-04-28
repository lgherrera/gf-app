// app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from '@/lib/prompts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lightweight LLM call to extract the user's name from a message
async function extractUserName(userMessage: string): Promise<string | null> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-3-mini-fast',
        messages: [
          {
            role: 'system',
            content: 'You extract names from messages. The user is chatting with an AI girlfriend and may reveal their name. If the message contains the user introducing themselves or stating their name (e.g. "me llamo Juan", "soy Pedro", "mi nombre es Diego", "I\'m Carlos", "llámame Mateo"), respond with ONLY the first name, nothing else. If the message does NOT contain a name introduction, respond with exactly "NO". Do not guess — only extract explicitly stated names.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0,
        max_tokens: 20,
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result || result.toUpperCase() === 'NO') return null;

    // Sanitize: take only the first word, capitalize it, max 30 chars
    const name = result.split(/\s+/)[0].replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/gi, '');
    if (name.length < 2 || name.length > 30) return null;

    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  } catch (err) {
    console.error('Name extraction error:', err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, girlfriendId, userId, sessionId } = await req.json();

    if (!messages || !girlfriendId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, girlfriendId, userId' },
        { status: 400 }
      );
    }

    const CONTENT_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE as string;

    // Fetch girlfriend, user progress, and user profile in parallel
    const [{ data: girlfriend, error: girlfriendError }, { data: progress }, { data: userProfile }] = await Promise.all([
      supabase
        .from('girlfriends')
        .select('*')
        .eq('id', girlfriendId)
        .eq('content_rating', CONTENT_MODE)
        .single(),
      supabase
        .from('user_progress')
        .select('stage')
        .match({ user_id: userId, girlfriend_id: girlfriendId })
        .single(),
      supabase
        .from('user_profiles')
        .select('name')
        .eq('supabase_auth_id', userId)
        .single(),
    ]);

    if (girlfriendError || !girlfriend) {
      console.error('Girlfriend fetch error:', girlfriendError);
      return NextResponse.json({ error: 'Girlfriend not found' }, { status: 404 });
    }

    const stage = progress?.stage ?? 1;
    const userName = userProfile?.name ?? null;

    // Build system prompt with stage and user name
    const systemPrompt = buildSystemPrompt(girlfriend, undefined, stage, userName);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const modelString = girlfriend.model_name || 'x-ai/grok-4.1-fast';

    console.log('Making OpenRouter request with:', {
      model: modelString,
      messageCount: apiMessages.length,
      girlfriendId,
      userId,
      stage,
      userName: userName || '(unknown)',
    });

    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Girlfriend Chat'
      },
      body: JSON.stringify({
        model: modelString,
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 800
      })
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error details:', errorData);
      return NextResponse.json(
        { error: `OpenRouter Error: ${JSON.stringify(errorData)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generationTime = Date.now() - startTime;

    console.log('OpenRouter success:', {
      model: data.model,
      tokens: data.usage?.total_tokens,
      cost: data.usage?.total_cost,
    });

    const usage = data.usage;
    const metadata = {
      user_id: userId,
      girlfriend_id: girlfriendId,
      model_used: data.model,
      prompt_tokens: usage?.prompt_tokens || null,
      completion_tokens: usage?.completion_tokens || null,
      total_tokens: usage?.total_tokens || null,
      prompt_cost: usage?.prompt_cost || null,
      completion_cost: usage?.completion_cost || null,
      total_cost: usage?.total_cost || null,
      generation_time_ms: generationTime,
      finish_reason: data.choices?.[0]?.finish_reason || null,
      raw_metadata: data
    };

    const { error: metaError } = await supabase
      .from('chat_metadata')
      .insert(metadata);

    if (metaError) {
      console.error('❌ Failed to store chat metadata:', metaError);
    } else {
      console.log('✅ Metadata stored successfully');
    }

    const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save user message + assistant reply to chat_messages
    const userMessage = messages[messages.length - 1];

    const { error: msgError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: userId,
          girlfriend_id: girlfriendId,
          role: 'user',
          content: userMessage.content,
          source: CONTENT_MODE,
          session_id: sessionId || null,
        },
        {
          user_id: userId,
          girlfriend_id: girlfriendId,
          role: 'assistant',
          content: assistantMessage,
          source: CONTENT_MODE,
          session_id: sessionId || null,
        }
      ]);

    if (msgError) {
      console.error('❌ Failed to store chat messages:', msgError);
    } else {
      console.log('✅ Chat messages stored successfully');
    }

    // Update session last_active_at
    if (sessionId) {
      await supabase
        .from('chat_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    // ─── Name extraction (only if name is unknown) ─────────────────
    if (!userName) {
      const extractedName = await extractUserName(userMessage.content);
      if (extractedName) {
        const { error: nameError } = await supabase
          .from('user_profiles')
          .update({ name: extractedName, updated_at: new Date().toISOString() })
          .eq('supabase_auth_id', userId);

        if (nameError) {
          console.error('❌ Failed to store user name:', nameError);
        } else {
          console.log(`✅ User name extracted and stored: ${extractedName}`);
        }
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      metadata: {
        tokens: usage?.total_tokens,
        cost: usage?.total_cost,
        generationTime,
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}