
// Service to handle Google Cloud TTS and ElevenLabs API calls
import { VoiceOption } from '../types';

function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- GOOGLE CLOUD TTS ---
export const generateGoogleSpeech = async (
  text: string,
  voiceId: string,
  apiKey: string,
  speed: number = 1.0,
  languageCode: string = 'vi-VN'
): Promise<{ audioBuffer: ArrayBuffer; base64: string }> => {
  if (!apiKey) throw new Error("Vui lòng nhập Google API Key trong phần cài đặt.");

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const payload = {
    input: { text: text },
    voice: { languageCode: languageCode, name: voiceId },
    audioConfig: { 
      audioEncoding: "LINEAR16", // Returns WAV/RAW compatible content
      speakingRate: speed,
      pitch: 0 
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Lỗi khi gọi Google TTS API.");
  }

  if (!data.audioContent) {
    throw new Error("Không nhận được dữ liệu âm thanh từ Google.");
  }

  const base64 = data.audioContent;
  const audioBuffer = decodeBase64ToArrayBuffer(base64);
  return { audioBuffer, base64 };
};

// --- ELEVENLABS TTS ---
export const generateElevenLabsSpeech = async (
  text: string,
  voiceId: string,
  apiKey: string,
  // ElevenLabs handles speed differently/less directly in basic API, mostly via stability/similarity
): Promise<{ audioBuffer: ArrayBuffer; base64: string }> => {
  if (!apiKey) throw new Error("Vui lòng nhập ElevenLabs API Key trong phần cài đặt.");

  // Using the multilingual-v2 model for best language support including Vietnamese
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  const payload = {
    text: text,
    model_id: "eleven_multilingual_v2", 
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      "Accept": "audio/mpeg" // ElevenLabs returns MP3 by default
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.detail?.message || "Lỗi khi gọi ElevenLabs API.");
  }

  // ElevenLabs returns binary audio directly, not JSON with base64
  const arrayBuffer = await response.arrayBuffer();
  
  // Convert ArrayBuffer to Base64 manually for consistency with other services if needed,
  // but here we primarily need the buffer.
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);

  return { audioBuffer: arrayBuffer, base64 };
};

// --- ELEVENLABS VOICE CLONING ---
export const addElevenLabsVoice = async (
  name: string,
  files: File[],
  apiKey: string,
  description: string = ""
): Promise<{ voice_id: string }> => {
  if (!apiKey) throw new Error("Vui lòng nhập ElevenLabs API Key.");
  
  const url = "https://api.elevenlabs.io/v1/voices/add";
  const formData = new FormData();
  
  formData.append('name', name);
  if (description) formData.append('description', description);
  
  // Append files (API expects 'files' key)
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey
      // Note: Do NOT set Content-Type to multipart/form-data here; 
      // the browser sets it automatically with the boundary.
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
     throw new Error(data.detail?.message || "Lỗi khi tạo giọng Clone (ElevenLabs).");
  }

  return { voice_id: data.voice_id };
};

// --- GET ELEVENLABS VOICES ---
export const getElevenLabsVoices = async (apiKey: string): Promise<VoiceOption[]> => {
    if (!apiKey) throw new Error("Vui lòng nhập ElevenLabs API Key.");

    const url = "https://api.elevenlabs.io/v1/voices";
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "xi-api-key": apiKey
        }
    });

    if (!response.ok) {
        throw new Error("Lỗi khi tải danh sách giọng ElevenLabs. Vui lòng kiểm tra API Key.");
    }

    const data = await response.json();
    
    // Map API response to VoiceOption interface
    return data.voices.map((v: any) => ({
        id: v.voice_id,
        name: `ElevenLabs - ${v.name}`,
        gender: v.labels?.gender === 'female' ? 'female' : 'male', // Simple mapping
        description: v.category === 'cloned' ? '(Giọng Clone)' : (v.labels?.description || v.category || 'Giọng AI cao cấp'),
        provider: 'elevenlabs'
    }));
};
