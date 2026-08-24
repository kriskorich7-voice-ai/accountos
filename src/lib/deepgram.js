// Deepgram STT + TTS helpers. Uses VITE_DEEPGRAM_API_KEY.
// Both functions throw on failure so callers can degrade gracefully.

const DG_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

export const hasDeepgram = Boolean(DG_KEY);

// Transcribe a recorded audio Blob via Deepgram's pre-recorded API (Nova-3).
export async function transcribeAudio(blob) {
  if (!DG_KEY) throw new Error('Missing VITE_DEEPGRAM_API_KEY');
  const res = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${DG_KEY}`,
        'Content-Type': blob.type || 'audio/webm',
      },
      body: blob,
    },
  );
  if (!res.ok) throw new Error(`Deepgram STT ${res.status}`);
  const data = await res.json();
  return data?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || '';
}

// Synthesize speech with Deepgram Aura-2 and return a playable object URL.
export async function synthesizeSpeech(text) {
  if (!DG_KEY) throw new Error('Missing VITE_DEEPGRAM_API_KEY');
  // Aura-2 has practical input limits; keep spoken responses concise.
  const clipped = text.length > 1800 ? text.slice(0, 1800) : text;
  const res = await fetch('https://api.deepgram.com/v1/speak?model=aura-2-asteria-en', {
    method: 'POST',
    headers: {
      Authorization: `Token ${DG_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: clipped }),
  });
  if (!res.ok) throw new Error(`Deepgram TTS ${res.status}`);
  const audioBlob = await res.blob();
  return URL.createObjectURL(audioBlob);
}
