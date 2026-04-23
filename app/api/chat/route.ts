// app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from '@/lib/prompts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { messages, girlfriendId, userId } = await req.json();

    if (!messages || !girlfriendId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, girlfriendId, userId' },
        { status: 400 }
      );
    }

    const CONTENT_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE as string;

    // Fetch girlfriend and user progress in parallel
    const [{ data: girlfriend, error: girlfriendError }, { data: progress }] = await Promise.all([
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
    ]);

    if (girlfriendError || !girlfriend) {
      console.error('Girlfriend fetch error:', girlfriendError);
      return NextResponse.json({ error: 'Girlfriend not found' }, { status: 404 });
    }

    const stage = progress?.stage ?? 1;

    // Build system prompt with stage
    const systemPrompt = buildSystemPrompt(girlfriend, undefined, stage);

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
        },
        {
          user_id: userId,
          girlfriend_id: girlfriendId,
          role: 'assistant',
          content: assistantMessage,
          source: CONTENT_MODE,
        }
      ]);

    if (msgError) {
      console.error('❌ Failed to store chat messages:', msgError);
    } else {
      console.log('✅ Chat messages stored successfully');
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