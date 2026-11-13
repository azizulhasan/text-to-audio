/**
 * Small layout parts that WordPress has no component for.
 * Everything interactive still comes from @wordpress/components.
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Icon } from '@wordpress/icons';

import { ICONS } from './icons';

/**
 * An icon from the shell's set.
 *
 * @param {Object} props
 * @param {string} props.name Key of ICONS.
 * @param {number} props.size Pixel size.
 * @return {*} The icon.
 */
export function AppIcon( { name, size = 24 } ) {
	return <Icon icon={ ICONS[ name ] } size={ size } />;
}

/**
 * A status word on a tinted ground. Status is never shown by colour alone:
 * the children are the word ("Live", "Staging", "Ready").
 *
 * @param {Object}  props
 * @param {string}  props.tone     ok | warn | err | info | brand | new.
 * @param {boolean} props.dot      Show a dot before the word.
 * @param {*}       props.children The word.
 * @return {*} The chip.
 */
export function Chip( { tone, dot, children } ) {
	return (
		<span className={ 'atlasvoice-chip' + ( tone ? ' is-' + tone : '' ) }>
			{ dot && <span className="atlasvoice-dot" aria-hidden="true" /> }
			{ children }
		</span>
	);
}

/**
 * The Pro badge. "PRO" is a product name and is not translated.
 *
 * @return {*} The badge.
 */
export function ProBadge() {
	return <span className="atlasvoice-pro">PRO</span>;
}

/**
 * A small number pill.
 *
 * @param {Object}  props
 * @param {boolean} props.brand    Use the brand colour.
 * @param {*}       props.children The number.
 * @return {*} The pill.
 */
export function Count( { brand, children } ) {
	return (
		<span className={ 'atlasvoice-count' + ( brand ? ' is-brand' : '' ) }>
			{ children }
		</span>
	);
}

/**
 * The main pane of a screen.
 *
 * @param {Object}  props
 * @param {boolean} props.canvas   Grey ground, for screens made of cards.
 * @param {*}       props.footer   Sticky footer, usually a SaveBar.
 * @param {*}       props.children The pane's content.
 * @return {*} The pane.
 */
export function Pane( { canvas, footer, children } ) {
	return (
		<section
			className={ 'atlasvoice-main' + ( canvas ? ' is-canvas' : '' ) }
		>
			{ children }
			{ footer }
		</section>
	);
}

/**
 * The part of a pane that scrolls. The page itself never scrolls.
 *
 * @param {Object} props
 * @param {number} props.width    Max width of the content in pixels.
 * @param {*}      props.children Content.
 * @return {*} The scroll area.
 */
export function Scroll( { width, children } ) {
	return (
		<div className="atlasvoice-scroll">
			<div
				className="atlasvoice-pad"
				style={ width ? { maxWidth: width } : undefined }
			>
				{ children }
			</div>
		</div>
	);
}

/**
 * One sentence and one action for an empty list or an unfinished screen.
 *
 * @param {Object} props
 * @param {string} props.title    Short heading.
 * @param {*}      props.children The sentence.
 * @param {*}      props.action   A button.
 * @return {*} The empty state.
 */
export function Empty( { title, children, action } ) {
	return (
		<div className="atlasvoice-empty">
			<b>{ title }</b>
			<p>{ children }</p>
			{ action && (
				<div className="atlasvoice-empty-action">{ action }</div>
			) }
		</div>
	);
}

/**
 * A titled block of a screen: heading, one line of explanation, content.
 *
 * @param {Object} props
 * @param {string} props.title       Section heading.
 * @param {string} props.description One line under the heading.
 * @param {*}      props.end         Actions at the end of the heading row.
 * @param {*}      props.children    Content.
 * @return {*} The section.
 */
export function Section( { title, description, end, children } ) {
	return (
		<section className="atlasvoice-section">
			<div className="atlasvoice-section-head">
				<div>
					<h2>{ title }</h2>
					{ description && <p>{ description }</p> }
				</div>
				{ end && <div className="atlasvoice-section-end">{ end }</div> }
			</div>
			{ children }
		</section>
	);
}

/**
 * The one way a Pro feature appears inside a free screen: a dashed line that
 * says what Pro adds, with a link to the Plans tab. It is text and a link,
 * never a form and never a disabled control (wp.org guideline 5), and a
 * screen shows at most one.
 *
 * @param {Object}   props
 * @param {*}        props.children What Pro adds, in one sentence.
 * @param {Function} props.onSeePro Opens the Plans tab.
 * @return {*} The note.
 */
export function ProNote( { children, onSeePro } ) {
	return (
		<div className="atlasvoice-pronote">
			<ProBadge />
			<span>{ children }</span>
			<Button variant="link" onClick={ onSeePro }>
				{ __( 'See Pro', 'text-to-audio' ) }
			</Button>
		</div>
	);
}

/**
 * A list of name and value pairs.
 *
 * @param {Object} props
 * @param {Array}  props.rows [ name, value ] pairs; a pair without a value is left out.
 * @return {*} The list.
 */
export function Facts( { rows } ) {
	return (
		<dl className="atlasvoice-facts">
			{ rows
				.filter( ( row ) => row[ 1 ] !== '' && row[ 1 ] !== null )
				.map( ( [ name, value ] ) => (
					<div key={ name } className="atlasvoice-fact">
						<dt>{ name }</dt>
						<dd>{ value }</dd>
					</div>
				) ) }
		</dl>
	);
}
