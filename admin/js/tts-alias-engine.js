/**
 * TTS-319: standalone entry for pages that need pronunciation rules but load no
 * player (Pro's Bulk MP3 screen). Same AliasEngine class the players use, so
 * Bulk MP3 gets whole-word matching, number rules and the filters too.
 */
import AliasEngine from "./AliasEngine";

window.AtlasVoiceAliasEngine = AliasEngine;
