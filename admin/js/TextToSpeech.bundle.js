/**
 * Entry of the TextToSpeech bundle (players 2-7).
 *
 * TTS-321: adds the progressive-play base for MP3 players to TextToSpeech, so
 * Pro's player extends it from here (this bundle loads before Pro's), like it
 * calls TextToSpeech.replaceAliases(). Kept out of TextToSpeech.js itself so
 * player 1's bundle, which also imports that class, does not carry it.
 */
import TextToSpeech from './TextToSpeech';
import AtlasVoiceProgressivePlayer from './tts/AtlasVoiceProgressivePlayer';

TextToSpeech.ProgressivePlayer = AtlasVoiceProgressivePlayer;
