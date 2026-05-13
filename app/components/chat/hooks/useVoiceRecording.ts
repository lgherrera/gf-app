// app/components/chat/hooks/useVoiceRecording.ts

import { useState, useRef, useCallback } from 'react';
import { getSupportedMimeType, mimeToFormat } from '../utils/audio';

interface VoiceRecordingResult {
  isRecording: boolean;
  isTranscribing: boolean;
  recordingSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useVoiceRecording(
  onTranscription: (text: string) => void,
  onError: (message: string) => void
): VoiceRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob, audioFormat: string) => {
      setIsTranscribing(true);
      try {
        const buffer = await audioBlob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        const response = await fetch('/api/stt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64, format: audioFormat }),
        });

        if (!response.ok) throw new Error('Transcription failed');

        const data = await response.json();
        if (data.text) {
          const trimmedText = data.text.trim();
          if (trimmedText) {
            onTranscription(trimmedText);
          }
        }
      } catch (err) {
        console.error('Transcription error:', err);
        onError('Error al transcribir el audio');
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscription, onError]
  );

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        onError('Tu navegador no soporta grabación de audio');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const audioFormat = mimeToFormat(mimeType);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Skip if too short (less than ~0.5s)
        if (audioBlob.size < 5000) {
          setIsRecording(false);
          return;
        }

        await transcribeAudio(audioBlob, audioFormat);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Auto-stop after 30 seconds
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      onError('No se pudo acceder al micrófono');
    }
  }, [onError, stopRecording, transcribeAudio]);

  return {
    isRecording,
    isTranscribing,
    recordingSeconds,
    startRecording,
    stopRecording,
  };
}