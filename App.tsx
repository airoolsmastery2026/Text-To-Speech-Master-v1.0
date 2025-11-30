
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { 
  GEMINI_VOICES,
  GOOGLE_VOICES,
  ELEVENLABS_VOICES,
  ALL_VOICES,
  SUPPORTED_LANGUAGES, 
  SAMPLE_PHRASES,
  VoiceOption, 
  LoadingState,
  AppMode,
  BatchItem,
  APP_CONFIG,
  UserApiKeys,
  TARGET_PLATFORMS,
  TargetPlatform,
  RegionalDialect,
  REGIONS
} from './types';
import { generateSpeech, transcribeAudio, translateText, optimizeTextContent, OptimizationStyle } from './services/geminiService';
import { generateGoogleSpeech, generateElevenLabsSpeech, addElevenLabsVoice, getElevenLabsVoices } from './services/externalTtsService';
import { createWavFile, convertPCMToAudioBuffer, createMp3Blob, mixAudioBuffers } from './utils/audioUtils';
import { 
  Play, 
  Download, 
  FileText, 
  Wand2, 
  Loader2, 
  AlertCircle,
  Volume2,
  PlayCircle,
  X,
  FileInput,
  ArrowRight,
  Mic,
  FileAudio,
  Copy,
  Check,
  Languages,
  Layers,
  Trash2,
  FolderArchive,
  Music,
  UploadCloud,
  Settings2,
  RefreshCcw,
  Merge,
  Save,
  KeyRound,
  PlusCircle,
  Fingerprint,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  PenTool,
  Clock,
  MessageSquarePlus,
  MapPin
} from 'lucide-react';

// Helper to get friendly error messages
const getFriendlyErrorMessage = (error: any): string => {
    const msg = (error?.message || '').toLowerCase();
    
    if (msg.includes('key') || msg.includes('auth') || msg.includes('permission') || msg.includes('401') || msg.includes('403')) {
        return "Khóa API không hợp lệ hoặc thiếu quyền truy cập. Vui lòng kiểm tra lại trong Cài đặt API.";
    }
    if (msg.includes('quota') || msg.includes('rate') || msg.includes('limit') || msg.includes('429')) {
        return "Đã hết hạn mức sử dụng (Quota) của dịch vụ này. Vui lòng chờ hoặc đổi API Key khác.";
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connect') || msg.includes('internet')) {
        return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền internet của bạn.";
    }
    if (msg.includes('content') || msg.includes('safety') || msg.includes('blocked')) {
        return "Nội dung văn bản bị hệ thống AI từ chối xử lý (có thể do vi phạm chính sách nội dung).";
    }
    if (msg.includes('found') || msg.includes('404')) {
        return "Dịch vụ hoặc giọng đọc này hiện không khả dụng.";
    }
    
    // Default fallback message if no specific keyword match
    return "Hệ thống gặp sự cố gián đoạn. Vui lòng thử lại sau ít phút.";
};

