// app/api/elevenlabs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('ElevenLabs API called');
    
    const { text, voiceId, voiceModel } = await request.json();
    console.log('Text received:', text?.substring(0, 50) + '...');
    console.log('Voice ID:', voiceId);
    console.log('Voice Model:', voiceModel);

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Voice ID is required' },
        { status: 400 }
      );
    }

    console.log('Generating audio with ElevenLabs...');
    
    // Use the provided voiceId and voiceModel (with fallback)
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: voiceModel || 'eleven_turbo_v2_5',
    });

    // Convert ReadableStream to Buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    console.log('Audio buffer size:', audioBuffer.length, 'bytes');
    
    const base64Audio = audioBuffer.toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    console.log('Audio generated successfully');
    return NextResponse.json({ audioUrl: audioDataUrl });

  } catch (error) {
    console.error('ElevenLabs API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}