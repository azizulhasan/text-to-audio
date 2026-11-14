/**
 * What is read › Page areas.
 *
 * Which part of a page is read aloud: the CSS selector of the article text
 * and what is skipped inside it, for the whole site. A form with a Save
 * footer. "Pick it on a page" opens the on-page picker that already
 * exists, on a real post.
 *
 * It stores nothing new. The site saves the rule in the fields the picker
 * and the classic screen use (TTA\Content\Areas). Rules for one content
 * type are set with the picker and listed here.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Card,
	CardBody,
	Notice,
	Spinner,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

import { request } from '../api';
import { useApp } from '../app-context';
import useSettingsForm from '../hooks/use-settings-form';
import { Pane, ProNote, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import TokenField from '../shell/TokenField';

const ROUTE = 'tta/v1/areas';
const PICKER_ROUTE = 'tta/v1/step-rail/sample-url?scope=global';

/** Element types people skip most. Any element name can be typed. */
const COMMON_TAGS = [
	'figure',
	'figcaption',
	'aside',
	'blockquote',
	'table',
	'pre',
	'code',
	'nav',
	'form',
	'header',
	'footer',
];

/**
 * Whether a text can be a CSS selector for the site (the same check as
 * TTA\Content\Areas): no markup, no rule block, one line.
 *
 * @param {string} text What was typed.
 * @return {boolean} True when the site accepts it.
 */
export function isSelector( text ) {
	const selector = String( text ).trim();

	return (
		selector !== '' &&
		selector.length <= 2048 &&
		! /[<{}\r\n|]/.test( selector )
	);
}

/**
 * Whether a text is the name of an element type.
 *
 * @param {string} text What was typed.
 * @return {boolean} True for names such as figure or h2.
 */
export function isTag( text ) {
	return /^[a-z][a-z0-9]{0,31}$/i.test( String( text ).trim() );
}

/**
 * The texts of the tokens of a token field.
 *
 * @param {Array} tokens Strings, or objects with a value.
 * @return {string[]} The texts, each once.
 */
function texts( tokens ) {
	return [
		...new Set(
			tokens
				.map( ( token ) =>
					( typeof token === 'string' ? token : token.value ).trim()
				)
				.filter( Boolean )
		),
	];
}

/**
 * The screen.
 *
 * @return {*} What is read › Page areas.
 */
