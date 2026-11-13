/**
 * Voice › Languages.
 *
 * Says which language the posts are read in, which translation plugins the
 * site runs, and what that means for the audio. In the free plugin every
 * post is read with the one voice chosen on the Voice tab; reading each
 * post in its own language is what Pro adds, so Free shows one line about
 * it and Pro puts its "voice for each language" table into the slot.
 *
 * The screen only reads (GET tta/v1/languages); it changes nothing.
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, CardBody, Notice, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import Slot, { getSlotFills } from '../extend/Slot';
import { classicHashFor } from '../routes';
import { Chip, Pane, ProNote, Scroll, Section } from '../shell/parts';

const ROUTE = 'tta/v1/languages';

/**
 * The names of a list of languages, as one line.
 *
 * @param {Array} languages [ { code, name } ].
 * @return {string} e.g. "English, Español".
 */
export function languageNames( languages ) {
	return ( Array.isArray( languages ) ? languages : [] )
		.map( ( language ) => language?.name || language?.code || '' )
		.filter( Boolean )
		.join( ', ' );
}

/**
 * The languages translated pages exist in, without the site language.
 *
 * @param {Array}  plugins      The translation plugins of the site.
 * @param {string} siteLanguage The language the posts are read in.
 * @return {Array} [ { code, name } ], each once.
 */
export function otherLanguages( plugins, siteLanguage ) {
	const base = String( siteLanguage || '' )
		.toLowerCase()
		.split( '-' )[ 0 ];
	const seen = new Set();
	const others = [];

	for ( const plugin of Array.isArray( plugins ) ? plugins : [] ) {
		if ( plugin?.kind !== 'pages' ) {
			continue;
		}
		for ( const language of plugin.languages || [] ) {
			const code = String( language?.code || '' ).toLowerCase();
			if (
				code &&
				code.split( '-' )[ 0 ] !== base &&
				! seen.has( code )
			) {
				seen.add( code );
				others.push( language );
			}
		}
	}

	return others;
}

/**
 * The screen.
 *
 * @return {*} Voice › Languages.
 */
