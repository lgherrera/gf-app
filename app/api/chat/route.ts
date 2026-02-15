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
    const { messages, girlfriendId, sessionId } = await req.json();

    // Validate required fields
    if (!messages || !girlfriendId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, girlfriendId, sessionId' },
        { status: 400 }
      );
    }

    // Fetch girlfriend data from Supabase with content filter
    const CONTENT_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE as string;

    const { data: girlfriend, error: girlfriendError } = await supabase
      .from('girlfriends')
      .select('*')
      .eq('id', girlfriendId)
      .eq('content_rating', CONTENT_MODE)
      .single();

    if (girlfriendError || !girlfriend) {
      console.error('Girlfriend fetch error:', girlfriendError);
      return NextResponse.json(
        { error: 'Girlfriend not found' },
        { status: 404 }
      );
    }

    // Build system prompt with girlfriend personality
    const systemPrompt = buildSystemPrompt(girlfriend);

    // Prepare messages for OpenRouter
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Use model_name directly - it already has the full format like "x-ai/grok-4.1-fast"
    const modelString = girlfriend.model_name || 'x-ai/grok-4.1-fast';

    // Log request details
    console.log('Making OpenRouter request with:', {
      model: modelString,
      messageCount: apiMessages.length,
      girlfriendId,
      sessionId
    });

    // Call OpenRouter API
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
      cost: data.usage?.total_cost
    });

    // Extract metadata from OpenRouter response
    const usage = data.usage;
    const metadata = {
      session_id: sessionId,
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

    // Store metadata in Supabase (non-blocking)
    supabase
      .from('chat_metadata')
      .insert(metadata)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to store chat metadata:', error);
        } else {
          console.log('Metadata stored successfully');
        }
      });

    // Extract assistant's reply
    const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Return the response
    return NextResponse.json({
      message: assistantMessage,
      metadata: {
        tokens: usage?.total_tokens,
        cost: usage?.total_cost,
        generationTime
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