
// Utility to create a WAV header for PCM data
// Gemini output is typically raw PCM at 24kHz.

export const convertPCMToAudioBuffer = (
  pcmData: ArrayBuffer,
  audioContext: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): AudioBuffer => {
  // Fix: Ensure byte length is even for Int16Array
  // If we receive an odd number of bytes, new Int16Array will throw RangeError
  const byteLength = pcmData.byteLength;
  const safeBuffer = byteLength % 2 === 0 ? pcmData : pcmData.slice(0, byteLength - 1);

  const dataInt16 = new Int16Array(safeBuffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit int to float [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const createWavFile = (audioBuffer: AudioBuffer): Blob => {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this specific utility)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < audioBuffer.numberOfChannels; i++)
    channels.push(audioBuffer.getChannelData(i));

  while (pos < audioBuffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true); // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

export const createMp3Blob = (audioBuffer: AudioBuffer): Blob => {
  const lamejs = (window as any).lamejs;
  if (!lamejs) {
    throw new Error("Lamejs library not loaded. Cannot convert to MP3.");
  }

  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Initialize encoder (Stereo or Mono depending on channels, 128kbps)
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  
  // Encode
  const mp3Data = [];
  const samplesLeft = new Int16Array(audioBuffer.length);
  const samplesRight = channels > 1 ? new Int16Array(audioBuffer.length) : undefined;
  
  // Helper to convert float to int16
  const convertBuffer = (float32Arr: Float32Array, int16Arr: Int16Array) => {
      for (let i = 0; i < float32Arr.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Arr[i]));
          int16Arr[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
  };

  convertBuffer(audioBuffer.getChannelData(0), samplesLeft);
  if (channels > 1 && samplesRight) {
      convertBuffer(audioBuffer.getChannelData(1), samplesRight);
  }

  let mp3buf;
  if (channels === 1) {
      mp3buf = mp3encoder.encodeBuffer(samplesLeft);
  } else {
      mp3buf = mp3encoder.encodeBuffer(samplesLeft, samplesRight);
  }

  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }
  
  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(endBuf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
};

/**
 * Mixes two audio buffers (Voice + Background Music).
 * The output duration is determined by the Voice buffer length.
 * Background music loops if shorter than voice.
 * Automatically upgrades to Stereo if Background Music is Stereo.
 */
export const mixAudioBuffers = (
  voiceBuffer: AudioBuffer,
  bgBuffer: AudioBuffer,
  context: AudioContext,
  voiceVolume: number = 1.0,
  bgVolume: number = 0.5
): AudioBuffer => {
  // Determine output channels: If either voice or BG is stereo, output is stereo.
  const channels = Math.max(voiceBuffer.numberOfChannels, bgBuffer.numberOfChannels);
  const length = voiceBuffer.length;
  const sampleRate = voiceBuffer.sampleRate;
  
  const outputBuffer = context.createBuffer(channels, length, sampleRate);

  for (let i = 0; i < channels; i++) {
    const outputData = outputBuffer.getChannelData(i);
    
    // Map Voice Channel: If Voice is mono but Output is Stereo, use Voice Ch 0 for both output channels.
    const voiceChannelIndex = i < voiceBuffer.numberOfChannels ? i : 0;
    const voiceData = voiceBuffer.getChannelData(voiceChannelIndex);
    
    // Map BG Channel: Similar logic, reuse channel 0 if BG is mono
    const bgChannelIndex = i < bgBuffer.numberOfChannels ? i : 0;
    const bgData = bgBuffer.getChannelData(bgChannelIndex);

    for (let j = 0; j < length; j++) {
      // Loop background music logic
      const bgIndex = j % bgData.length;
      
      // Mixing formula
      outputData[j] = (voiceData[j] * voiceVolume) + (bgData[bgIndex] * bgVolume);
      
      // Simple hard limiter to prevent clipping
      if (outputData[j] > 1) outputData[j] = 1;
      if (outputData[j] < -1) outputData[j] = -1;
    }
  }

  return outputBuffer;
};
