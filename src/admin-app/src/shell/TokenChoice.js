/**
 * Chooses some items of a long list (categories, tags, statuses) by typing:
 * the field suggests the names, and the chosen ones show as tokens.
 *
 * The screen works with ids (slugs); people see names. An id that is stored
 * but no longer in the list (a deleted category) shows as its id and stays
 * until it is removed.
 *
 * @param {Object}   props
 * @param {string}   props.label    What is chosen.
 * @param {string}   props.help     A line under the field.
 * @param {string[]} props.value    The chosen ids.
 * @param {Array}    props.choices  [ { id, name } ] that can be chosen.
 * @param {Function} props.onChange Receives the new list of ids.
 * @return {*} The field.
 */
import { FormTokenField } from '@wordpress/components';

/**
 * What a choice is called in the field. Two choices with the same name
 * (two tags called "News") get their id added, so each can be told apart.
 *
 * @param {Array} choices [ { id, name } ].
 * @return {Object} { labelOf( id ), idOf( label ), labels }.
 */
export function choiceLabels( choices ) {
	const count = {};
	for ( const choice of choices ) {
		count[ choice.name ] = ( count[ choice.name ] || 0 ) + 1;
	}

	const byId = {};
	const byLabel = {};
	for ( const choice of choices ) {
		const label =
			count[ choice.name ] > 1 || ! choice.name
				? `${ choice.name } (${ choice.id })`.trim()
				: choice.name;
		byId[ choice.id ] = label;
		byLabel[ label.toLowerCase() ] = choice.id;
	}

	return {
		labelOf: ( id ) => byId[ id ] || id,
		idOf: ( label ) => {
			const key = String( label ).trim().toLowerCase();
			if ( byLabel[ key ] ) {
				return byLabel[ key ];
			}

			// Typed as an id ("podcasts") instead of a name ("Podcasts").
			return choices.some( ( choice ) => choice.id === key ) ? key : null;
		},
		labels: Object.values( byId ),
	};
}

export default function TokenChoice( {
	label,
	help,
	value,
	choices,
	onChange,
} ) {
	const { labelOf, idOf, labels } = choiceLabels( choices );

	return (
		<FormTokenField
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			__experimentalExpandOnFocus
			__experimentalShowHowTo={ false }
			label={ label }
			help={ help }
			value={ value.map( labelOf ) }
			suggestions={ labels }
			__experimentalValidateInput={ ( token ) =>
				idOf( token ) !== null || value.includes( token )
			}
			onChange={ ( tokens ) => {
				const ids = tokens.map( ( token ) => {
					const text =
						typeof token === 'string' ? token : token.value;

					// A stored id that is not in the list any more is its own label.
					return idOf( text ) ?? text;
				} );
				onChange( [ ...new Set( ids ) ] );
			} }
		/>
	);
}
