//wp block editor
const { RichText, InspectorControls } = wp.blockEditor;

//wp components
const { PanelBody, SelectControl } = wp.components;

/**
 * Doc Callouts
 */
const webappick = {
	namespace: 'webappick/callouts',
	object: {
		title: 'Callouts',
		description: 'Callouts',
		icon: 'warning',
		category: 'design',

		// custom attributes
		attributes: {
			title: {
				type: 'string',
				source: 'html',
				selector: 'h3',
			},
			body: {
				type: 'string',
				source: 'html',
				selector: 'p',
			},
			calloutCls: {
				type: 'string',
				default: 'callout-green',
			},

			calloutBorder: {
				type: 'string',
				default: 'solid-border',
			},
		},

		edit({ attributes, setAttributes }) {
			const { title, body, calloutCls, calloutBorder } = attributes;

			// custom functions
			function onChangeTitle(newTitle) {
				setAttributes({ title: newTitle });
			}
			function onChangeBody(newBody) {
				setAttributes({ body: newBody });
			}
			function onSelectCallouts(newCalloutCls) {
				setAttributes({ calloutCls: newCalloutCls });
			}
			function onSelectCalloutBorder(newCalloutBorder) {
				setAttributes({ calloutBorder: newCalloutBorder });
			}

			return [
				<InspectorControls style={{ marginBottom: '40px' }}>
					<PanelBody title={'Callout Settings'}>
						<SelectControl
							label='Select Callouts Type'
							value={calloutCls}
							options={[
								{
									label: 'Green Callout',
									value: 'callout-green',
								},
								{ label: 'Red Callout', value: 'callout-red' },
								{
									label: 'Blue Callout',
									value: 'callout-blue',
								},
								{
									label: 'Gray Callout',
									value: 'callout-gray',
								},
							]}
							onChange={onSelectCallouts}
						/>

						<SelectControl
							label='Select Border Type'
							value={calloutBorder}
							options={[
								{ label: 'Solid', value: 'solid-border' },
								{ label: 'Dashed', value: 'dashed-border' },
							]}
							onChange={onSelectCalloutBorder}
						/>
					</PanelBody>
				</InspectorControls>,
				<div
					className={
						'webappick-callouts ' + calloutCls + ' ' + calloutBorder
					}>
					<RichText
						key='title'
						tagName='h3'
						placeholder='Callout Title'
						value={title}
						onChange={onChangeTitle}
					/>
					<RichText
						key='body'
						tagName='p'
						placeholder='Callout Description'
						value={body}
						onChange={onChangeBody}
					/>
				</div>,
			];
		},

		save({ attributes }) {
			const { title, body, calloutCls, calloutBorder } = attributes;

			return (
				<div
					className={
						'webappick-callouts ' + calloutCls + ' ' + calloutBorder
					}>
					<h3>{title}</h3>
					<RichText.Content tagName='p' value={body} />
				</div>
			);
		},
	},
};

export default webappick;
