// src/utils/voice/audioUtils.ts

import { AUDIO_CONFIG } from './constants';

/**
 * Convert Float32Array audio data to PCM16 ArrayBuffer
 */
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  
  return buffer;
}

/**
 * Convert PCM16 ArrayBuffer to Float32Array for Web Audio
 */
export function pcm16ToFloat32(pcm16: ArrayBuffer): Float32Array {
  const int16 = new Int16Array(pcm16);
  const float32 = new Float32Array(int16.length);
  
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
  }
  
  return float32;
}

/**
 * Encode ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Resample audio from one sample rate to another
 */
export function resampleAudio(
  inputBuffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return inputBuffer;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.round(inputBuffer.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, inputBuffer.length - 1);
    const t = srcIndex - srcIndexFloor;
    
    // Linear interpolation
    output[i] = inputBuffer[srcIndexFloor] * (1 - t) + inputBuffer[srcIndexCeil] * t;
  }

  return output;
}

/**
 * Calculate RMS (Root Mean Square) audio level
 */
export function calculateAudioLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  
  const rms = Math.sqrt(sum / samples.length);
  // Convert to 0-1 range with some scaling for better visualization
  return Math.min(1, rms * 3);
}

/**
 * Create an audio context with the correct sample rate
 */
export function createAudioContext(): AudioContext {
  return new AudioContext({ sampleRate: AUDIO_CONFIG.sampleRate });
}

/**
 * Merge multiple audio buffers into one
 */
export function mergeAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  
  return result.buffer;
}

/**
 * Generate a unique ID for messages/audio chunks
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}