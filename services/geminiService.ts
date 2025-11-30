
import { GoogleGenAI, Modality } from "@google/genai";
import { TargetPlatform } from "../types";

// Helper to decode Base64 to ArrayBuffer
function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export const generateSpeech = async (
  text: string,
  voiceName: string,
  languageName: string, // Kept for interface compatibility
  speed: number = 1.0 // Added speed parameter
): Promise<{ audioBuffer: ArrayBuffer; base64: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình. Vui lòng kiểm tra biến môi trường.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Gemini 2.5 Flash TTS Model
  const modelId = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          parts: [
            {
              text: text,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            },
          },
        },
        // NOTE: systemInstruction is removed as it can cause 500 Internal Errors 
        // with the specialized TTS model endpoints.
        // Speed is currently handled by the UI state. 
        // Direct API support for speed in this specific model config is experimental.
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (part) => part.inlineData && part.inlineData.mimeType?.startsWith("audio")
    );

    if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
      throw new Error("Không nhận được dữ liệu âm thanh từ Gemini.");
    }

    const base64Data = audioPart.inlineData.data;
    const audioBuffer = decodeBase64ToArrayBuffer(base64Data);

    return { audioBuffer, base64: base64Data };
  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    throw new Error(error.message || "Đã xảy ra lỗi khi tạo giọng nói.");
  }
};

export const transcribeAudio = async (
  audioBase64: string,
  mimeType: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Use a multimodal model for STT (Speech to Text)
  // gemini-2.0-flash-exp is powerful for audio understanding
  const modelId = "gemini-2.0-flash-exp";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64
              }
            },
            {
              text: "Hãy nghe file âm thanh này và chép lại toàn bộ nội dung thành văn bản (Transcribe). Giữ nguyên ngôn ngữ gốc của người nói. Nếu có nhiều người nói, hãy xuống dòng để phân tách. Không thêm các lời bình luận, chỉ trích xuất nội dung."
            }
          ]
        }
      ]
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không thể trích xuất văn bản từ file âm thanh.");
    }
    return text;

  } catch (error: any) {
    console.error("Gemini STT Error:", error);
    throw new Error(error.message || "Đã xảy ra lỗi khi chuyển đổi âm thanh thành văn bản.");
  }
};

export const translateText = async (text: string, targetLanguageName: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Use a fast text model for translation
  const modelId = "gemini-2.5-flash";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          parts: [{ text: `Translate the following text into ${targetLanguageName}. Only return the translated text, do not add any explanations or quotes.\n\nText: ${text}` }]
        }
      ]
    });

    const translatedText = response.text;
    if (!translatedText) {
      throw new Error("Không nhận được phản hồi dịch từ AI.");
    }
    return translatedText.trim();
  } catch (error: any) {
    console.error("Translation Error:", error);
    throw new Error("Lỗi khi dịch văn bản: " + error.message);
  }
};

export type OptimizationStyle = 'sales' | 'mc' | 'story' | 'short';

export const optimizeTextContent = async (
    text: string, 
    style: OptimizationStyle,
    targetPlatform?: TargetPlatform,
    customInstruction?: string // New parameter for user prompt
): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key chưa được cấu hình.");

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";

    let prompt = "";
    
    // Style Instructions
    switch (style) {
        case 'sales':
            prompt = "Bạn là một chuyên gia Copywriter. Hãy viết lại nội dung sau đây theo phong cách giới thiệu sản phẩm hấp dẫn, thôi miên khách hàng, nhấn mạnh lợi ích và kêu gọi hành động (CTA).";
            break;
        case 'mc':
            prompt = "Bạn là một MC chuyên nghiệp. Hãy viết lại nội dung sau đây thành kịch bản dẫn chương trình hoặc lời bình (voice-over) trang trọng, truyền cảm, có nhịp điệu để đọc.";
            break;
        case 'story':
            prompt = "Bạn là một người kể chuyện. Hãy viết lại nội dung sau đây theo phong cách kể chuyện (Storytelling) đầy cảm xúc, gần gũi, gợi hình.";
            break;
        case 'short':
             prompt = "Hãy tóm tắt và viết lại nội dung sau đây một cách ngắn gọn, súc tích, nhịp điệu nhanh.";
            break;
    }

    // Custom User Instructions
    if (customInstruction && customInstruction.trim()) {
        prompt += `\n\nLưu ý đặc biệt từ người dùng (Hãy tuân thủ nghiêm ngặt): "${customInstruction.trim()}"`;
    }

    // Platform/Duration Instructions
    if (targetPlatform && targetPlatform.id !== 'none' && targetPlatform.maxDurationSec > 0) {
        // Average speaking rate: ~2.5 words per second (150 wpm)
        // We slightly reduce it to safe limits for AI generation
        const safeWordCount = Math.floor(targetPlatform.maxDurationSec * 2.3);
        
        prompt += `\n\nQUAN TRỌNG: Nội dung này sẽ được sử dụng cho nền tảng ${targetPlatform.name}.`;
        prompt += `\nHãy đảm bảo độ dài văn bản sau khi viết lại khoảng ${safeWordCount} từ (để khi đọc lên sẽ gói gọn trong ${targetPlatform.maxDurationSec} giây).`;
        prompt += `\nTuyệt đối không viết quá dài dòng. Tập trung vào ý chính phù hợp với thời lượng.`;
    }

    prompt += `\n\nNội dung gốc:\n"${text}"\n\nYêu cầu: Chỉ trả về nội dung đã viết lại bằng Tiếng Việt, không thêm lời chào hay giải thích.`;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{ parts: [{ text: prompt }] }]
        });
        
        const optimizedText = response.text;
        if (!optimizedText) throw new Error("Không nhận được phản hồi từ AI.");
        return optimizedText.trim();
    } catch (error: any) {
        console.error("Optimization Error:", error);
        throw new Error("Lỗi khi tối ưu nội dung: " + error.message);
    }
};