// --- LocalStorage Helpers (Defined outside component for performance) ---
const loadSavedConfig = () => {
  try {
    const saved = localStorage.getItem('tts_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Could not load saved settings:", e);
  }
  return null;
};

const loadCustomVoices = (): VoiceOption[] => {
    try {
        const saved = localStorage.getItem('custom_voices');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
};

const loadElevenLabsVoices = (): VoiceOption[] => {
    try {
        const saved = localStorage.getItem('elevenlabs_voices_cache');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
};

const loadApiKeys = (): UserApiKeys => {
    try {
        const keys = localStorage.getItem('user_api_keys');
        if (keys) return JSON.parse(keys);
    } catch (e) {
        console.error("Failed to load keys", e);
    }
    return {};
};


// Main Component
const App: React.FC = () => {
  // App Mode State
  const [appMode, setAppMode] = useState<AppMode>('TTS');

  // Lazy load API keys
  const [apiKeys, setApiKeys] = useState<UserApiKeys>(() => loadApiKeys());

  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Lazy load voices
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>(() => loadCustomVoices());
  const [fetchedElevenLabsVoices, setFetchedElevenLabsVoices] = useState<VoiceOption[]>(() => loadElevenLabsVoices());
  const [isLoadingVoices, setIsLoadingVoices] = useState<boolean>(false);

  // Save custom voices & fetched voices
  useEffect(() => {
    localStorage.setItem('custom_voices', JSON.stringify(customVoices));
  }, [customVoices]);

  useEffect(() => {
      if (fetchedElevenLabsVoices.length > 0) {
          localStorage.setItem('elevenlabs_voices_cache', JSON.stringify(fetchedElevenLabsVoices));
      }
  }, [fetchedElevenLabsVoices]);

  // TTS State
  const [text, setText] = useState<string>('');
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    const savedConfig = loadSavedConfig();
    // Check if saved language exists in supported list
    if (savedConfig?.language && SUPPORTED_LANGUAGES.some(l => l.code === savedConfig.language)) {
      return savedConfig.language;
    }
    return SUPPORTED_LANGUAGES[0].code;
  });

  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(() => {
    const savedConfig = loadSavedConfig();
    // Check if saved voice ID exists in current voice list (including custom)
    if (savedConfig?.voiceId) {
      // Check standard voices
      const foundVoice = ALL_VOICES.find(v => v.id === savedConfig.voiceId);
      if (foundVoice) return foundVoice;
      // Check custom voices (need to load fresh to be sure, or rely on what we just loaded)
      const foundCustom = loadCustomVoices().find(v => v.id === savedConfig.voiceId);
      if (foundCustom) return foundCustom;
      // Check fetched elevenlabs voices
      const foundFetched = loadElevenLabsVoices().find(v => v.id === savedConfig.voiceId);
      if (foundFetched) return foundFetched;
    }
    return GEMINI_VOICES[0];
  });

  const [speed, setSpeed] = useState<number>(() => {
    const savedConfig = loadSavedConfig();
    if (typeof savedConfig?.speed === 'number') {
      return savedConfig.speed;
    }
    return 1.0;
  });
  
  // Save config whenever dependencies change
  useEffect(() => {
    const configToSave = {
      language: selectedLanguage,
      voiceId: selectedVoice.id,
      speed: speed
    };
    localStorage.setItem('tts_config', JSON.stringify(configToSave));
  }, [selectedLanguage, selectedVoice, speed]);


  // Translation & Optimization State
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [translationTargetLang, setTranslationTargetLang] = useState<string>(SUPPORTED_LANGUAGES[1].code);
  const [optimizationStyle, setOptimizationStyle] = useState<OptimizationStyle>('sales');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('none');
  const [optimizationPrompt, setOptimizationPrompt] = useState<string>('');
  const [selectedDialect, setSelectedDialect] = useState<RegionalDialect>('north');

  // STT State
  const [sttFile, setSttFile] = useState<File | null>(null);
  const [sttFileBase64, setSttFileBase64] = useState<string | null>(null);
  const [sttResult, setSttResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Batch TTS State
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [isDraggingBatch, setIsDraggingBatch] = useState<boolean>(false); // Drag state
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Common State
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  
  // Audio State (TTS Result - Single Mode)
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [originalVoiceBuffer, setOriginalVoiceBuffer] = useState<AudioBuffer | null>(null); // To store pure voice for resetting mixing
  
  // Background Mixing State
  const [bgMusicFile, setBgMusicFile] = useState<File | null>(null);
  const [bgMusicBuffer, setBgMusicBuffer] = useState<AudioBuffer | null>(null);
  const [voiceVolume, setVoiceVolume] = useState<number>(1.0);
  const [bgVolume, setBgVolume] = useState<number>(0.2);
  const [isMixing, setIsMixing] = useState<boolean>(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Preview State
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  // File Upload State (TTS Input - Single Mode)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Download Confirmation State
  const [showDownloadConfirm, setShowDownloadConfirm] = useState<boolean>(false);
  const [downloadFormat, setDownloadFormat] = useState<'wav' | 'mp3'>('wav');

  // Voice Cloning State
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);
  const [cloneName, setCloneName] = useState<string>('');
  const [cloneDesc, setCloneDesc] = useState<string>('');
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const cloneFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sttFileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context lazily
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  // --- Handlers for Settings ---
  const handleSaveApiKeys = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('user_api_keys', JSON.stringify(apiKeys));
      setShowSettings(false);
      alert("Đã lưu cấu hình API Key vào trình duyệt của bạn!");
  };

  const handleClearApiKeys = () => {
      if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ API Key đã lưu? Bạn sẽ cần nhập lại chúng cho lần sử dụng sau.")) {
        localStorage.removeItem('user_api_keys');
        localStorage.removeItem('elevenlabs_voices_cache');
        setApiKeys({});
        setFetchedElevenLabsVoices([]);
        alert("Đã xóa toàn bộ API Key và cache giọng đọc.");
      }
  };

  const handleFetchElevenLabsVoices = async () => {
      if (!apiKeys.elevenLabs) {
          alert("Vui lòng nhập API Key trước khi tải danh sách giọng.");
          return;
      }
      
      setIsLoadingVoices(true);
      try {
          const voices = await getElevenLabsVoices(apiKeys.elevenLabs);
          setFetchedElevenLabsVoices(voices);
          alert(`Đã tải thành công ${voices.length} giọng từ tài khoản ElevenLabs của bạn!`);
      } catch (error: any) {
          console.error(error);
          alert(getFriendlyErrorMessage(error));
      } finally {
          setIsLoadingVoices(false);
      }
  };

  // --- Handlers for Voice Cloning ---
  const handleCloneFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setCloneFiles(Array.from(e.target.files));
      }
  };

  const handleCloneSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!apiKeys.elevenLabs) {
          alert("Vui lòng cấu hình ElevenLabs API Key trước.");
          setShowSettings(true);
          return;
      }
      if (!cloneName || cloneFiles.length === 0) {
          alert("Vui lòng nhập tên và chọn ít nhất 1 file mẫu.");
          return;
      }

      setIsCloning(true);
      try {
          const result = await addElevenLabsVoice(cloneName, cloneFiles, apiKeys.elevenLabs, cloneDesc);
          
          const newVoice: VoiceOption = {
              id: result.voice_id,
              name: `(Clone) ${cloneName}`,
              gender: 'male', // Default, unknown
              description: cloneDesc || 'Giọng nhân bản tùy chỉnh',
              provider: 'elevenlabs'
          };

          // Update fetched voices to include new clone immediately
          setFetchedElevenLabsVoices(prev => [newVoice, ...prev]);
          setSelectedVoice(newVoice);
          setShowCloneModal(false);
          setCloneName('');
          setCloneDesc('');
          setCloneFiles([]);
          alert("Tạo giọng thành công! Giọng mới đã được chọn.");

      } catch (error: any) {
          alert("Lỗi tạo giọng: " + getFriendlyErrorMessage(error));
      } finally {
          setIsCloning(false);
      }
  };


  // --- Handlers for TTS Single ---

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleTranslate = async () => {
    if (!text.trim()) {
      alert("Vui lòng nhập văn bản cần dịch.");
      return;
    }
    
    setIsTranslating(true);
    setErrorMessage(null);

    try {
      const targetLangName = SUPPORTED_LANGUAGES.find(l => l.code === translationTargetLang)?.name || 'English';
      const translated = await translateText(text, targetLangName);
      setText(translated);
      setSelectedLanguage(translationTargetLang);
    } catch (error: any) {
      console.error(error);
      alert("Lỗi dịch thuật: " + getFriendlyErrorMessage(error));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleOptimizeContent = async () => {
    if (!text.trim()) {
      alert("Vui lòng nhập văn bản gốc trước.");
      return;
    }
    
    setIsOptimizing(true);
    setErrorMessage(null);

    try {
      const targetPlatform = TARGET_PLATFORMS.find(p => p.id === selectedPlatformId);
      const optimized = await optimizeTextContent(text, optimizationStyle, targetPlatform, optimizationPrompt, selectedDialect);
      
      setText(optimized);
      
      // Auto-adjust speed based on platform if selected
      if (targetPlatform && targetPlatform.id !== 'none') {
          setSpeed(targetPlatform.suggestedSpeed);
          setWarningMessage(`Đã tối ưu nội dung cho ${targetPlatform.name} và tự động chỉnh tốc độ đọc thành ${targetPlatform.suggestedSpeed}x.`);
      }

    } catch (error: any) {
      console.error(error);
      alert(getFriendlyErrorMessage(error));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      setSelectedFile(file);
    } else {
      alert("⚠️ Thông báo\n\nHiện tại tính năng upload trực tiếp chỉ hỗ trợ file văn bản thuần (.txt).\n\nĐối với tài liệu Word (.doc, .docx) hoặc PDF, vui lòng MỞ FILE, COPY nội dung và DÁN vào ô văn bản để đảm bảo độ chính xác cao nhất.");
    }
    e.target.value = '';
  };

  const handleExtractFile = () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setText(event.target.result as string);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // CENTRALIZED SPEECH GENERATION WITH FALLBACK
  const performSpeechGeneration = async (textToSpeak: string, voice: VoiceOption): Promise<AudioBuffer> => {
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'Vietnamese';
      const langCode = selectedLanguage;
      const ctx = getAudioContext();
      
      let rawBuffer: ArrayBuffer;

      // Helper for decoding
      const decode = async (buffer: ArrayBuffer) => {
           try {
              const bufferCopy = buffer.slice(0);
              return await ctx.decodeAudioData(bufferCopy);
          } catch (e) {
              return convertPCMToAudioBuffer(buffer, ctx);
          }
      };

      try {
          // --- PRIMARY ATTEMPT ---
          if (voice.provider === 'google') {
              if (!apiKeys.googleCloud) throw new Error("API Key Google Cloud chưa được cấu hình.");
              const res = await generateGoogleSpeech(textToSpeak, voice.id, apiKeys.googleCloud, speed, langCode);
              rawBuffer = res.audioBuffer;
          } else if (voice.provider === 'elevenlabs') {
              if (!apiKeys.elevenLabs) throw new Error("API Key ElevenLabs chưa được cấu hình.");
              const res = await generateElevenLabsSpeech(textToSpeak, voice.id, apiKeys.elevenLabs);
              const decoded = await ctx.decodeAudioData(res.audioBuffer);
              return decoded;
          } else {
              // Gemini (Default)
              const res = await generateSpeech(textToSpeak, voice.id, langName, speed);
              rawBuffer = res.audioBuffer;
          }
          return await decode(rawBuffer);

      } catch (primaryError: any) {
          console.warn(`Primary API (${voice.provider}) failed:`, primaryError);
          
          // --- FALLBACK LOGIC ---
          // If Gemini failed, or no alternative available, throw friendly error
          if (voice.provider === 'gemini') {
              throw new Error(getFriendlyErrorMessage(primaryError));
          }

          // If Google/ElevenLabs failed, Try Gemini fallback
          setWarningMessage(`Dịch vụ ${voice.provider === 'elevenlabs' ? 'ElevenLabs' : 'Google'} gặp sự cố. Đang tự động chuyển sang giọng đọc dự phòng (Gemini)...`);
          
          try {
              // Attempt to find a Gemini voice with same gender
              const fallbackVoice = GEMINI_VOICES.find(v => v.gender === voice.gender) || GEMINI_VOICES[0];
              
              console.log(`Falling back to Gemini Voice: ${fallbackVoice.name}`);
              const res = await generateSpeech(textToSpeak, fallbackVoice.id, langName, speed);
              return await decode(res.audioBuffer);
          } catch (fallbackError: any) {
              // If fallback also fails, throw combined error
              throw new Error(getFriendlyErrorMessage(primaryError));
          }
      }
  };

  const handlePreviewVoice = async () => {
    if (isPreviewing) return;
    setIsPreviewing(true);

    try {
      const sampleText = SAMPLE_PHRASES[selectedLanguage] || SAMPLE_PHRASES['vi-VN'];
      const audioBuffer = await performSpeechGeneration(sampleText, selectedVoice);
      
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      
      source.onended = () => {
        setIsPreviewing(false);
      };
    } catch (error: any) {
      console.error("Preview error:", error);
      alert(error.message); // Friendly message already processed in performSpeechGeneration logic if needed, but catch blocks handle it
      setIsPreviewing(false);
    }
  };

  const handleConvert = async () => {
    if (!text.trim()) {
      setErrorMessage("Vui lòng nhập văn bản trước khi chuyển đổi.");
      return;
    }
    if (text.length > APP_CONFIG.TTS_CHAR_LIMIT) {
      setErrorMessage(`Văn bản quá dài. Vui lòng nhập dưới ${APP_CONFIG.TTS_CHAR_LIMIT} ký tự.`);
      return;
    }

    setLoadingState(LoadingState.PROCESSING);
    setErrorMessage(null);
    setWarningMessage(null);
    setAudioUrl(null);
    setAudioBuffer(null);
    setOriginalVoiceBuffer(null);
    setBgMusicFile(null);
    setBgMusicBuffer(null);

    try {
      const buffer = await performSpeechGeneration(text, selectedVoice);
      
      setAudioBuffer(buffer);
      setOriginalVoiceBuffer(buffer);

      const wavBlob = createWavFile(buffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      
      setLoadingState(LoadingState.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message); // This will now be the friendly message
      setLoadingState(LoadingState.ERROR);
    }
  };

  // --- Mixing Logic ---
  
  const handleBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBgMusicFile(file);
    
    // Decode immediately
    try {
        const arrayBuffer = await file.arrayBuffer();
        const ctx = getAudioContext();
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        setBgMusicBuffer(decodedBuffer);
    } catch (err) {
        console.error("Error decoding background audio:", err);
        alert("Lỗi đọc file âm thanh nền. Vui lòng chọn file khác.");
        setBgMusicFile(null);
    }
  };

  const handleMixAudio = () => {
    if (!originalVoiceBuffer || !bgMusicBuffer) return;
    setIsMixing(true);

    try {
        const ctx = getAudioContext();
        const mixedBuffer = mixAudioBuffers(originalVoiceBuffer, bgMusicBuffer, ctx, voiceVolume, bgVolume);
        
        setAudioBuffer(mixedBuffer);
        
        // Update URL
        const wavBlob = createWavFile(mixedBuffer);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
    } catch (err) {
        console.error("Mixing error:", err);
        alert("Có lỗi khi ghép nhạc.");
    } finally {
        setIsMixing(false);
    }
  };

  const resetMix = () => {
    if (!originalVoiceBuffer) return;
    setAudioBuffer(originalVoiceBuffer);
    const wavBlob = createWavFile(originalVoiceBuffer);
    const url = URL.createObjectURL(wavBlob);
    setAudioUrl(url);
  };


  const handleDownloadClick = (format: 'wav' | 'mp3') => {
    if (!audioBuffer) return;
    setDownloadFormat(format);
    setShowDownloadConfirm(true);
  };

  const performDownload = () => {
    if (!audioBuffer) return;
    
    let blob: Blob;
    let filename = `tts-master-${Date.now()}`;
    
    const isMixed = bgMusicBuffer !== null && audioBuffer !== originalVoiceBuffer;
    if (isMixed) {
        filename += '_mixed';
    }

    try {
      if (downloadFormat === 'mp3') {
        blob = createMp3Blob(audioBuffer);
        filename += '.mp3';
      } else {
        blob = createWavFile(audioBuffer);
        filename += '.wav';
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("Download failed:", e);
      alert("Lỗi khi tạo file: " + e.message);
    }
    
    setShowDownloadConfirm(false);
  };

  // --- Handlers for Batch Processing (TTS & STT) ---

  const addFilesToBatchQueue = (files: File[]) => {
    const validFiles: File[] = [];
    
    if (appMode === 'TTS') {
        files.forEach(f => {
            if (f.name.toLowerCase().endsWith('.txt') || f.type === 'text/plain') {
                validFiles.push(f);
            }
        });
        if (validFiles.length < files.length) alert("Đã bỏ qua các file không phải .txt");
    } else {
        // STT Mode
        files.forEach(f => {
            if ((f.type.startsWith('audio/') || f.type.startsWith('video/')) && f.size <= APP_CONFIG.STT_FILE_LIMIT) {
                validFiles.push(f);
            }
        });
         if (validFiles.length < files.length) alert("Đã bỏ qua file không đúng định dạng hoặc lớn hơn 100MB.");
    }

    if (validFiles.length === 0) return;

    const newItems: BatchItem[] = validFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        progress: 0
      }));
    setBatchQueue(prev => [...prev, ...newItems]);
  };

  const handleBatchFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFilesToBatchQueue(Array.from(e.target.files));
    }
    if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
    }
  };

  const handleBatchDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBatchProcessing) {
      setIsDraggingBatch(true);
    }
  };

  const handleBatchDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBatch(false);
  };

  const handleBatchDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBatch(false);

    if (isBatchProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFilesToBatchQueue(Array.from(e.dataTransfer.files));
    }
  };

  const removeBatchItem = (id: string) => {
    setBatchQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearBatchQueue = () => {
      setBatchQueue([]);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]);
          };
          reader.onerror = reject;
      });
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const processBatchQueue = async () => {
      if (appMode === 'TTS') {
          await processTTSBatchQueue();
      } else {
          await processSTTBatchQueue();
      }
  }

  const processTTSBatchQueue = async () => {
    if (batchQueue.length === 0) return;
    
    setIsBatchProcessing(true);
    setErrorMessage(null);

    let currentQueue = [...batchQueue];
    
    for (let i = 0; i < currentQueue.length; i++) {
        if (currentQueue[i].status === 'completed') continue;

        currentQueue[i] = { ...currentQueue[i], status: 'processing', progress: 10 };
        setBatchQueue([...currentQueue]);

        try {
            const textContent = await readFileAsText(currentQueue[i].file);
            currentQueue[i].text = textContent;
            currentQueue[i].progress = 30;
            setBatchQueue([...currentQueue]);

            await delay(1000); 
            
            // USE CENTRALIZED FUNCTION (now includes friendly error & fallback)
            const buffer = await performSpeechGeneration(textContent, selectedVoice);
            
            currentQueue[i].progress = 80;
            currentQueue[i].audioBuffer = buffer;
            
            const numberPrefix = (i + 1).toString().padStart(2, '0');
            const originalName = currentQueue[i].file.name.replace(/\.txt$/i, '');
            currentQueue[i].fileNameOutput = `${numberPrefix}_${originalName}`;

            currentQueue[i].status = 'completed';
            currentQueue[i].progress = 100;

        } catch (error: any) {
            console.error(`Error processing file ${currentQueue[i].file.name}:`, error);
            currentQueue[i].status = 'error';
            currentQueue[i].errorMsg = error.message; // Friendly message automatically propagated
        }

        setBatchQueue([...currentQueue]);
    }

    setIsBatchProcessing(false);
  };

  const processSTTBatchQueue = async () => {
    if (batchQueue.length === 0) return;
    
    setIsBatchProcessing(true);
    setErrorMessage(null);
    
    let currentQueue = [...batchQueue];
    
    for (let i = 0; i < currentQueue.length; i++) {
        if (currentQueue[i].status === 'completed') continue;

        currentQueue[i] = { ...currentQueue[i], status: 'processing', progress: 10 };
        setBatchQueue([...currentQueue]);

        try {
            const base64Data = await readFileAsBase64(currentQueue[i].file);
            currentQueue[i].progress = 40;
            setBatchQueue([...currentQueue]);

            await delay(1000); 
            
            const resultText = await transcribeAudio(base64Data, currentQueue[i].file.type);
            currentQueue[i].text = resultText;
            currentQueue[i].progress = 90;
            setBatchQueue([...currentQueue]);

            const numberPrefix = (i + 1).toString().padStart(2, '0');
            const originalName = currentQueue[i].file.name.substring(0, currentQueue[i].file.name.lastIndexOf('.')) || currentQueue[i].file.name;
            currentQueue[i].fileNameOutput = `${numberPrefix}_${originalName}`;

            currentQueue[i].status = 'completed';
            currentQueue[i].progress = 100;

        } catch (error: any) {
            console.error(`Error processing STT file ${currentQueue[i].file.name}:`, error);
            currentQueue[i].status = 'error';
            currentQueue[i].errorMsg = getFriendlyErrorMessage(error);
        }

        setBatchQueue([...currentQueue]);
    }

    setIsBatchProcessing(false);
  };

  const handleBatchItemDownload = (item: BatchItem, format: 'wav' | 'mp3' | 'txt') => {
      
      if (format === 'txt') {
          if(!item.text || !item.fileNameOutput) return;
          const blob = new Blob([item.text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${item.fileNameOutput}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
      }

      if (!item.audioBuffer || !item.fileNameOutput) return;

      try {
          let blob: Blob;
          let filename = item.fileNameOutput;

          if (format === 'mp3') {
              blob = createMp3Blob(item.audioBuffer);
              filename += '.mp3';
          } else {
              blob = createWavFile(item.audioBuffer);
              filename += '.wav';
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (e: any) {
          alert("Lỗi tải file: " + e.message);
      }
  };


  // --- Handlers for STT Single ---

  const handleSttFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        if (file.size > APP_CONFIG.STT_FILE_LIMIT) { 
             alert("File quá lớn. Vui lòng chọn file dưới 100MB.");
             return;
        }
        setSttFile(file);
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            setSttFileBase64(base64Data);
        };
    } else {
        alert("Vui lòng chọn file âm thanh hợp lệ (.mp3, .wav, .m4a, ...)");
    }
  };

  const handleTranscribe = async () => {
    if (!sttFile || !sttFileBase64) {
        setErrorMessage("Vui lòng chọn file âm thanh.");
        return;
    }

    setLoadingState(LoadingState.PROCESSING);
    setErrorMessage(null);
    setSttResult('');

    try {
        const resultText = await transcribeAudio(sttFileBase64, sttFile.type);
        setSttResult(resultText);
        setLoadingState(LoadingState.SUCCESS);
    } catch (error: any) {
        console.error(error);
        setErrorMessage(getFriendlyErrorMessage(error));
        setLoadingState(LoadingState.ERROR);
    }
  };

  const handleCopyStt = () => {
      navigator.clipboard.writeText(sttResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadStt = () => {
    const blob = new Blob([sttResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stt-transcription-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper render for Batch Queue to avoid duplication
  const renderBatchQueue = () => (
      <div className="w-full h-full flex flex-col">
            {/* STATUS AREA (30%) */}
            <div className="h-[30%] min-h-[120px] flex flex-col items-center justify-center border-b border-gray-700 mb-4 pb-4">
            {batchQueue.length === 0 ? (
                <div className="text-gray-500 text-center">
                    <Layers size={40} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">Danh sách trống</p>
                </div>
            ) : (
                <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-brand-blue mx-auto mb-3 flex items-center justify-center relative">
                        {isBatchProcessing && (
                            <>
                                <div className="absolute inset-0 border-4 border-brand-gold/30 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-brand-gold rounded-full border-t-transparent animate-spin"></div>
                            </>
                        )}
                        <FolderArchive size={24} className={isBatchProcessing ? "text-brand-gold" : "text-gray-400"} />
                    </div>
                    <h3 className="text-lg font-medium text-white">
                        {isBatchProcessing 
                            ? `Đang xử lý ${batchQueue.filter(i => i.status === 'completed').length}/${batchQueue.length}...` 
                            : batchQueue.some(i => i.status === 'completed') ? "Hoàn tất xử lý" : "Sẵn sàng"}
                    </h3>
                </div>
            )}
        </div>

        {/* QUEUE LIST AREA (70%) */}
        <div className="flex-grow overflow-y-auto pr-1">
            {batchQueue.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs text-gray-400 px-2 sticky top-0 bg-brand-blueLight pb-2 z-10">
                        <span>Danh sách file ({batchQueue.length})</span>
                        {!isBatchProcessing && (
                            <button onClick={clearBatchQueue} className="text-red-400 hover:text-red-300 flex items-center gap-1">
                                <Trash2 size={12} /> Xóa
                            </button>
                        )}
                    </div>
                    {batchQueue.map((item, index) => (
                        <div key={item.id} className="bg-brand-blue border border-gray-700 rounded-lg p-3 flex items-center justify-between gap-3 hover:border-gray-500 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden flex-grow">
                                <span className="text-xs font-mono text-gray-500 w-6">{(index + 1).toString().padStart(2, '0')}</span>
                                <div className="min-w-0 flex-grow">
                                    <p className="text-sm font-medium truncate text-gray-200">{item.file.name}</p>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-300 ${item.status === 'error' ? 'bg-red-500' : 'bg-brand-gold'}`} 
                                            style={{ width: `${item.progress}%` }}
                                        ></div>
                                    </div>
                                    {item.status === 'error' && <p className="text-[10px] text-red-400 mt-1 truncate">{item.errorMsg}</p>}
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                                {item.status === 'pending' && <span className="text-[10px] text-gray-500">Chờ...</span>}
                                {item.status === 'processing' && <Loader2 size={14} className="text-brand-gold animate-spin" />}
                                {item.status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                                
                                {item.status === 'completed' && (
                                    <>
                                        {appMode === 'TTS' ? (
                                            <>
                                                <button 
                                                    onClick={() => handleBatchItemDownload(item, 'mp3')}
                                                    className="text-[10px] bg-brand-gold text-brand-blue px-2 py-1 rounded font-bold hover:bg-brand-goldHover flex items-center gap-1"
                                                    title="Tải MP3"
                                                >
                                                    <Music size={10} /> MP3
                                                </button>
                                                <button 
                                                    onClick={() => handleBatchItemDownload(item, 'wav')}
                                                    className="text-[10px] bg-gray-700 text-gray-200 px-2 py-1 rounded hover:bg-gray-600 flex items-center gap-1"
                                                    title="Tải WAV"
                                                >
                                                    <FileAudio size={10} /> WAV
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => handleBatchItemDownload(item, 'txt')}
                                                className="text-[10px] bg-brand-gold text-brand-blue px-2 py-1 rounded font-bold hover:bg-brand-goldHover flex items-center gap-1"
                                                title="Tải TXT"
                                            >
                                                <Download size={10} /> TXT
                                            </button>
                                        )}
                                    </>
                                )}
                                
                                {!isBatchProcessing && item.status === 'pending' && (
                                    <button onClick={() => removeBatchItem(item.id)} className="ml-2 text-gray-600 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-brand-blue font-sans text-brand-text flex flex-col relative">
      <Header />

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-6">
        
        {/* MODE TABS & SETTINGS BUTTON */}
        <div className="flex justify-center mb-8 relative">
            <div className="bg-brand-blueLight border border-gray-600 p-1 rounded-xl inline-flex gap-1">
                <button
                    onClick={() => {
                        setAppMode('TTS');
                        setIsBatchMode(false);
                        setBatchQueue([]);
                    }}
                    className={`px-6 py-2 rounded-lg font-medium text-sm sm:text-base transition-all flex items-center gap-2 ${appMode === 'TTS' ? 'bg-brand-gold text-brand-blue shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Volume2 size={18} />
                    Văn bản → Giọng nói
                </button>
                <button
                    onClick={() => {
                        setAppMode('STT');
                        setIsBatchMode(false);
                        setBatchQueue([]);
                    }}
                    className={`px-6 py-2 rounded-lg font-medium text-sm sm:text-base transition-all flex items-center gap-2 ${appMode === 'STT' ? 'bg-brand-gold text-brand-blue shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Mic size={18} />
                    Giọng nói → Văn bản
                </button>
            </div>
            
            <button 
                onClick={() => setShowSettings(true)}
                className="absolute right-0 top-1 text-gray-300 hover:text-brand-gold transition-colors p-2 flex items-center gap-2 border border-gray-600 rounded-lg bg-brand-blueLight hover:bg-gray-700"
                title="Cài đặt API Key cho giọng nâng cao"
            >
                <KeyRound size={18} />
                <span className="hidden sm:inline text-sm font-medium">Cài đặt API</span>
            </button>
        </div>

        {appMode === 'TTS' ? (
            /* ================= TTS UI ================= */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* LEFT COLUMN: CONFIGURATION */}
            <div className="space-y-6 bg-brand-blueLight p-6 rounded-2xl shadow-xl border border-gray-700">
                
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-brand-gold mb-4 flex items-center gap-2">
                        <FileText />
                        Cấu hình
                    </h2>
                    
                    {/* Switch Single/Batch Mode */}
                    <button 
                        onClick={() => {
                            if (!isBatchProcessing) {
                                setIsBatchMode(!isBatchMode);
                                setBatchQueue([]);
                            }
                        }}
                        disabled={isBatchProcessing}
                        className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all ${isBatchMode ? 'bg-brand-gold text-brand-blue border-brand-gold' : 'text-gray-400 border-gray-600 hover:border-gray-400'}`}
                    >
                        <Layers size={14} />
                        {isBatchMode ? 'Chế độ Hàng Loạt' : 'Chế độ Đơn Lẻ'}
                    </button>
                </div>

                {/* Configuration (Shared) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center min-h-[36px]">
                        <label className="text-sm font-medium text-gray-300">Ngôn ngữ đọc</label>
                        </div>
                        <select 
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full bg-brand-blue border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                        disabled={isBatchProcessing}
                        >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center min-h-[36px]">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            Giọng đọc
                            <button 
                                onClick={() => setShowCloneModal(true)}
                                className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-brand-gold flex items-center gap-1 transition-colors"
                                title="Tạo giọng mới từ mẫu (ElevenLabs)"
                            >
                                <PlusCircle size={10} /> Clone
                            </button>
                        </label>
                        <button 
                            type="button"
                            onClick={handlePreviewVoice}
                            disabled={isPreviewing || isBatchProcessing}
                            title="Nghe thử giọng này"
                            className="p-1.5 rounded hover:bg-brand-gold/10 text-brand-gold transition-colors disabled:opacity-50"
                        >
                            {isPreviewing ? <Loader2 size={24} className="animate-spin"/> : <Volume2 size={24}/>}
                        </button>
                        </div>
                        <select 
                        value={selectedVoice.id}
                        onChange={(e) => {
                             // Check standard voices
                             const v = ALL_VOICES.find(vo => vo.id === e.target.value);
                             if (v) {
                                 setSelectedVoice(v);
                             } else {
                                 // Check custom/fetched voices
                                 const vc = customVoices.find(vo => vo.id === e.target.value);
                                 if (vc) {
                                     setSelectedVoice(vc);
                                     return;
                                 }
                                 const vf = fetchedElevenLabsVoices.find(vo => vo.id === e.target.value);
                                 if (vf) {
                                     setSelectedVoice(vf);
                                 }
                             }
                        }}
                        className="w-full bg-brand-blue border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                        disabled={isBatchProcessing}
                        >
                            <optgroup label="Gemini AI (Miễn phí)">
                                {GEMINI_VOICES.map((voice) => (
                                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Google Cloud (Yêu cầu API Key)">
                                {GOOGLE_VOICES.map((voice) => (
                                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="ElevenLabs (Cao cấp - Yêu cầu API Key)">
                                {fetchedElevenLabsVoices.length > 0 
                                    ? fetchedElevenLabsVoices.map((voice) => (
                                        <option key={voice.id} value={voice.id}>{voice.name}</option>
                                      ))
                                    : ELEVENLABS_VOICES.map((voice) => (
                                        <option key={voice.id} value={voice.id}>{voice.name}</option>
                                      ))
                                }
                            </optgroup>
                            {customVoices.length > 0 && (
                                <optgroup label="Giọng Clone Mới (ElevenLabs)">
                                    {customVoices.map((voice) => (
                                        <option key={voice.id} value={voice.id}>{voice.name}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                </div>

                {/* Speed Control */}
                <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                    <span>Tốc độ đọc {selectedVoice.provider === 'elevenlabs' ? '(Mặc định cho ElevenLabs)' : ''}</span>
                    <span className="text-brand-gold font-bold">{speed}x</span>
                </div>
                <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.25"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    disabled={isBatchProcessing || selectedVoice.provider === 'elevenlabs'}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-gold hover:accent-brand-goldHover disabled:opacity-50"
                />
                </div>

                {/* ================= SINGLE MODE INPUT ================= */}
                {!isBatchMode && (
                    <div className="space-y-2 animate-fade-in">
                        <div className="flex flex-col gap-2 mb-1">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-medium text-gray-300">Nội dung văn bản</label>
                            </div>
                            
                            {/* Toolbar */}
                            <div className="flex flex-col gap-2 bg-brand-blue/50 p-2 rounded-lg border border-gray-700">
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Translation Tool */}
                                    <div className="flex items-center gap-1 border-r border-gray-600 pr-2">
                                        <Languages size={14} className="text-gray-400" />
                                        <select 
                                            value={translationTargetLang}
                                            onChange={(e) => setTranslationTargetLang(e.target.value)}
                                            className="bg-transparent text-xs text-gray-300 focus:outline-none border-none p-1 cursor-pointer max-w-[90px]"
                                        >
                                            {SUPPORTED_LANGUAGES.map((lang) => (
                                                <option key={`trans-${lang.code}`} value={lang.code} className="bg-brand-blue">
                                                    {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button 
                                            onClick={handleTranslate}
                                            disabled={isTranslating || !text.trim()}
                                            className="bg-brand-blueLight hover:bg-brand-gold hover:text-brand-blue text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
                                            title="Dịch văn bản"
                                        >
                                            {isTranslating ? <Loader2 size={12} className="animate-spin"/> : 'Dịch'}
                                        </button>
                                    </div>

                                    {/* Optimization Controls */}
                                    <div className="flex flex-wrap items-center gap-1 pl-1 flex-grow">
                                        <div className="flex items-center gap-1">
                                            <Sparkles size={14} className="text-brand-gold" />
                                            <select 
                                                value={optimizationStyle}
                                                onChange={(e) => setOptimizationStyle(e.target.value as any)}
                                                className="bg-transparent text-xs text-gray-300 focus:outline-none border-none p-1 cursor-pointer w-[120px]"
                                                title="Chọn phong cách viết lại"
                                            >
                                                <option value="emotional" className="bg-brand-blue font-bold text-yellow-400">🔥 Truyền cảm (Hot)</option>
                                                <option value="sales" className="bg-brand-blue">Bán hàng / Review</option>
                                                <option value="mc" className="bg-brand-blue">MC Chuyên nghiệp</option>
                                                <option value="story" className="bg-brand-blue">Kể chuyện cảm xúc</option>
                                                <option value="short" className="bg-brand-blue">Tóm tắt ngắn (TikTok)</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1 border-l border-gray-600 pl-2">
                                            <MapPin size={14} className="text-green-400" />
                                            <select 
                                                value={selectedDialect}
                                                onChange={(e) => setSelectedDialect(e.target.value as RegionalDialect)}
                                                className="bg-transparent text-xs text-gray-300 focus:outline-none border-none p-1 cursor-pointer w-[100px]"
                                                title="Chuyển giọng vùng miền"
                                            >
                                                {REGIONS.map(r => (
                                                    <option key={r.id} value={r.id} className="bg-brand-blue">
                                                        {r.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1 border-l border-gray-600 pl-2">
                                            <Clock size={14} className="text-blue-400" />
                                            <select 
                                                value={selectedPlatformId}
                                                onChange={(e) => setSelectedPlatformId(e.target.value)}
                                                className="bg-transparent text-xs text-gray-300 focus:outline-none border-none p-1 cursor-pointer w-[110px]"
                                                title="Tối ưu thời lượng cho nền tảng"
                                            >
                                                {TARGET_PLATFORMS.map(p => (
                                                    <option key={p.id} value={p.id} className="bg-brand-blue">
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Custom Optimization Prompt Input */}
                                <div className="flex items-center gap-2 pt-1 border-t border-gray-700/50 mt-1">
                                    <MessageSquarePlus size={14} className="text-gray-500" />
                                    <input 
                                        type="text" 
                                        value={optimizationPrompt}
                                        onChange={(e) => setOptimizationPrompt(e.target.value)}
                                        placeholder="Gợi ý thêm cho AI (VD: hài hước, nhấn mạnh giá, dùng từ ngữ GenZ...)"
                                        className="bg-brand-blue/50 text-xs text-gray-200 focus:outline-none border border-gray-700 focus:border-brand-gold/50 rounded px-2 py-1 flex-grow"
                                    />
                                     <button 
                                        onClick={handleOptimizeContent}
                                        disabled={isOptimizing || !text.trim()}
                                        className="ml-auto bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-blue text-brand-gold text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-brand-gold/30 whitespace-nowrap flex items-center gap-1"
                                        title="Viết lại nội dung bằng AI"
                                    >
                                        {isOptimizing ? <Loader2 size={12} className="animate-spin"/> : <PenTool size={12}/>}
                                        {isOptimizing ? 'Đang viết...' : 'Tối ưu ngay'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <textarea
                                value={text}
                                onChange={handleTextChange}
                                placeholder="Nhập văn bản tiếng Việt hoặc các ngôn ngữ khác vào đây..."
                                className="w-full h-64 bg-brand-blue border border-gray-600 rounded-xl p-4 text-base leading-relaxed focus:ring-2 focus:ring-brand-gold focus:outline-none resize-none"
                            />
                            <div className="absolute bottom-3 right-3 text-xs bg-brand-blue/80 px-2 py-1 rounded-md text-gray-400 border border-gray-700 pointer-events-none">
                                {text.length}/{APP_CONFIG.TTS_CHAR_LIMIT} ký tự
                            </div>
                        </div>

                        {/* File Upload for Single Mode */}
                        <div className="flex flex-col sm:flex-row gap-6 items-center justify-between pt-4 border-t border-gray-700/50 mt-2">
                            <div className="w-full sm:w-auto flex flex-col gap-2">
                                <input 
                                    type="file" 
                                    accept=".txt"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    id="file-upload"
                                />
                                
                                {!selectedFile ? (
                                <div className="flex flex-col gap-1.5">
                                    <label 
                                        htmlFor="file-upload"
                                        className="cursor-pointer inline-flex items-center justify-center gap-2 text-sm text-brand-gold hover:text-brand-goldHover transition-colors px-5 py-2.5 border border-brand-gold/30 rounded-lg hover:bg-brand-gold/10 w-full"
                                    >
                                    <FileText size={18} />
                                    Tải file .txt lên
                                    </label>
                                    <div className="text-[10px] text-gray-400 text-center leading-tight space-y-0.5 bg-gray-800/50 p-1.5 rounded border border-gray-700">
                                        <p>Chỉ hỗ trợ file <strong>.txt</strong></p>
                                        <p className="opacity-75">Với Word/PDF: Hãy Copy & Dán</p>
                                    </div>
                                </div>
                                ) : (
                                <div className="flex flex-col gap-2 w-full sm:min-w-[200px]">
                                    <div className="flex items-center gap-2 bg-brand-blue border border-brand-gold/40 rounded-lg p-2 relative">
                                        <div className="bg-brand-gold/20 p-1.5 rounded flex-shrink-0">
                                            <FileText size={16} className="text-brand-gold" />
                                        </div>
                                        <div className="flex-grow min-w-0 pr-6">
                                            <p className="text-xs font-bold text-gray-200 truncate">{selectedFile.name}</p>
                                        </div>
                                        <button onClick={handleRemoveFile} className="absolute top-1 right-1 p-1 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <button onClick={handleExtractFile} className="w-full text-xs py-1.5 bg-brand-blue hover:bg-brand-gold/10 border border-brand-gold/30 text-brand-gold rounded flex items-center justify-center gap-1 transition-colors">
                                        <ArrowRight size={12} />
                                        Trích xuất văn bản
                                    </button>
                                </div>
                                )}
                            </div>

                            <button
                                onClick={handleConvert}
                                disabled={loadingState === LoadingState.PROCESSING}
                                className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-brand-blue shadow-lg flex items-center justify-center gap-2 transform transition-all flex-grow sm:flex-grow-0 h-12
                                    ${loadingState === LoadingState.PROCESSING ? 'bg-gray-500 cursor-not-allowed' : 'bg-brand-gold hover:bg-brand-goldHover hover:scale-105'}
                                `}
                            >
                                {loadingState === LoadingState.PROCESSING ? <><Loader2 className="animate-spin" /> Đang xử lý...</> : <><Wand2 size={20} /> Chuyển thành giọng nói</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ================= BATCH MODE UI (TTS) ================= */}
                {isBatchMode && (
                    <div className="space-y-4 animate-fade-in">
                        <div 
                            onDragOver={handleBatchDragOver}
                            onDragLeave={handleBatchDragLeave}
                            onDrop={handleBatchDrop}
                            className={`
                                rounded-xl p-4 flex flex-col items-center justify-center border-dashed min-h-[150px] transition-all duration-200
                                ${isDraggingBatch 
                                    ? 'bg-brand-gold/10 border-2 border-brand-gold scale-[1.02]' 
                                    : 'bg-brand-blue/30 border border-gray-600'
                                }
                            `}
                        >
                             <input 
                                type="file" 
                                accept={appMode === 'TTS' ? ".txt" : "audio/*,video/*"}
                                multiple
                                ref={batchFileInputRef}
                                onChange={handleBatchFilesSelect}
                                className="hidden" 
                                id="batch-upload"
                                disabled={isBatchProcessing}
                            />
                            <label 
                                htmlFor="batch-upload"
                                className={`cursor-pointer flex flex-col items-center gap-2 text-brand-gold hover:text-brand-goldHover transition-colors ${isBatchProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isDraggingBatch ? (
                                    <UploadCloud size={32} className="animate-bounce" />
                                ) : (
                                    <Layers size={32} />
                                )}
                                <span className="font-bold">
                                    {isDraggingBatch ? "Thả file vào đây" : `Chọn hoặc Kéo thả nhiều file ${appMode === 'TTS' ? '.txt' : 'âm thanh'}`}
                                </span>
                                <span className="text-xs text-gray-400">Hỗ trợ upload hàng loạt</span>
                            </label>
                        </div>

                        {/* Batch Start Button */}
                        <div className="pt-4 border-t border-gray-700/50">
                             <button
                                onClick={processBatchQueue}
                                disabled={isBatchProcessing || batchQueue.length === 0}
                                className={`w-full py-3 rounded-lg font-bold text-brand-blue shadow-lg flex items-center justify-center gap-2 transform transition-all h-12
                                    ${isBatchProcessing || batchQueue.length === 0 ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-brand-gold hover:bg-brand-goldHover hover:scale-105'}
                                `}
                            >
                                {isBatchProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Đang chạy lần lượt...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={20} />
                                        Bắt đầu xử lý hàng loạt
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {errorMessage && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg flex items-start gap-2 text-sm animate-fade-in">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
                )}
            </div>

            {/* RIGHT COLUMN: RESULT (ADAPTIVE) */}
            <div className="space-y-6">
                <div className="bg-brand-blueLight p-6 rounded-2xl shadow-xl border border-gray-700 h-full flex flex-col animate-fade-in">
                <h2 className="text-2xl font-bold text-brand-gold mb-6 flex items-center gap-2">
                    <Volume2 />
                    {isBatchMode ? 'Danh sách xử lý' : 'Kết quả giọng nói'}
                </h2>

                <div className="flex-grow flex flex-col items-center justify-center space-y-8 py-4">
                    {/* BATCH MODE RESULT VIEW */}
                    {isBatchMode ? (
                        renderBatchQueue()
                    ) : (
                        /* SINGLE MODE RESULT VIEW */
                        <>
                            {loadingState === LoadingState.IDLE && (
                            <div className="text-center text-gray-500">
                                <div className="w-24 h-24 rounded-full bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                                <Volume2 size={40} className="text-gray-600" />
                                </div>
                                <p>Vui lòng nhập văn bản và bấm chuyển đổi</p>
                            </div>
                            )}

                            {loadingState === LoadingState.PROCESSING && (
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full bg-brand-blue mx-auto mb-4 flex items-center justify-center relative">
                                    <div className="absolute inset-0 border-4 border-brand-gold/30 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-brand-gold rounded-full border-t-transparent animate-spin"></div>
                                    <Wand2 size={32} className="text-brand-gold" />
                                </div>
                                <p className="text-brand-gold animate-pulse">AI đang đọc văn bản...</p>
                            </div>
                            )}

                            {loadingState === LoadingState.SUCCESS && audioUrl && (
                            <div className="w-full space-y-6 animate-fade-in">
                                {warningMessage && (
                                    <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-200 p-3 rounded-lg flex items-start gap-2 text-xs">
                                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-yellow-400" />
                                        <span>{warningMessage}</span>
                                    </div>
                                )}

                                <div className="bg-brand-blue p-6 rounded-xl border border-gray-600 text-center">
                                <div className="mb-2 text-green-400 font-medium flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Đã tạo xong!
                                </div>
                                <audio controls src={audioUrl} className="w-full mt-2" autoPlay />
                                </div>

                                {/* BACKGROUND MUSIC MIXING UI */}
                                <div className="bg-brand-blue/50 border border-gray-700 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-gray-200 flex items-center gap-2 text-sm">
                                            <Music size={16} className="text-brand-gold" />
                                            Ghép nhạc nền (BGM)
                                        </h3>
                                        {(bgMusicBuffer || audioBuffer !== originalVoiceBuffer) && (
                                             <button onClick={resetMix} title="Reset về giọng gốc" className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                                                <RefreshCcw size={14} />
                                             </button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {!bgMusicFile ? (
                                             <div className="flex items-center gap-2">
                                                <input 
                                                    type="file" 
                                                    accept="audio/*"
                                                    ref={bgInputRef}
                                                    onChange={handleBgFileChange}
                                                    className="hidden" 
                                                    id="bg-music-upload"
                                                />
                                                <label 
                                                    htmlFor="bg-music-upload"
                                                    className="cursor-pointer flex-grow border border-dashed border-gray-600 rounded-lg p-2 flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-brand-gold hover:border-brand-gold transition-colors"
                                                >
                                                    <UploadCloud size={14} /> Chọn file nhạc nền
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 text-xs">
                                                <span className="truncate max-w-[150px]">{bgMusicFile.name}</span>
                                                <button onClick={() => { setBgMusicFile(null); setBgMusicBuffer(null); if(bgInputRef.current) bgInputRef.current.value = ''; }} className="text-red-400 hover:text-red-300">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {bgMusicBuffer && (
                                            <div className="space-y-3 pt-2 border-t border-gray-700">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-gray-400">
                                                        <span>Âm lượng giọng</span>
                                                        <span>{(voiceVolume * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="0" max="1.5" step="0.1" 
                                                        value={voiceVolume} 
                                                        onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-gray-400">
                                                        <span>Âm lượng nhạc</span>
                                                        <span>{(bgVolume * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="0" max="1" step="0.05" 
                                                        value={bgVolume} 
                                                        onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-400"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={handleMixAudio}
                                                    disabled={isMixing}
                                                    className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                                >
                                                    <Merge size={14} /> 
                                                    {isMixing ? 'Đang xử lý...' : 'Ghép nhạc ngay'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => handleDownloadClick('wav')}
                                    className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors border border-gray-600 hover:border-brand-gold"
                                >
                                    <Download size={20} className="text-blue-400" />
                                    {bgMusicBuffer && audioBuffer !== originalVoiceBuffer ? 'Tải bản ghép (WAV)' : 'Tải về WAV'}
                                </button>

                                <button 
                                    onClick={() => handleDownloadClick('mp3')}
                                    className="w-full py-3 px-4 bg-brand-blue hover:bg-gray-800 rounded-lg text-brand-gold font-medium flex items-center justify-center gap-2 transition-colors border border-brand-gold/30 hover:border-brand-gold"
                                >
                                    <Download size={20} />
                                    {bgMusicBuffer && audioBuffer !== originalVoiceBuffer ? 'Tải bản ghép (MP3)' : 'Tải về MP3'}
                                </button>
                                </div>
                            </div>
                            )}

                            {loadingState === LoadingState.ERROR && (
                            <div className="text-center text-red-400 px-4 animate-fade-in">
                                <AlertCircle size={48} className="mx-auto mb-3" />
                                <p>Không thể tạo âm thanh.</p>
                                {errorMessage && <p className="text-sm mt-2 text-red-300 bg-red-900/30 p-2 rounded">{errorMessage}</p>}
                            </div>
                            )}
                        </>
                    )}
                </div>
                </div>
            </div>
            </div>
        ) : (
            /* ================= STT UI ================= */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                
                {/* LEFT COLUMN: UPLOAD / CONFIG */}
                <div className="space-y-6 bg-brand-blueLight p-6 rounded-2xl shadow-xl border border-gray-700">
                     <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-brand-gold mb-6 flex items-center gap-2">
                            <FileAudio />
                            {isBatchMode ? 'Upload Hàng Loạt' : 'Upload File Âm thanh'}
                        </h2>
                         {/* Switch Single/Batch Mode STT */}
                        <button 
                            onClick={() => {
                                if (!isBatchProcessing) {
                                    setIsBatchMode(!isBatchMode);
                                    setBatchQueue([]);
                                }
                            }}
                            disabled={isBatchProcessing}
                            className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all ${isBatchMode ? 'bg-brand-gold text-brand-blue border-brand-gold' : 'text-gray-400 border-gray-600 hover:border-gray-400'}`}
                        >
                            <Layers size={14} />
                            {isBatchMode ? 'Chế độ Hàng Loạt' : 'Chế độ Đơn Lẻ'}
                        </button>
                    </div>

                    {!isBatchMode ? (
                        /* SINGLE STT MODE LEFT */
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-brand-gold transition-colors bg-brand-blue/50 h-64">
                                <input 
                                    type="file" 
                                    accept="audio/*,video/*"
                                    ref={sttFileInputRef}
                                    onChange={handleSttFileChange}
                                    className="hidden" 
                                    id="stt-upload"
                                />
                                {sttFile ? (
                                    <div className="space-y-4 w-full">
                                        <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto">
                                            <FileAudio size={32} className="text-brand-gold" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white truncate max-w-full px-2">{sttFile.name}</p>
                                            <p className="text-sm text-gray-400">{(sttFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <audio controls className="w-full h-8 mt-2" src={URL.createObjectURL(sttFile)} />
                                        <button 
                                            onClick={() => {
                                                setSttFile(null);
                                                setSttFileBase64(null);
                                                setSttResult('');
                                                if(sttFileInputRef.current) sttFileInputRef.current.value = '';
                                            }}
                                            className="text-sm text-red-400 hover:text-red-300 hover:underline"
                                        >
                                            Xóa file
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                                            <Mic size={32} className="text-gray-400" />
                                        </div>
                                        <label 
                                            htmlFor="stt-upload"
                                            className="cursor-pointer bg-brand-gold text-brand-blue px-6 py-2 rounded-lg font-bold hover:bg-brand-goldHover transition-colors"
                                        >
                                            Chọn file
                                        </label>
                                        <p className="text-sm text-gray-500">Hỗ trợ MP3, WAV, M4A, MP4... (Max 100MB)</p>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={handleTranscribe}
                                disabled={!sttFile || loadingState === LoadingState.PROCESSING}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                                    ${loadingState === LoadingState.PROCESSING 
                                    ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                                    : 'bg-brand-gold text-brand-blue hover:scale-105'}
                                `}
                            >
                                {loadingState === LoadingState.PROCESSING ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Đang phân tích...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 />
                                        Chuyển thành văn bản
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* BATCH STT MODE LEFT */
                        <div className="space-y-4 animate-fade-in">
                             <div 
                                onDragOver={handleBatchDragOver}
                                onDragLeave={handleBatchDragLeave}
                                onDrop={handleBatchDrop}
                                className={`
                                    rounded-xl p-4 flex flex-col items-center justify-center border-dashed min-h-[150px] transition-all duration-200
                                    ${isDraggingBatch 
                                        ? 'bg-brand-gold/10 border-2 border-brand-gold scale-[1.02]' 
                                        : 'bg-brand-blue/30 border border-gray-600'
                                    }
                                `}
                            >
                                <input 
                                    type="file" 
                                    accept="audio/*,video/*"
                                    multiple
                                    ref={batchFileInputRef}
                                    onChange={handleBatchFilesSelect}
                                    className="hidden" 
                                    id="batch-upload-stt"
                                    disabled={isBatchProcessing}
                                />
                                <label 
                                    htmlFor="batch-upload-stt"
                                    className={`cursor-pointer flex flex-col items-center gap-2 text-brand-gold hover:text-brand-goldHover transition-colors ${isBatchProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isDraggingBatch ? (
                                        <UploadCloud size={32} className="animate-bounce" />
                                    ) : (
                                        <Layers size={32} />
                                    )}
                                    <span className="font-bold">
                                        {isDraggingBatch ? "Thả file vào đây" : "Chọn hoặc Kéo thả nhiều file âm thanh"}
                                    </span>
                                    <span className="text-xs text-gray-400">Tự động trích xuất văn bản hàng loạt</span>
                                </label>
                            </div>

                             <div className="pt-4 border-t border-gray-700/50">
                                <button
                                    onClick={processBatchQueue}
                                    disabled={isBatchProcessing || batchQueue.length === 0}
                                    className={`w-full py-3 rounded-lg font-bold text-brand-blue shadow-lg flex items-center justify-center gap-2 transform transition-all h-12
                                        ${isBatchProcessing || batchQueue.length === 0 ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-brand-gold hover:bg-brand-goldHover hover:scale-105'}
                                    `}
                                >
                                    {isBatchProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Đang xử lý hàng loạt...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={20} />
                                            Bắt đầu trích xuất
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {errorMessage && (
                        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg flex items-start gap-2 text-sm mt-4">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: RESULT / LIST */}
                 <div className="bg-brand-blueLight p-6 rounded-2xl shadow-xl border border-gray-700 h-full flex flex-col animate-fade-in">
                     <h2 className="text-2xl font-bold text-brand-gold mb-6 flex items-center gap-2">
                        {isBatchMode ? <FolderArchive /> : <FileText />}
                        {isBatchMode ? 'Danh sách xử lý' : 'Kết quả văn bản'}
                    </h2>
                    
                    {!isBatchMode ? (
                        /* SINGLE STT RESULT RIGHT */
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-300">Nội dung văn bản trích xuất</label>
                                {sttResult && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleCopyStt}
                                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                                        >
                                            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                            {copied ? 'Đã sao chép' : 'Sao chép'}
                                        </button>
                                        <button 
                                            onClick={handleDownloadStt}
                                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-brand-blue hover:bg-gray-800 border border-gray-600 text-gray-200 transition-colors"
                                        >
                                            <Download size={14} />
                                            Tải TXT
                                        </button>
                                    </div>
                                )}
                            </div>
                            <textarea 
                                readOnly
                                value={sttResult}
                                placeholder="Kết quả sẽ hiển thị ở đây sau khi xử lý..."
                                className="w-full flex-grow bg-brand-blue border border-gray-600 rounded-xl p-4 text-base leading-relaxed focus:ring-2 focus:ring-brand-gold focus:outline-none resize-none font-mono text-gray-300 min-h-[300px]"
                            />
                        </div>
                    ) : (
                        /* BATCH STT QUEUE RIGHT */
                        renderBatchQueue()
                    )}
                 </div>
            </div>
        )}
      </main>

      <Footer />

      {/* Confirmation Modal (Only for TTS Download) */}
      {showDownloadConfirm && (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setShowDownloadConfirm(false)}
        >
            <div 
                className="bg-brand-blueLight border border-gray-600 rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-brand-gold mb-3 text-center">Xác nhận tải về</h3>
                <p className="text-gray-300 mb-6 text-center">
                  Bạn có chắc chắn muốn tải file âm thanh 
                  <span className="font-bold text-white mx-1">
                    ({downloadFormat.toUpperCase()})
                  </span> 
                  này về máy không?
                </p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setShowDownloadConfirm(false)}
                        className="px-5 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors font-medium"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={performDownload}
                        className="px-5 py-2 rounded-lg bg-brand-gold text-brand-blue font-bold hover:bg-brand-goldHover transition-colors flex items-center gap-2"
                    >
                        <Download size={16} />
                        Đồng ý
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* VOICE CLONING MODAL */}
      {showCloneModal && (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in"
            onClick={() => setShowCloneModal(false)}
        >
            <div 
                className="bg-brand-blueLight border border-gray-600 rounded-xl p-6 max-w-lg w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-gold flex items-center gap-2">
                        <Fingerprint size={24} /> Tạo giọng Clone (ElevenLabs)
                    </h3>
                    <button onClick={() => setShowCloneModal(false)} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <p className="text-sm text-gray-400 mb-6">
                    Tải lên các mẫu giọng nói (1-25 file) để tạo một bản sao giọng nói AI. Tính năng này yêu cầu ElevenLabs API Key.
                </p>

                <form onSubmit={handleCloneSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Tên giọng mới <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            required
                            value={cloneName}
                            onChange={e => setCloneName(e.target.value)}
                            placeholder="Ví dụ: Giọng của tôi, Giọng đọc truyện..."
                            className="w-full bg-brand-blue border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Mô tả (Tùy chọn)</label>
                        <input 
                            type="text" 
                            value={cloneDesc}
                            onChange={e => setCloneDesc(e.target.value)}
                            placeholder="Ví dụ: Giọng trầm ấm, dùng cho tin tức..."
                            className="w-full bg-brand-blue border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">File mẫu giọng (MP3, WAV...) <span className="text-red-400">*</span></label>
                        <input 
                            type="file" 
                            multiple
                            accept="audio/*"
                            ref={cloneFileInputRef}
                            onChange={handleCloneFilesSelect}
                            className="hidden" 
                            id="clone-files"
                        />
                         <label 
                            htmlFor="clone-files"
                            className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-4 gap-2 hover:border-brand-gold hover:bg-brand-blue/50 transition-colors"
                        >
                            <UploadCloud size={24} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-300">
                                {cloneFiles.length > 0 ? `Đã chọn ${cloneFiles.length} file` : "Chọn file mẫu giọng"}
                            </span>
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                         <button 
                            type="button"
                            onClick={() => setShowCloneModal(false)}
                            className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit"
                            disabled={isCloning}
                            className={`px-4 py-2 rounded-lg bg-brand-gold text-brand-blue font-bold hover:bg-brand-goldHover transition-colors flex items-center gap-2 text-sm ${isCloning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isCloning ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                            {isCloning ? 'Đang tạo...' : 'Tạo giọng ngay'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* API SETTINGS MODAL */}
      {showSettings && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in"
            onClick={() => setShowSettings(false)}
        >
            <div 
                className="bg-brand-blueLight border border-gray-600 rounded-xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-brand-gold flex items-center gap-2">
                        <Settings2 size={24} /> Cài đặt API Key
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg mb-4 flex gap-2">
                    <ShieldAlert size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-400">
                        API Key của bạn được lưu trữ an toàn trong <strong>Local Storage</strong> của trình duyệt này và không bao giờ được gửi đi đâu khác ngoài Google/ElevenLabs.
                    </p>
                </div>
                
                <form onSubmit={handleSaveApiKeys} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 block">Google Cloud API Key (cho giọng Google)</label>
                        <input 
                            type="password" 
                            value={apiKeys.googleCloud || ''}
                            onChange={e => setApiKeys({...apiKeys, googleCloud: e.target.value})}
                            placeholder="Nhập khóa API Google Cloud..."
                            className="w-full bg-brand-blue border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                        />
                        <p className="text-xs text-gray-500">Dùng để kích hoạt giọng WaveNet và Neural2.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 block">ElevenLabs API Key (cho giọng ElevenLabs)</label>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                value={apiKeys.elevenLabs || ''}
                                onChange={e => setApiKeys({...apiKeys, elevenLabs: e.target.value})}
                                placeholder="Nhập khóa API ElevenLabs..."
                                className="w-full bg-brand-blue border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                            />
                             <button 
                                type="button"
                                onClick={handleFetchElevenLabsVoices}
                                disabled={isLoadingVoices || !apiKeys.elevenLabs}
                                className="bg-brand-blue border border-gray-600 hover:bg-gray-700 text-brand-gold px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Kiểm tra Key & Tải danh sách giọng"
                            >
                                {isLoadingVoices ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                            </button>
                        </div>
                         <p className="text-xs text-gray-500 flex justify-between">
                             <span>Dùng để kích hoạt các giọng đọc truyền cảm.</span>
                             {fetchedElevenLabsVoices.length > 0 && <span className="text-green-400">Đã tải {fetchedElevenLabsVoices.length} giọng.</span>}
                         </p>
                    </div>

                    <div className="pt-4 flex justify-between gap-3">
                         <button 
                            type="button"
                            onClick={handleClearApiKeys}
                            className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors text-sm flex items-center gap-1"
                        >
                            <Trash2 size={14} /> Xóa Key đã lưu
                        </button>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
                            >
                                Đóng
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-brand-gold text-brand-blue font-bold hover:bg-brand-goldHover transition-colors flex items-center gap-2 text-sm"
                            >
                                <Save size={16} /> Lưu cài đặt
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
