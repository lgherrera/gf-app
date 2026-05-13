// app/components/chat/utils/audio.ts

const SUPPORTED_MIME_TYPES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];
  
  export const getSupportedMimeType = (): string =>
    SUPPORTED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  
  export const mimeToFormat = (mime: string): string => {
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('aac')) return 'aac';
    if (mime.includes('ogg')) return 'ogg';
    return 'webm';
  };