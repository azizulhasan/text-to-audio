import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	PanelColorSettings,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	TextareaControl,
} from '@wordpress/components';

const Edit = ({ attributes, setAttributes }) => {
	const { backgroundColor, color, width, border, custom_css } = attributes;
	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelColorSettings
					title={__('Color Settings', 'text-to-audio')}
					colorSettings={[
						{
							value: backgroundColor,
							onChange: (value) =>
								setAttributes({
									backgroundColor: value || '#184c53',
								}),
							label: __(
								'Background Color',
								'text-to-audio'
							),
						},
						{
							value: color,
							onChange: (value) =>
								setAttributes({
									color: value || '#ffffff',
								}),
							label: __('Text Color', 'text-to-audio'),
						},
					]}
				/>
				<PanelBody title={__('Button Settings', 'text-to-audio')}>
					<RangeControl
						label={__('Button Width (%)', 'text-to-audio')}
						value={parseInt(width, 10)}
						onChange={(value) =>
							setAttributes({ width: String(value) })
						}
						min={0}
						max={100}
					/>
					<TextareaControl
						label={__('Custom CSS', 'text-to-audio')}
						value={custom_css || ''}
						onChange={(value) =>
							setAttributes({ custom_css: value })
						}
						placeholder={__(
							'class selector .tta__listen_content',
							'text-to-audio'
						)}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<button
					id="tta__listen_content_block"
					className="tta__listen_content"
					style={{
						backgroundColor,
						color,
						width: `${width}%`,
						border,
					}}
					type="button"
					title={__(
						'Text To Audio: Tap to listen post.',
						'text-to-audio'
					)}
				>
					{__('Listen', 'text-to-audio')}
				</button>
				{custom_css && <style>{custom_css}</style>}
			</div>
		</>
	);
};

const customizeButton = {
	namespace: 'tta/customize-button',
	object: {
		title: 'AtlasVoice',
		description: __('Text to audio customize button.', 'text-to-audio'),
		icon: 'controls-play',
		category: 'design',
		keywords: [
			'AtlasVoice',
			'atlasvoice',
			'text-to-audio',
			'speech',
			'audio',
			'text-to-speech',
			'voice',
		],
		example: {},
		attributes: {
			backgroundColor: {
				type: 'string',
				default: '#184c53',
			},
			color: {
				type: 'string',
				default: '#ffffff',
			},
			width: {
				type: 'string',
				default: '100',
			},
			border: {
				type: 'string',
				default: '0',
			},
			custom_css: {
				type: 'string',
				default: '',
			},
		},
		edit: Edit,
		save: function () {
			return null;
		},
	},
};

export default customizeButton;
