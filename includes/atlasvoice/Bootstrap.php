<?php

namespace TTA\AtlasVoice;

/**
 * AtlasVoice Bootstrap (TTS-238 v5 §14 hook-based isolation entry point).
 *
 * Single-line anchor into the AtlasVoice subsystem. text-to-audio.php
 * invokes `\TTA\AtlasVoice\Bootstrap::register()` once during the
 * plugin's `init` phase; everything downstream (cron, meta boxes,
 * REST routes, localise-data filters, regen-guard, self-healer, etc.)
 * is wired from here so no further edits to the legacy plugin
 * bootstrap are needed as D1–D14 lands.
 *
 * Design principles this class encodes:
 *   - P1 "zero existing-file edits except opt-in gates": every hook
 *     added here is an additive `add_action`/`add_filter`. The legacy
 *     extraction pipeline is never monkey-patched from this file.
 *   - P2 "hook-based integration": every cross-cutting concern is
 *     registered through WordPress action/filter APIs, never via
 *     direct calls into TTA_ legacy classes.
 *   - P4 "isolated directory + namespace": all AtlasVoice code loads
 *     through PSR-4 from `includes/atlasvoice/`; deleting this
 *     directory removes the whole subsystem cleanly.
 *   - P5 "three orthogonal layers": the `register()` body is safe to
 *     call regardless of Layer 1 opt-in state. Individual feature
 *     modules (e.g. RegenGuard) self-gate on opt-in + mode so the
 *     whole chain is a no-op when the admin hasn't opted in.
 *
 * Idempotent: multiple calls to `register()` only register hooks the
 * first time — guarded by a static flag.
 */
class Bootstrap {

	/**
	 * Guard against double-registration. WordPress calls `init` once per
	 * request so this is belt-and-braces, but harmless.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Top-level entry. Call once from `text-to-audio.php` inside the
	 * `init` (priority 9999) callback where the legacy bootstrap already
	 * lives. Class-exists guards defend against the free plugin being
	 * loaded before composer autoload has mapped TTA\AtlasVoice\* — in
	 * practice the PSR-4 mapping lands first, but we keep the guards
	 * so a broken autoload doesn't whitescreen the site.
	 */
	public static function register() {
		if ( self::$registered ) { return; }
		self::$registered = true;

		// C3a — nightly boilerplate detector cron. Registration is
		// idempotent and safe to call on every `init`. The cron itself
		// only fires once per 24h via WP-Cron's scheduling table.
		if ( class_exists( '\\TTA\\AtlasVoice\\BoilerplateDetector' ) ) {
			BoilerplateDetector::register_cron();
		}

		// C6b — post-edit meta box row for auth-variant pinning. Wires
		// into `tts_after_metabox_content` (already emitted by the
		// legacy TTA_Hooks::atlasVoice_meta_box renderer) so no edit to
		// the legacy meta-box class is required.
		if ( class_exists( '\\TTA\\AtlasVoice\\AuthVariantsMetaBox' ) ) {
			AuthVariantsMetaBox::register();
		}

		// REST routes live in a dedicated registrar (D0b). Hooks on
		// `rest_api_init`, so it's safe to register here during the
		// plugin's `init` phase.
		if ( class_exists( '\\TTA\\AtlasVoice\\RestRoutes' ) ) {
			RestRoutes::register();
		}

		// Localise-data filter wiring (D0d). Admin pages emit a
		// `atlasvoice_localize_data` filter when they build the
		// localisation payload; we attach the AtlasVoice-specific
		// fields here so `admin/TTA_Admin.php` stays byte-identical
		// except for one `apply_filters` call.
		if ( class_exists( '\\TTA\\AtlasVoice\\LocalizeData' ) ) {
			LocalizeData::register();
		}

		// D1 — regen-guard on template_redirect priority 5. Self-gates
		// on Layer 1 opt-in + Layer 2 mode, so it's safe to register
		// unconditionally. In staging mode it's a true no-op; in
		// production mode it short-circuits on the lock / dirty-flag
		// before doing any work.
		if ( class_exists( '\\TTA\\AtlasVoice\\RegenGuard' ) ) {
			RegenGuard::register();
		}

		// D3 — selector-hash tagger. Listens for the Pro synthesis
		// completion action (`atlasvoice_mp3_generated`) and for
		// RegenGuard's SKIP branch (`atlasvoice_regen_skip`) to stamp
		// the MP3's rule fingerprint onto `_atlasvoice_selector_hash`
		// post meta. Dormant on Free because the synthesis hook never
		// fires there — safe to register unconditionally.
		if ( class_exists( '\\TTA\\AtlasVoice\\SelectorHash' ) ) {
			SelectorHash::register();
		}

		// D4 — admin-bar mode indicator. Shows a coloured dot (grey /
		// yellow / green) on the toolbar so admins can tell at a glance
		// whether the new extractor is off, staging, or driving visitor
		// output. No-op for users without `manage_options`.
		if ( class_exists( '\\TTA\\AtlasVoice\\Mode' ) ) {
			Mode::register();
		}

		// D6 — rule-snapshot ring buffer. Wires into the generic
		// `atlasvoice_rules_changed` action and exposes a 5-deep
		// history per scope so the Rules table [History ▾] dropdown
		// (and any future timeline UI) can walk prior payloads without
		// consulting an external store.
		if ( class_exists( '\\TTA\\AtlasVoice\\Snapshots' ) ) {
			Snapshots::register();
		}

		// D7 — per-post rule override (Pro). Storage layer registers
		// the dirty-flag bridge; the meta-box registers the render +
		// save callbacks. RuleResolver is pure-read — no register()
		// because it has no hooks to attach.
		if ( class_exists( '\\TTA\\AtlasVoice\\PerPostRules' ) ) {
			PerPostRules::register();
		}
		if ( class_exists( '\\TTA\\AtlasVoice\\PerPostRulesMetaBox' ) ) {
			PerPostRulesMetaBox::register();
		}

		// D8 — lazy picker bundle loader. Registers the picker with
		// WP_Scripts but doesn't enqueue it; emits an inline
		// `ttsLoadPicker()` stub that injects the bundle on demand.
		// Self-scopes (admin post screens + dashboard, front-end
		// singular views only) so visitors don't pay the 30 KB
		// picker payload on every request.
		if ( class_exists( '\\TTA\\AtlasVoice\\PickerLoader' ) ) {
			PickerLoader::register();
		}

		// D9 — step-rail shell + iframe sandbox. Admin side renders the
		// hidden overlay + `window.AtlasVoiceStepRail.open()` API.
		// Front-end detects `?atlasvoice_iframe=1` (gated on
		// manage_options + REST nonce) and flips singular views into
		// pick-mode with a postMessage bridge back to the parent rail.
		if ( class_exists( '\\TTA\\AtlasVoice\\StepRail' ) ) {
			StepRail::register();
		}

		// Future D10–D14 registrations slot in below. Every new feature
		// module exposes a `register()` static so the sequence stays
		// readable and feature toggles are obvious.
		//
		//   SelfHealer::register();        // heal-on-miss
		//   RuleChipEditor::register();    // D10 — rule-chip editor
	}
}
