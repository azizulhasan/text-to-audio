/**
 * What is read › Where it appears.
 *
 * Which posts get a player: added automatically or not, to which content
 * types and post statuses, and which categories, tags and single posts are
 * skipped. A form with a Save footer: nothing is written until Save.
 *
 * It stores nothing new. The site saves each part in the field the classic
 * Settings screen uses (TTA\Content\Where), so both screens can be used on
 * the same site.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	CheckboxControl,
	FormTokenField,
	Notice,
	Spinner,
	ToggleControl,
} from '@wordpress/components';

import useSettingsForm from '../hooks/use-settings-form';
import { Pane, Scroll, Section } from '../shell/parts';
import SaveBar from '../shell/SaveBar';
import TokenChoice from '../shell/TokenChoice';

const ROUTE = 'tta/v1/where';

/** The most single posts the site accepts (TTA\Content\Where::SKIP_POSTS_MAX). */
export const SKIP_POSTS_MAX = 500;

/**
 * Whether a text is a post number.
 *
 * @param {string} text What was typed.
 * @return {boolean} True for a whole number above zero.
 */
export function isPostNumber( text ) {
	return /^[1-9]\d{0,9}$/.test( String( text ).trim() );
}

/**
 * The screen.
 *
 * @return {*} What is read › Where it appears.
 */
export default function ContentWhere() {
	const form = useSettingsForm(
		ROUTE,
		__(
			'Saved. Cached pages may show the old page until your cache clears.',
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
								'These settings could not be loaded: %s',
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
	const choices = ( name ) =>
		Array.isArray( values.choices?.[ name ] ) ? values.choices[ name ] : [];
	const postTypes = list( 'post_types' );
	const statuses = list( 'statuses' );
	const skipPosts = list( 'skip_posts' );
	const titles = Object.fromEntries(
		( Array.isArray( values.skipped_posts ) ? values.skipped_posts : [] )
			.filter( ( post ) => post.title )
			.map( ( post ) => [ post.id, post.title ] )
	);
	// The site refuses an empty list of content types or statuses.
	const complete = postTypes.length > 0 && statuses.length > 0;

	const toggleType = ( id, on ) =>
		set(
			'post_types',
			choices( 'post_types' )
				.map( ( type ) => type.id )
				.filter( ( type ) =>
					type === id ? on : postTypes.includes( type )
				)
		);

	return (
		<Pane
			canvas
			footer={
				<SaveBar
					dirty={ form.dirty && complete }
					saving={ form.saving }
					onSave={ form.save }
				/>
			}
		>
			<Scroll width={ 860 }>
				<Section
					title={ __( 'Add the player to', 'text-to-audio' ) }
					description={ __(
						'The player is added to single posts of these content types.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __(
										'Add the player automatically',
										'text-to-audio'
									) }
									help={ __(
										'Off: the player appears only where you add the shortcode or the block.',
										'text-to-audio'
									) }
									checked={ !! values.automatic }
									onChange={ ( value ) =>
										set( 'automatic', value )
									}
								/>
								<fieldset className="atlasvoice-checks atlasvoice-checks-flush">
									<legend className="atlasvoice-legend">
										{ __(
											'Content types',
											'text-to-audio'
										) }
									</legend>
									{ choices( 'post_types' ).map( ( type ) => (
										<CheckboxControl
											key={ type.id }
											__nextHasNoMarginBottom
											id={
												'atlasvoice-where-type-' +
												type.id
											}
											label={ type.name }
											checked={ postTypes.includes(
												type.id
											) }
											onChange={ ( on ) =>
												toggleType( type.id, on )
											}
										/>
									) ) }
									{ ! postTypes.length && (
										<p className="atlasvoice-weak atlasvoice-checks-help">
											{ __(
												'Choose at least one content type.',
												'text-to-audio'
											) }
										</p>
									) }
								</fieldset>
								<TokenChoice
									label={ __(
										'Post statuses',
										'text-to-audio'
									) }
									help={
										statuses.length
											? __(
													'Posts in another status get no player.',
													'text-to-audio'
											  )
											: __(
													'Choose at least one status.',
													'text-to-audio'
											  )
									}
									value={ statuses }
									choices={ choices( 'statuses' ) }
									onChange={ ( value ) =>
										set( 'statuses', value )
									}
								/>
							</div>
						</CardBody>
					</Card>
				</Section>

				<Section
					title={ __( 'Skip some posts', 'text-to-audio' ) }
					description={ __(
						'The player is not added to these, also not by a shortcode or a block.',
						'text-to-audio'
					) }
				>
					<Card>
						<CardBody>
							<div className="atlasvoice-form">
								<TokenChoice
									label={ __(
										'Categories',
										'text-to-audio'
									) }
									help={ __(
										'Type a name and choose it from the list.',
										'text-to-audio'
									) }
									value={ list( 'skip_categories' ) }
									choices={ choices( 'categories' ) }
									onChange={ ( value ) =>
										set( 'skip_categories', value )
									}
								/>
								<TokenChoice
									label={ __( 'Tags', 'text-to-audio' ) }
									value={ list( 'skip_tags' ) }
									choices={ choices( 'tags' ) }
									onChange={ ( value ) =>
										set( 'skip_tags', value )
									}
								/>
								<FormTokenField
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									__experimentalShowHowTo={ false }
									label={ __(
										'Single posts, by number',
										'text-to-audio'
									) }
									help={ __(
										'Type the number (ID) of a post and press Enter. The number is in the address of the post’s edit screen: post=128.',
										'text-to-audio'
									) }
									value={ skipPosts.map( String ) }
									maxLength={ SKIP_POSTS_MAX }
									__experimentalValidateInput={ isPostNumber }
									onChange={ ( tokens ) =>
										set( 'skip_posts', [
											...new Set(
												tokens
													.map( ( token ) =>
														parseInt(
															typeof token ===
																'string'
																? token
																: token.value,
															10
														)
													)
													.filter( ( id ) => id > 0 )
											),
										] )
									}
								/>
								{ skipPosts.some( ( id ) => titles[ id ] ) && (
									<ul className="atlasvoice-list atlasvoice-skipped">
										{ skipPosts
											.filter( ( id ) => titles[ id ] )
											.map( ( id ) => (
												<li key={ id }>
													{ sprintf(
														/* translators: 1: post number, 2: post title. */
														__(
															'%1$d: %2$s',
															'text-to-audio'
														),
														id,
														titles[ id ]
													) }
												</li>
											) ) }
									</ul>
								) }
							</div>
						</CardBody>
					</Card>
				</Section>
			</Scroll>
		</Pane>
	);
}
