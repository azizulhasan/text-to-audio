/**
 * What can be chosen on the Voice screen, and the small rules that keep a
 * choice valid: an engine never keeps a language or a voice it cannot speak.
 * Kept apart from the screen so each rule can be tested on its own.
 */
import { useEffect, useState } from '@wordpress/element';

// One list of the natural voice's languages for the whole plugin: the classic
// Listening screen reads the same file.
import {
	GTTS_LANGUAGES,
	pickAtlasVoiceLanguage,
} from '../../../dashboard/components/dashboard/listening/gttsLanguages';

/** The browser voice: the one engine that needs no account. */
export const BROWSER_PLAYER = 1;

/**
 * The voices this browser offers, as plain objects.
 *
 * @param {Object} synth window.speechSynthesis, or nothing.
 * @return {Array} [ { name, lang } ], without doubles.
 */
export function readBrowserVoices( synth ) {
	if ( ! synth || typeof synth.getVoices !== 'function' ) {
		return [];
	}

	const seen = new Set();
	const voices = [];
	for ( const voice of synth.getVoices() || [] ) {
		const name = String( voice?.name || '' );
		const lang = String( voice?.lang || '' );
		if ( name && lang && ! seen.has( name + '|' + lang ) ) {
			seen.add( name + '|' + lang );
			voices.push( { name, lang } );
		}
	}

	return voices;
}

/**
 * The browser's voices. Browsers load them late, so the list can arrive
 * after the screen is shown.
 *
 * @return {Array} [ { name, lang } ].
 */
export function useBrowserVoices() {
	const [ voices, setVoices ] = useState( () =>
		readBrowserVoices( window.speechSynthesis )
	);

	useEffect( () => {
		const synth = window.speechSynthesis;
		if ( ! synth || typeof synth.addEventListener !== 'function' ) {
			return undefined;
		}

		const refresh = () => setVoices( readBrowserVoices( synth ) );
		synth.addEventListener( 'voiceschanged', refresh );
		refresh();

		return () => synth.removeEventListener( 'voiceschanged', refresh );
	}, [] );

	return voices;
}

/**
 * The languages of a list of voices, sorted, each once.
 *
 * @param {Array} voices [ { name, lang } ].
 * @return {string[]} Language codes.
 */
export function languagesOf( voices ) {
	return Array.from( new Set( voices.map( ( voice ) => voice.lang ) ) ).sort(
		( a, b ) => a.localeCompare( b )
	);
}

/**
 * The browser language closest to a wanted one: the same code, then the
 * same language of another country, then the first one there is.
 *
 * @param {string}   wanted    e.g. "en", "en-GB", "pt_BR".
 * @param {string[]} available Language codes of the browser.
 * @return {string} A code from `available`, or '' when there is none.
 */
export function closestLanguage( wanted, available ) {
	const want = String( wanted || '' )
		.toLowerCase()
		.replace( '_', '-' );
	const base = want.split( '-' )[ 0 ];

	return (
		available.find( ( code ) => code.toLowerCase() === want ) ||
		available.find(
			( code ) => base && code.toLowerCase().split( '-' )[ 0 ] === base
		) ||
		available[ 0 ] ||
		''
	);
}

/**
 * The languages the natural voice can speak.
 *
 * @return {Array} [ { value, label } ], sorted by name.
 */
export function naturalLanguages() {
	return Object.keys( GTTS_LANGUAGES )
		.map( ( code ) => ( { value: code, label: GTTS_LANGUAGES[ code ] } ) )
		.sort( ( a, b ) => a.label.localeCompare( b.label ) );
}

/**
 * Whether the natural voice speaks a language code.
 *
 * @param {string} code Language code.
 * @return {boolean} True when it is on the list.
 */
export function naturalSpeaks( code ) {
	return Object.prototype.hasOwnProperty.call( GTTS_LANGUAGES, code );
}

/**
 * What must change with the engine so the choice stays valid.
 *
 * @param {number} playerId The engine that was chosen.
 * @param {Object} current  { language, voice, site_language, natural_player_id }.
 * @param {Array}  voices   The browser's voices.
 * @return {Object} The fields to set beside player_id: language and, for the browser, voice.
 */
export function fieldsForEngine( playerId, current, voices ) {
	if ( playerId === current.natural_player_id ) {
		if ( naturalSpeaks( current.language ) ) {
			return {};
		}

		return {
			language: pickAtlasVoiceLanguage(
				current.language || current.site_language
			),
		};
	}

	if ( playerId === BROWSER_PLAYER ) {
		const stillThere = voices.some(
			( voice ) =>
				voice.lang === current.language && voice.name === current.voice
		);
		if ( stillThere || ! voices.length ) {
			return {};
		}

		const language = closestLanguage(
			current.language || current.site_language,
			languagesOf( voices )
		);
		const first = voices.find( ( voice ) => voice.lang === language );

		return { language, voice: first ? first.name : '' };
	}

	return {};
}

/**
 * The voice to use after the browser language changed: the chosen one when
 * it speaks that language, otherwise the first that does.
 *
 * @param {string} language The new language.
 * @param {string} voice    The voice chosen before.
 * @param {Array}  voices   The browser's voices.
 * @return {string} A voice name, or '' when no voice speaks the language.
 */
export function voiceForLanguage( language, voice, voices ) {
	const speaking = voices.filter( ( item ) => item.lang === language );

	if ( speaking.some( ( item ) => item.name === voice ) ) {
		return voice;
	}

	return speaking.length ? speaking[ 0 ].name : '';
}
