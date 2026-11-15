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
import AtlasVoiceEditorNote from './tts/AtlasVoiceEditorNote';
import AtlasVoiceBrowserFallback from './tts/AtlasVoiceBrowserFallback';

TextToSpeech.ProgressivePlayer = AtlasVoiceProgressivePlayer;
// TTS-347: the editors-only note under a player, for an extension's player too.
TextToSpeech.EditorNote = AtlasVoiceEditorNote;
// TTS-347: the device's voice behind a Listen button, when audio cannot be made.
TextToSpeech.BrowserFallback = AtlasVoiceBrowserFallback;
