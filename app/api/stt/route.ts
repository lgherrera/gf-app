// app/api/stt/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { audio, format } = await req.json();

    if (!audio || !format) {
      return NextResponse.json(
        { error: 'Missing audio data or format' },
        { status: 400 }
      );
    }

    // Use OpenRouter's dedicated STT endpoint
    const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/whisper-large-v3',
        audio: {
          data: audio,
          format: format,
        },
        language: 'es',
      }),
    });

    if (!response.ok) {
      // Fallback: try via chat/completions with an audio-capable model
      const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/whisper-large-v3',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Transcribe this audio exactly as spoken. Return ONLY the transcribed text, nothing else.',
                },
                {
                  type: 'input_audio',
                  input_audio: {
                    data: audio,
                    format: format,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!fallbackResponse.ok) {
        const errorText = await fallbackResponse.text();
        console.error('STT fallback error:', errorText);
        return NextResponse.json(
          { error: 'Transcription failed' },
          { status: 500 }
        );
      }

      const fallbackData = await fallbackResponse.json();
      const transcribedText = fallbackData.choices?.[0]?.message?.content?.trim() || '';
      return NextResponse.json({ text: transcribedText });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text || '' });

  } catch (error) {
    console.error('STT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}