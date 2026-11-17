/**
 * What can be chosen on the Voice screen, and the small rules that keep a
 * choice valid: an engine never keeps a language or a voice it cannot speak.
 * Kept apart from the screen so each rule can be tested on its own.
 */
import { useEffect, useState } from '@wordpress/element';

import { request } from '../api';

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

/** The engine of the natural voice on AtlasVoice Cloud. */
export const NATURAL_ENGINE = 'gtts';

/** Where the site reads the voices AtlasVoice Cloud offers (TTA\Cloud\Voices). */
const CLOUD_VOICES = 'tta/v1/cloud/voices';

/**
 * The languages in a list of the service's voices: the natural voice has
 * one voice for each language.
 *
 * @param {Array} voices [ { id, engine, language, name } ] as the site returns them.
 * @return {Array} [ { value, label } ], sorted by name, each language once.
 */
export function languagesFromVoices( voices ) {
	const seen = new Set();
	const options = [];

	for ( const voice of Array.isArray( voices ) ? voices : [] ) {
		const value =
			typeof voice?.language === 'string' ? voice.language.trim() : '';
		if ( ! value || seen.has( value ) ) {
			continue;
		}
		seen.add( value );
		options.push( {
			value,
			label:
				typeof voice.name === 'string' && voice.name.trim()
					? voice.name.trim()
					: value,
		} );
	}

	return options.sort( ( a, b ) => a.label.localeCompare( b.label ) );
}

/**
 * The languages of the natural voice as AtlasVoice Cloud lists them now
 * (TTS-378): the service is the one that knows which voices exist.
 *
 * The site asks the service, and only for a site that is connected: a site
 * that never agreed to use AtlasVoice Cloud does not contact it by opening
 * a screen. Until the answer is there, and whenever the service cannot
 * give one, the list that ships with the plugin is used.
 *
 * @param {Object}  boot      The app's boot data.
 * @param {boolean} connected Whether the natural voice is connected.
 * @return {Array|null} [ { value, label } ], or null for "use the plugin's own list".
 */
export function useServiceLanguages( boot, connected ) {
	const [ options, setOptions ] = useState( null );

	useEffect( () => {
		if ( ! connected ) {
			setOptions( null );

			return undefined;
		}

		let current = true;
		request( boot, CLOUD_VOICES, { query: { engine: NATURAL_ENGINE } } )
			.then( ( list ) => {
				const found =
					list?.source === 'service'
						? languagesFromVoices( list.voices )
						: [];
				if ( current ) {
					setOptions( found.length ? found : null );
				}
			} )
			.catch( () => {
				if ( current ) {
					setOptions( null );
				}
			} );

		return () => {
			current = false;
		};
	}, [ boot, connected ] );

	return options;
}

/**
 * The languages the natural voice can speak.
 *
 * @param {Array|null} fromService What the service lists, when it is known.
 * @return {Array} [ { value, label } ], sorted by name.
 */
export function naturalLanguages( fromService ) {
	if ( Array.isArray( fromService ) && fromService.length ) {
		return fromService;
	}

	return Object.keys( GTTS_LANGUAGES )
		.map( ( code ) => ( { value: code, label: GTTS_LANGUAGES[ code ] } ) )
		.sort( ( a, b ) => a.label.localeCompare( b.label ) );
}

/**
 * Whether the natural voice speaks a language code.
 *
 * @param {string}     code        Language code.
 * @param {Array|null} fromService What the service lists, when it is known.
 * @return {boolean} True when it is on the list.
 */
export function naturalSpeaks( code, fromService ) {
	if ( Array.isArray( fromService ) && fromService.length ) {
		return fromService.some( ( option ) => option.value === code );
	}

	return Object.prototype.hasOwnProperty.call( GTTS_LANGUAGES, code );
}

/**
 * The natural voice's language closest to a wanted one: the same code, the
 * language without its country, the same language of another country, then
 * English. The same order as the plugin's own list uses.
 *
 * @param {string}     wanted      e.g. "en-US", "pt_BR".
 * @param {Array|null} fromService What the service lists, when it is known.
 * @return {string} A language the natural voice speaks.
 */
export function pickNaturalLanguage( wanted, fromService ) {
	if ( ! Array.isArray( fromService ) || ! fromService.length ) {
		return pickAtlasVoiceLanguage( wanted );
	}

	const codes = fromService.map( ( option ) => option.value );
	const want = String( wanted || '' )
		.toLowerCase()
		.replace( '_', '-' );
	const base = want.split( '-' )[ 0 ];

	return (
		codes.find( ( code ) => code.toLowerCase() === want ) ||
		codes.find( ( code ) => code.toLowerCase() === base ) ||
		codes.find(
			( code ) => code.toLowerCase().split( '-' )[ 0 ] === base
		) ||
		codes.find( ( code ) => code.toLowerCase() === 'en' ) ||
		codes[ 0 ]
	);
}

/**
 * What must change with the engine so the choice stays valid.
 *
 * @param {number}     playerId    The engine that was chosen.
 * @param {Object}     current     { language, voice, site_language, natural_player_id }.
 * @param {Array}      voices      The browser's voices.
 * @param {Array|null} fromService The natural voice's languages as the service lists them, when known.
 * @return {Object} The fields to set beside player_id: language and, for the browser, voice.
 */
export function fieldsForEngine( playerId, current, voices, fromService ) {
	if ( playerId === current.natural_player_id ) {
		if ( naturalSpeaks( current.language, fromService ) ) {
			return {};
		}

		return {
			language: pickNaturalLanguage(
				current.language || current.site_language,
				fromService
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
