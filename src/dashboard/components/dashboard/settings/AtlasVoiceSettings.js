/**
 * AtlasVoice Settings (TTS-238 D27.2 — extractor toggle retired).
 *
 * Renders the always-on AtlasVoice admin surfaces — the heal log and
 * boilerplate detector. The "Use AtlasVoice Extractor (Beta)" toggle
 * was removed in v5: the picker now writes to the same legacy keys
 * the extractor already consumes, so the opt-in flag served no
 * purpose. Visual content picker launchers moved to the per-scope
 * accordion in Settings.js.
 */
import React from "react";
import AtlasVoiceHealLog from "./AtlasVoiceHealLog";
import AtlasVoiceBoilerplate from "./AtlasVoiceBoilerplate";

export default function AtlasVoiceSettings() {
    return (
        <>
            <AtlasVoiceHealLog />
            <AtlasVoiceBoilerplate />
        </>
    );
}
