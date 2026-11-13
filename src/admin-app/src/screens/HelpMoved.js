import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Notice, SearchControl } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';

import { useApp } from '../app-context';
import { Empty, Pane, Scroll, Section } from '../shell/parts';
import { filterMovedItems, getMovedItems } from './moved';

/**
 * Help › Where things moved: for people who knew the classic screens.
 * Type an old name, see its new home, and open it.
 *
 * @return {*} The screen.
 */
export default function HelpMoved() {
	const { isPro, go } = useApp();
	const [ query, setQuery ] = useState( '' );
	const items = useMemo( () => getMovedItems(), [] );
	const rows = filterMovedItems( items, query, isPro );
	const tableName = __( 'Menu items', 'text-to-audio' );

	return (
		<Pane canvas>
			<Scroll width={ 900 }>
				<div className="atlasvoice-section">
					<Notice status="success" isDismissible={ false }>
						<b>
							{ __(
								'Nothing you saved has changed.',
								'text-to-audio'
							) }
						</b>{ ' ' }
						{ __(
							'Your voice, player colours, audio files and statistics are exactly as they were. Only the screens are new.',
							'text-to-audio'
						) }
					</Notice>
				</div>
				<div className="atlasvoice-section atlasvoice-moved-search">
					<SearchControl
						__nextHasNoMarginBottom
						label={ __( 'Find an old name', 'text-to-audio' ) }
						value={ query }
						onChange={ setQuery }
						placeholder={ __(
							'Type an old name, for example “Aliases”',
							'text-to-audio'
						) }
					/>
				</div>
				{ rows.length > 0 ? (
					<Section title={ tableName }>
						<Card>
							{ /* A table that scrolls sideways on a phone must be reachable by keyboard. */ }
							{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */ }
							<div
								className="atlasvoice-table-wrap"
								tabIndex={ 0 }
								role="region"
								aria-label={ tableName }
							>
								<table className="atlasvoice-table">
									<thead>
										<tr>
											<th scope="col">
												{ __(
													'Before',
													'text-to-audio'
												) }
											</th>
											<th scope="col">
												{ __( 'Now', 'text-to-audio' ) }
											</th>
											<th scope="col">
												<span className="screen-reader-text">
													{ __(
														'Open',
														'text-to-audio'
													) }
												</span>
											</th>
										</tr>
									</thead>
									<tbody>
										{ rows.map( ( row ) => (
											<tr key={ row.before }>
												<td>{ row.before }</td>
												<td className="atlasvoice-cell-main">
													<span className="atlasvoice-cell-title">
														{ row.now }
													</span>
												</td>
												<td className="atlasvoice-td-end">
													<Button
														variant="secondary"
														size="compact"
														onClick={ () =>
															go( row.route )
														}
														aria-label={ sprintf(
															/* translators: %s: name of a screen. */
															__(
																'Open %s',
																'text-to-audio'
															),
															row.now
														) }
													>
														{ __(
															'Open',
															'text-to-audio'
														) }
													</Button>
												</td>
											</tr>
										) ) }
									</tbody>
								</table>
							</div>
						</Card>
					</Section>
				) : (
					<Empty
						title={ sprintf(
							/* translators: %s: what the user typed. */
							__( 'Nothing matches “%s”', 'text-to-audio' ),
							query
						) }
						action={
							<Button
								variant="secondary"
								onClick={ () => setQuery( '' ) }
								__next40pxDefaultSize
							>
								{ __( 'Show every item', 'text-to-audio' ) }
							</Button>
						}
					>
						{ __(
							'Try a shorter word, or the name of the old menu item.',
							'text-to-audio'
						) }
					</Empty>
				) }
			</Scroll>
		</Pane>
	);
}
