/**
 * text-to-speech-tts - TypeScript Declarations
 */

export interface AtlasVoiceAnalyticsCredentials {
  username: string;
  password: string;
}

export interface AtlasVoiceAnalyticsOptions {
  enabled: boolean;
  wpRestUrl?: string;
  postId?: number;
  credentials?: AtlasVoiceAnalyticsCredentials;
}

export interface AtlasVoiceOptions {
  contentSelector: string;
  playerSelector: string;
  voice?: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  highlightText?: boolean;
  theme?: 'default' | 'minimal';
  analytics?: AtlasVoiceAnalyticsOptions;
}

export type AtlasVoiceEvent =
  | 'play'
  | 'pause'
  | 'resume'
  | 'end'
  | 'stop'
  | 'error'
  | 'voiceschanged';

export type AtlasVoiceState = 'idle' | 'playing' | 'paused';

declare class AtlasVoice {
  static readonly VERSION: string;

  state: AtlasVoiceState;
  analytics: object | null;

  constructor(options: AtlasVoiceOptions);

  play(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  destroy(): void;

  on(event: AtlasVoiceEvent, callback: (...args: any[]) => void): void;
  off(event: AtlasVoiceEvent, callback: (...args: any[]) => void): void;

  getVoices(): SpeechSynthesisVoice[];
  getLanguages(): string[];

  setVoice(voiceName: string): void;
  setLang(langCode: string): void;
  setRate(rate: number): void;
  setPitch(pitch: number): void;
  setVolume(volume: number): void;
}

export default AtlasVoice;
export = AtlasVoice;
