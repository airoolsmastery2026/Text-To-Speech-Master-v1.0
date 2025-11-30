
export enum LoadingState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type AppMode = 'TTS' | 'STT';
export type VoiceProvider = 'gemini' | 'google' | 'elevenlabs';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
  provider: VoiceProvider;
}

export interface TTSConfig {
  text: string;
  voice: string;
  speed: number; 
  language: string;
}

export interface UserApiKeys {
  googleCloud?: string;
  elevenLabs?: string;
}

export interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0 to 100
  text?: string;
  audioBuffer?: AudioBuffer;
  errorMsg?: string;
  fileNameOutput?: string; // e.g. "01_OriginalName"
}

// --- NEW: PLATFORM TARGETS FOR DURATION OPTIMIZATION ---
export interface TargetPlatform {
  id: string;
  name: string;
  maxDurationSec: number;
  suggestedSpeed: number;
  icon?: string;
  description: string;
}

export const TARGET_PLATFORMS: TargetPlatform[] = [
  { id: 'none', name: 'Tự do (Không giới hạn)', maxDurationSec: 0, suggestedSpeed: 1.0, description: 'Giữ nguyên độ dài gốc' },
  { id: 'tiktok_15', name: 'TikTok / Story (15s)', maxDurationSec: 15, suggestedSpeed: 1.2, description: 'Siêu ngắn, tốc độ nhanh' },
  { id: 'tiktok_60', name: 'TikTok / Shorts (60s)', maxDurationSec: 60, suggestedSpeed: 1.1, description: 'Chuẩn video ngắn' },
  { id: 'reels_90', name: 'Reels / Video (90s)', maxDurationSec: 90, suggestedSpeed: 1.0, description: 'Nội dung vừa phải' },
  { id: 'youtube_3m', name: 'YouTube / Review (3 phút)', maxDurationSec: 180, suggestedSpeed: 1.0, description: 'Chi tiết, đầy đủ' },
  { id: 'podcast', name: 'Podcast / Kể chuyện', maxDurationSec: 300, suggestedSpeed: 0.9, description: 'Chậm rãi, truyền cảm' },
];

// Configuration Constants
export const APP_CONFIG = {
  TTS_CHAR_LIMIT: 50000,
  STT_FILE_LIMIT: 100 * 1024 * 1024, // 100MB
};

// --- GEMINI VOICES ---
export const GEMINI_VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Gemini - Nữ (Kore)', gender: 'female', description: 'Nhẹ nhàng, êm dịu', provider: 'gemini' },
  { id: 'Puck', name: 'Gemini - Nam (Puck)', gender: 'male', description: 'Tự nhiên, trung tính', provider: 'gemini' },
  { id: 'Charon', name: 'Gemini - Nam (Charon)', gender: 'male', description: 'Trầm ấm, sâu sắc', provider: 'gemini' },
  { id: 'Fenrir', name: 'Gemini - Nam (Fenrir)', gender: 'male', description: 'Mạnh mẽ, dứt khoát', provider: 'gemini' },
  { id: 'Zephyr', name: 'Gemini - Nữ (Zephyr)', gender: 'female', description: 'Cao, trong trẻo', provider: 'gemini' },
];

// --- GOOGLE CLOUD TTS VOICES (Selected Vietnamese Voices) ---
export const GOOGLE_VOICES: VoiceOption[] = [
  { id: 'vi-VN-Neural2-A', name: 'Google - Nữ Cao (Neural2-A)', gender: 'female', description: 'Giọng AI thế hệ mới', provider: 'google' },
  { id: 'vi-VN-Neural2-D', name: 'Google - Nam Trầm (Neural2-D)', gender: 'male', description: 'Giọng AI thế hệ mới', provider: 'google' },
  { id: 'vi-VN-Wavenet-A', name: 'Google - Nữ Chuẩn (Wavenet-A)', gender: 'female', description: 'Giọng Wavenet phổ biến', provider: 'google' },
  { id: 'vi-VN-Wavenet-B', name: 'Google - Nam Chuẩn (Wavenet-B)', gender: 'male', description: 'Giọng Wavenet phổ biến', provider: 'google' },
  { id: 'vi-VN-Standard-A', name: 'Google - Nữ (Standard-A)', gender: 'female', description: 'Giọng tiêu chuẩn (nhẹ)', provider: 'google' },
];

// --- ELEVENLABS VOICES (Popular Multilingual/Expressive) ---
// Note: IDs are ElevenLabs specific public voice IDs
export const ELEVENLABS_VOICES: VoiceOption[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'ElevenLabs - Rachel', gender: 'female', description: 'Giọng Mỹ, kể chuyện', provider: 'elevenlabs' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'ElevenLabs - Domi', gender: 'female', description: 'Mạnh mẽ, dẫn chuyện', provider: 'elevenlabs' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'ElevenLabs - Bella', gender: 'female', description: 'Dịu dàng, cảm xúc', provider: 'elevenlabs' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'ElevenLabs - Antoni', gender: 'male', description: 'Trầm, dẫn chuyện', provider: 'elevenlabs' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'ElevenLabs - Josh', gender: 'male', description: 'Trẻ trung, tự nhiên', provider: 'elevenlabs' },
];

// Combine all voices
export const ALL_VOICES = [...GEMINI_VOICES, ...GOOGLE_VOICES, ...ELEVENLABS_VOICES];

export const SUPPORTED_LANGUAGES = [
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'en-US', name: 'Tiếng Anh (US)' },
  { code: 'ja-JP', name: 'Tiếng Nhật' },
  { code: 'ko-KR', name: 'Tiếng Hàn' },
  { code: 'zh-CN', name: 'Tiếng Trung' },
];

export const SAMPLE_PHRASES: Record<string, string> = {
  'vi-VN': 'Xin chào, đây là giọng đọc mẫu của tôi.',
  'en-US': 'Hello, this is a sample of my voice.',
  'ja-JP': 'こんにちは、これは私の声のサンプルです。',
  'ko-KR': '안녕하세요, 제 목소리 샘플입니다.',
  'zh-CN': '你好，这是我的声音样本。',
};
