import React from 'react';
import { Accordion, Table } from 'react-bootstrap';
import toast from '../../context/Notify';
export default function Docs() {
	/**
	 * Copy Code
	 */
	const copyToClipBoard = (id) => {
		/* Get the text field */
		var copyText = document.getElementById(id);

		/* Copy the text inside the text field */
		navigator.clipboard.writeText(copyText.innerText);

		/* Alert the copied text */
		toast('Copied to clipboard');
	};
	/**
	 * Filters
	 */
	const filters = [
		{
			name: 'tta__content_before_cleaning',
			argument: '$description',
		},
		{
			name: 'tta__content_after_cleaning',
			argument: '$description',
		},
	];
	return (
		<Accordion>
			<Accordion.Item eventKey='0'>
				<Accordion.Header>
					1. How to change button text?
				</Accordion.Header>
				<Accordion.Body>
					Add button text on shortcode as an attribute. Example :{' '}
					<code>[tta_listen_btn btn_text="Your_Test"]</code>
				</Accordion.Body>
			</Accordion.Item>
			<Accordion.Item eventKey='1'>
				<Accordion.Header>
					2. How to add custom css class to button?
				</Accordion.Header>
				<Accordion.Body>
					Add class on shortcode as an attribute. Example :{' '}
					<code>[tta_listen_btn class="custom_class"]</code>
				</Accordion.Body>
			</Accordion.Item>
			<Accordion.Item eventKey='2'>
				<Accordion.Header>
					3. Text To Audio Filter Hooks Reference.
				</Accordion.Header>
				<Accordion.Body>
					<Table striped bordered hover size='sm'>
						<thead>
							<tr>
								<th>Sr.</th>
								<th>Filter Name</th>
								<th>Arguments</th>
							</tr>
						</thead>
						<tbody>
							{filters.length &&
								filters.map((filter, index) => {
									return (
										<tr key={filter.name}>
											<td>{++index}</td>
											<td>
												<code>{filter.name}</code>
											</td>
											<td>
												<code>{filter.argument}</code>
											</td>
										</tr>
									);
								})}
						</tbody>
					</Table>
				</Accordion.Body>
			</Accordion.Item>
			<Accordion.Item eventKey='3'>
				<Accordion.Header>4. How to apply filters.</Accordion.Header>
				<Accordion.Body>
					<button
						className=''
						onClick={(e) => copyToClipBoard('filter_hook')}>
						<img
							src={tta_obj.image_url + '/copy.svg'}
							width='15px'
							alt='Copy short code to clipboard'
						/>
					</button>
					<div>
						<pre>
							<code id='filter_hook'>
								{`
              add_filter( 'tta__content_before_cleaning', 'tta__content_before_cleaning_callback' );
              function tta__content_before_cleaning_callback ($description) {
                  // Your code here.
              }
              `}
							</code>
						</pre>
					</div>
				</Accordion.Body>
			</Accordion.Item>
			<Accordion.Item eventKey='4'>
				<Accordion.Header>
					5. How to enable <code>speechSynthesis</code> on FireFox?
				</Accordion.Header>
				<Accordion.Body>
					<p>
						1. Open FireFox browser, open a new tab and search{' '}
						<code>about:config</code>. Now search with this string
						and enable as true.
					</p>
					<p>
						a. <strong>media.webspeech.synth.enabled</strong>{' '}
					</p>
				</Accordion.Body>
			</Accordion.Item>
			<Accordion.Item eventKey='5'>
				<Accordion.Header>
					5. How to enable <code>SpeechRecognition</code> on FireFox?
				</Accordion.Header>
				<Accordion.Body>
					<p>
						1. Open FireFox browser, open a new tab and search{' '}
						<code>about:config</code>. Now search with these 2
						string and enable them as true.
					</p>
					<p>
						a. <strong>media.webspeech.recognition.enable</strong>{' '}
					</p>
					<p>
						b.{' '}
						<strong>
							media.webspeech.recognition.force_enable
						</strong>
					</p>
				</Accordion.Body>
			</Accordion.Item>
			<Accordion.Item eventKey='6'>
				<Accordion.Header>
					6. What is the name of block name of button?
				</Accordion.Header>
				<Accordion.Body>
					<strong>Customize Button</strong>
				</Accordion.Body>
			</Accordion.Item>
		</Accordion>
	);
}