export default function ContentAreas() {
	const { boot, go, notify } = useApp();
	const [ opening, setOpening ] = useState( false );
	const form = useSettingsForm(
		ROUTE,
		__(
			'Saved. Posts with a stored audio file keep their old audio until it is made again.',
			'text-to-audio'
		)
	);
	const { values, set } = form;

	if ( form.failure ) {
		return (
			<Pane canvas>
				<Scroll width={ 700 }>
					<Notice
						status="error"
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Try again', 'text-to-audio' ),
								onClick: form.reload,
							},
						] }
					>
						{ sprintf(
							/* translators: %s: error message from the site. */
							__(
								'The page areas could not be loaded: %s',
								'text-to-audio'
							),
							form.failure
						) }
					</Notice>
				</Scroll>
			</Pane>
		);
	}

	if ( form.loading ) {
		return (
			<Pane canvas>
				<div className="atlasvoice-loading" role="status">
					<Spinner />
					{ __( 'Loading…', 'text-to-audio' ) }
				</div>
			</Pane>
		);
	}

	const list = ( name ) =>
		Array.isArray( values[ name ] ) ? values[ name ] : [];
	const types = list( 'types' );
	const selector = typeof values.selector === 'string' ? values.selector : '';
	// An empty selector is fine: the player then finds the text itself.
	const selectorOk = selector.trim() === '' || isSelector( selector );

	const openPicker = async () => {
		setOpening( true );
		try {
			const sample = await request( boot, PICKER_ROUTE );
			if ( sample && sample.url ) {
				window.open( sample.url, '_blank', 'noopener' );
			} else {
				notify(
					( sample && sample.reason ) ||
						__(
							'There is no published post to open the picker on.',
							'text-to-audio'
						),
					'error'
				);
			}
		} catch ( error ) {
			notify(
				sprintf(
					/* translators: %s: error message from the site. */
					__( 'The picker could not be opened: %s', 'text-to-audio' ),
					error.message
				),
				'error'
			);
		}
		setOpening( false );
	};

	return (
		<Pane
			canvas
			footer={
				<SaveBar
					dirty={ form.dirty && selectorOk }
					saving={ form.saving }
					onSave={ form.save }
				/>
			}
		>
			<Scroll width={ 860 }>
				<Section
					title={ __(
						'Read this part of the page',
						'text-to-audio'
					) }
					description={ __(
						'The rule for the whole site. Most sites need none: the player finds the article text itself.',
						'text-to-audio'
					) }
					end={
						<Button
							variant="secondary"
							onClick={ openPicker }
							isBusy={ opening }
							disabled={ opening }
							__next40pxDefaultSize
						>
							{ __( 'Pick it on a page', 'text-to-audio' ) }
						</Button>
					}
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								<TextControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									label={ __(
										'CSS selector of the article text',
										'text-to-audio'
									) }
									help={
										selectorOk
											? __(
													'For example .entry-content. Leave it empty to let the player find the text. “Pick it on a page” opens your newest post, where you click the text and the selector is filled in for you.',
													'text-to-audio'
											  )
											: __(
													'This is not a CSS selector. Use one line, without < { } or |.',
													'text-to-audio'
											  )
									}
									value={ selector }
									maxLength={ 2048 }
									onChange={ ( value ) =>
										set( 'selector', value )
									}
								/>
							</div>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __( 'Skip parts of it', 'text-to-audio' ) }
					description={ __(
						'Things inside the text that should not be read: share bars, captions, “Read more”.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								<TokenField
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									__experimentalShowHowTo={ false }
									label={ __(
										'Areas (CSS selectors)',
										'text-to-audio'
									) }
									help={ __(
										'Type a selector such as .share-bar and press Enter.',
										'text-to-audio'
									) }
									value={ list( 'skip_areas' ) }
									__experimentalValidateInput={ isSelector }
									onChange={ ( tokens ) =>
										set( 'skip_areas', texts( tokens ) )
									}
								/>
								<TokenField
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									__experimentalExpandOnFocus
									__experimentalShowHowTo={ false }
									label={ __(
										'Element types',
										'text-to-audio'
									) }
									help={ __(
										'Every element of this type is skipped, for example figure or table.',
										'text-to-audio'
									) }
									value={ list( 'skip_tags' ) }
									suggestions={ COMMON_TAGS }
									__experimentalValidateInput={ isTag }
									onChange={ ( tokens ) =>
										set(
											'skip_tags',
											texts( tokens ).map( ( tag ) =>
												tag.toLowerCase()
											)
										)
									}
								/>
								<TextareaControl
									__nextHasNoMarginBottom
									label={ __(
										'Phrases, one per line',
										'text-to-audio'
									) }
									help={ __(
										'An exact text that is never read, for example Share this. A phrase can hold commas.',
										'text-to-audio'
									) }
									rows={ 3 }
									value={ list( 'skip_phrases' ).join(
										'\n'
									) }
									onChange={ ( value ) =>
										// Kept as typed while typing; the site trims each line and drops empty ones.
										set(
											'skip_phrases',
											value === ''
												? []
												: value.split( '\n' )
										)
									}
								/>
							</div>
						</CardBody>
					</Card>
				</Section>

				{ types.length > 0 && (
					<Section
						title={ __(
							'Rules for one content type',
							'text-to-audio'
						) }
						description={
							values.types_applied
								? __(
										'These replace the whole-site rule for their content type. Change one with “Pick it on a page”, on a post of that type.',
										'text-to-audio'
								  )
								: __(
										'These are stored but not applied on this site: every content type uses the whole-site rule.',
										'text-to-audio'
								  )
						}
					>
						<Card>
							<div className="atlasvoice-table-wrap">
								<table className="atlasvoice-table">
									<thead>
										<tr>
											<th scope="col">
												{ __(
													'Applies to',
													'text-to-audio'
												) }
											</th>
											<th scope="col">
												{ __(
													'Reads',
													'text-to-audio'
												) }
											</th>
											<th scope="col">
												{ __(
													'Skips',
													'text-to-audio'
												) }
											</th>
										</tr>
									</thead>
									<tbody>
										{ types.map( ( type ) => (
											<tr key={ type.post_type }>
												<th scope="row">
													{ type.name }
												</th>
												<td className="atlasvoice-mono">
													{ type.selector ||
														__(
															'The whole-site rule',
															'text-to-audio'
														) }
												</td>
												<td>
													{ [
														...( type.skip_areas ||
															[] ),
														...( type.skip_tags ||
															[] ),
														...( type.skip_phrases ||
															[] ),
													].join( ', ' ) ||
														__(
															'Nothing',
															'text-to-audio'
														) }
												</td>
											</tr>
										) ) }
									</tbody>
								</table>
							</div>
						</Card>
					</Section>
				) }

				{ ! values.types_applied && (
					<ProNote onSeePro={ () => go( 'account:plans' ) }>
						{ __(
							'A rule of its own for one content type or one post is part of AtlasVoice Pro.',
							'text-to-audio'
						) }
					</ProNote>
				) }
			</Scroll>
		</Pane>
	);
}
