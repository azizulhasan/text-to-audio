/**
 * A choice between a few options that each need a line of explanation:
 * a group of real radio buttons, laid out as tiles.
 *
 * Radios, not buttons with a role, so the arrow keys, the form semantics
 * and the screen reader's "1 of 3" come from the browser.
 *
 * @param {Object}   props
 * @param {string}   props.name     Name of the radio group (unique on the screen).
 * @param {string}   props.legend   What is chosen, for screen readers.
 * @param {string}   props.value    Id of the chosen option.
 * @param {Array}    props.options  [ { id, title, text } ].
 * @param {Function} props.onChange Receives the id of the option that was chosen.
 * @return {*} The group.
 */
export default function Tiles( { name, legend, value, options, onChange } ) {
	return (
		<fieldset className="atlasvoice-tiles">
			<legend className="screen-reader-text">{ legend }</legend>
			{ options.map( ( option ) => {
				const id = name + '-' + option.id;

				return (
					<div
						key={ option.id }
						className={
							'atlasvoice-tile' +
							( option.id === value ? ' is-on' : '' )
						}
					>
						<input
							type="radio"
							id={ id }
							name={ name }
							checked={ option.id === value }
							aria-describedby={
								option.text ? id + '-text' : undefined
							}
							onChange={ () => onChange( option.id ) }
						/>
						<label htmlFor={ id }>
							<b>{ option.title }</b>
						</label>
						{ option.text && (
							<p
								id={ id + '-text' }
								className="atlasvoice-weak atlasvoice-tile-text"
							>
								{ option.text }
							</p>
						) }
					</div>
				);
			} ) }
		</fieldset>
	);
}
