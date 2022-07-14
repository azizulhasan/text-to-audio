import { __ } from '@wordpress/i18n';
import { Form } from 'react-bootstrap';

const customizeButton = {
	namespace: 'tta/customize-button',
	object: {
		title: __('Customize Button'),
		description: __('Text to audio customize button.'),
		icon: 'chart-bar',
		category: 'design',
		keywords: [
			'customize',
			'text-to-audio',
			'speech',
			'audio',
			'text-to-speech',
		],
		attributes: {
			question: { type: 'string' },
			answers: { type: 'array' },
		},

		edit: Customize,

		save: function (props) {
			return null;
		},
	},
};

function Customize(props) {
	const setQuestion = (e) => {
		props.setAttributes({ question: e.target.value });
		props.setAttributes({ answers: ['Yes', 'No'] });
	};
	return (
		<div className='smpl_block'>
			<button
				id='tta__listen_content'
				onClick={(e) => alert('test')}
				type='button'
				title='Text To Audio:  Tap to listen post.'>
				<span className='dashicons dashicons-controls-play'></span>{' '}
				Listen
			</button>
		</div>
	);
}

export default customizeButton;