export default function VoiceLanguages() {
	const { boot, go, isPro } = useApp();
	const [ data, setData ] = useState( null );
	const [ failure, setFailure ] = useState( '' );

	const load = useCallback( async () => {
		setFailure( '' );
		try {
			setData( await request( boot, ROUTE ) );
		} catch ( error ) {
			setFailure( error.message );
		}
	}, [ boot ] );

	useEffect( () => {
		load();
	}, [ load ] );

	if ( ! data && ! failure ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	if ( ! data ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
					<Notice
						status="error"
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Try again', 'text-to-audio' ),
								onClick: load,
							},
						] }
					>
						{ sprintf(
							/* translators: %s: error message from the site. */
							__(
								'The languages could not be loaded: %s',
								'text-to-audio'
							),
							failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	const plugins = Array.isArray( data.plugins ) ? data.plugins : [];
	const pagePlugins = plugins.filter( ( plugin ) => plugin.kind === 'pages' );
	const browserPlugins = plugins.filter(
		( plugin ) => plugin.kind === 'browser'
	);
	const others = otherLanguages( plugins, data.site_language );
	const siteName = data.site_language_name || data.site_language;
	const proHasTable = getSlotFills( 'voice.languages' ).length > 0;

	return (
		<Pane canvas>
			<Scroll width={ 960 }>
				<div className="atlasvoice-section">
					<Notice status="info" isDismissible={ false }>
						{ plugins.length
							? sprintf(
									/* translators: %s: names of translation plugins, e.g. "Polylang, GTranslate". */
									__(
										'Translation plugins found on this site: %s.',
										'text-to-audio'
									),
									plugins
										.map( ( plugin ) => plugin.name )
										.join( ', ' )
							  )
							: __(
									'No translation plugin was found on this site, so it has one language.',
									'text-to-audio'
							  ) }
					</Notice>
				</div>

				{ /* Pro's "a voice for each language" table. */ }
				<Slot name="voice.languages" fillProps={ { data } } />

				{ ! proHasTable && (
					<div className="atlasvoice-section">
						<Card>
							<CardBody>
								<p className="atlasvoice-lang-lead">
									<b>
										{ sprintf(
											/* translators: %s: a language, e.g. "English (United Kingdom)". */
											__(
												'Every post is read in %s.',
												'text-to-audio'
											),
											siteName
										) }
									</b>{ ' ' }
									{ __(
										'This is the language chosen on the Voice tab.',
										'text-to-audio'
									) }
								</p>
								{ others.length > 0 && (
									<p className="atlasvoice-weak atlasvoice-lang-others">
										{ sprintf(
											/* translators: 1: languages, e.g. "Español, Français", 2: the site language. */
											__(
												'Posts in %1$s are read with the %2$s voice.',
												'text-to-audio'
											),
											languageNames( others ),
											siteName
										) }
									</p>
								) }
								<div className="atlasvoice-actions">
									<Button
										variant="secondary"
										onClick={ () => go( 'voice' ) }
										__next40pxDefaultSize
									>
										{ __(
											'Change the language',
											'text-to-audio'
										) }
									</Button>
									{ isPro && (
										<Button
											variant="secondary"
											href={
												boot.classicUrl +
												classicHashFor(
													'voice:languages'
												)
											}
											__next40pxDefaultSize
										>
											{ __(
												'Set a voice per language on the classic screen',
												'text-to-audio'
											) }
										</Button>
									) }
								</div>
								{ ! isPro && pagePlugins.length > 0 && (
									<div className="atlasvoice-pronote-wrap">
										<ProNote
											onSeePro={ () =>
												go( 'account:plans' )
											}
										>
											{ __(
												'Read each post in its own language, with a voice per language.',
												'text-to-audio'
											) }
										</ProNote>
									</div>
								) }
							</CardBody>
						</Card>
					</div>
				) }

				{ pagePlugins.map( ( plugin ) => (
					<Section
						key={ plugin.id }
						title={ plugin.name }
						description={ __(
							'Found on this site. Each translation is its own page.',
							'text-to-audio'
						) }
					>
						<Card>
							<CardBody>
								<p className="atlasvoice-lang-list">
									{ languageNames( plugin.languages ) ||
										__(
											'No languages are set up in it yet.',
											'text-to-audio'
										) }
								</p>
							</CardBody>
						</Card>
					</Section>
				) ) }

				{ browserPlugins.map( ( plugin ) => (
					<Section
						key={ plugin.id }
						title={ plugin.name }
						description={ __(
							'Found on this site. It translates pages in the visitor’s browser.',
							'text-to-audio'
						) }
					>
						<Card>
							<ul className="atlasvoice-rows">
								<li className="atlasvoice-row">
									<span className="atlasvoice-row-text">
										<b>
											{ __(
												'Browser voice',
												'text-to-audio'
											) }
										</b>
										<span className="atlasvoice-weak">
											{ __(
												'Reads the page as the visitor sees it, so it can follow the language the visitor picks.',
												'text-to-audio'
											) }
										</span>
									</span>
									<Chip tone="ok" dot>
										{ __( 'Follows', 'text-to-audio' ) }
									</Chip>
								</li>
								<li className="atlasvoice-row">
									<span className="atlasvoice-row-text">
										<b>
											{ __(
												'Voices saved as MP3',
												'text-to-audio'
											) }
										</b>
										<span className="atlasvoice-weak">
											{ __(
												'Are read in your site language, because the translated text exists only in the visitor’s browser.',
												'text-to-audio'
											) }
										</span>
									</span>
									<Chip tone="warn" dot>
										{ __(
											'Site language only',
											'text-to-audio'
										) }
									</Chip>
								</li>
							</ul>
						</Card>
					</Section>
				) ) }
			</Scroll>
		</Pane>
	);
}
