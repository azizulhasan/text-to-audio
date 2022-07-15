import { __ } from '@wordpress/i18n';

import { Form } from 'react-bootstrap';

import { ColorPalette } from '@wordpress/components';
import { useState } from '@wordpress/element';

//wp block editor
const { InspectorControls } = wp.blockEditor;

//wp components
const { ColorPicker, PanelBody } = wp.components;

const customizeButton = {
	namespace: 'tta/customize-button',
	object: {
		title: __('Customize Button'),
		description: __('Text to audio customize button.'),
		icon: 'controls-play',
		category: 'design',
		keywords: [
			'customize',
			'text-to-audio',
			'speech',
			'audio',
			'text-to-speech',
		],
		attributes: {
			backgroundColor: {
				type: 'string',
				default: 'rgb(226, 222, 232)',
			},
			color: {
				type: 'string',
				default: 'rgb(0, 0, 0)',
			},
			width: {
				type: 'string',
				default: '100',
			},
			border: {
				type: 'string',
				default: '0',
			},
			customCSS: {
				type: 'string',
				default: '',
			},
		},

		edit: Customize,

		save: function (props) {
			return null;
		},
	},
};

function Customize(props) {
	const [colorp, setColorp] = useState('#f00');
	const colors = [
		{ name: 'red', colorp: '#f00' },
		{ name: 'white', colorp: '#fff' },
		{ name: 'blue', colorp: '#00f' },
	];
	const setBackgroundColor = (e) => {
		props.setAttributes({ backgroundColor: e.target.value });
	};
	const setColor = (e) => {
		props.setAttributes({ color: e.target.value });
	};
	const setWidth = (e) => {
		props.setAttributes({ width: e.target.value });
	};

	const setCustomCSS = (e) => {
		props.setAttributes({ customCSS: e.target.value });
	};
	const { color, backgroundColor, width, border, customCSS } =
		props.attributes;

	return [
		<InspectorControls style={{ marginBottom: '40px' }}>
			<PanelBody title={'Customize Button'}>
				<ColorPalette
					colors={colors}
					value={colorp}
					onChange={(color) => setColorp(color)}
				/>
				<Form>
					<Form.Label htmlFor='backgroundColor'>
						BackGround Color
					</Form.Label>
					<Form.Control
						type='color'
						name='backgroundColor'
						onChange={setBackgroundColor}
						id='backgroundColor'
						value={backgroundColor}
						title='Choose your color'
					/>
					<Form.Label htmlFor='color'>Text Color</Form.Label>
					<Form.Control
						type='color'
						name='color'
						onChange={setColor}
						id='color'
						value={color}
						title='Choose your color'
					/>
					<Form.Label htmlFor='width'>Button Width (%)</Form.Label>
					<Form.Control
						type='number'
						name='width'
						onChange={setWidth}
						id='width'
						min={'0'}
						max='100'
						value={width}
						title='Button Width'
					/>
					<Form.Label htmlFor='custom_css'>Custom CSS</Form.Label>
					<Form.Control
						as='textarea'
						name='custom_css'
						onChange={setCustomCSS}
						value={customCSS ? customCSS : ''}
						placeholder='Custom CSS'
					/>
				</Form>
			</PanelBody>
		</InspectorControls>,

		<div className='smpl_block'>
			<button
				id='tta__listen_content_block'
				onClick={(e) =>
					listenCotentInDashboard(
						'tta__listen_content_block',
						'',
						ttaBlocks.listeningSettings,
					)
				}
				style={{
					backgroundColor: backgroundColor,
					color: color,
					width: width + '%',
					border: border,
				}}
				type='button'
				title='Text To Audio:  Tap to listen post.'>
				<span className='dashicons dashicons-controls-play'></span>{' '}
				Listen
			</button>
		</div>,
	];
}

export default customizeButton;
