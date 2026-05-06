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

    console.log(`STT request: format=${format}, base64 length=${audio.length}`);

    // ── Attempt 1: Dedicated STT endpoint with Whisper Large V3 Turbo ──
    try {
      const sttResponse = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/whisper-large-v3-turbo',
          input_audio: {
            data: audio,
            format: format,
          },
          language: 'es',
        }),
      });

      if (sttResponse.ok) {
        const sttData = await sttResponse.json();
        console.log('STT Whisper Turbo success:', sttData.text?.substring(0, 100));
        if (sttData.text) {
          return NextResponse.json({ text: sttData.text });
        }
      }

      const sttError = await sttResponse.text();
      console.error('STT Whisper Turbo error:', sttResponse.status, sttError);
    } catch (err) {
      console.error('STT Whisper Turbo exception:', err);
    }

    // ── Attempt 2: Chat completions with Gemini 2.5 Flash (audio-capable) ──
    try {
      const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Transcribe this audio exactly as spoken in its original language. Return ONLY the transcribed text, nothing else. No quotes, no labels, no explanations.',
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

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        const transcribedText = chatData.choices?.[0]?.message?.content?.trim() || '';
        console.log('STT Gemini Flash success:', transcribedText.substring(0, 100));
        if (transcribedText) {
          return NextResponse.json({ text: transcribedText });
        }
      }

      const chatError = await chatResponse.text();
      console.error('STT Gemini Flash error:', chatResponse.status, chatError);
    } catch (err) {
      console.error('STT Gemini Flash exception:', err);
    }

    return NextResponse.json(
      { error: 'Transcription failed on all attempts' },
      { status: 500 }
    );

  } catch (error) {
    console.error('STT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}