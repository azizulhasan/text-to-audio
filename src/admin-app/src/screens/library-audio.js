/**
 * The audio of one post in the Audio library: what it is doing, in words,
 * and the one action that fits (TTS-354).
 *
 * A status is never shown by colour alone: the chip holds the word.
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

import { Chip } from '../shell/parts';

/** How often a list with audio in the making is read again, in milliseconds. */
export const REFRESH_EVERY = 5000;

/**
 * Why a job failed, in words a site owner can act on.
 *
 * @param {string} code The reason as the site stored it.
 * @return {string} A sentence.
 */
export function failureWords( code ) {
	const known = {
		quota_exceeded: __(
			'This month’s characters are not enough for this post.',
			'text-to-audio'
		),
		daily_cap_reached: __(
			'Today’s limit is reached. Try again tomorrow.',
			'text-to-audio'
		),
		text_too_long: __(
			'This post is too long for one audio job.',
			'text-to-audio'
		),
		timed_out: __(
			'The audio took too long to make. Try again.',
			'text-to-audio'
		),
		download_failed: __(
			'The finished file could not be fetched. Try again.',
			'text-to-audio'
		),
		unsupported_language: __(
			'The voice could not speak this post’s language. Choose another voice or language on the Voice screen.',
			'text-to-audio'
		),
		unsupported_voice: __(
			'The service does not have the voice that is chosen. Choose another voice on the Voice screen.',
			'text-to-audio'
		),
		invalid_request: __(
			'The service could not read this post’s text. Check the post, then try again.',
			'text-to-audio'
		),
		not_writable: __(
			'The file could not be saved: the uploads folder is not writable.',
			'text-to-audio'
		),
	};

	return Object.prototype.hasOwnProperty.call( known, code )
		? known[ code ]
		: __( 'The audio could not be made. Try again.', 'text-to-audio' );
}

/**
 * What a post's audio is doing.
 *
 * @param {Object} props
 * @param {Object} props.post { status, job }.
 * @return {*} A chip and, when there is more to say, a line.
 */
export function AudioStatus( { post } ) {
	const job = post.job || {};

	if ( post.status === 'ready' ) {
		return (
			<Chip tone="ok" dot>
				{ __( 'Ready', 'text-to-audio' ) }
			</Chip>
		);
	}

	if ( post.status === 'making' ) {
		return (
			<>
				<Chip tone="info" dot>
					{ __( 'Making', 'text-to-audio' ) }
				</Chip>
				{ job.parts > 0 && (
					<span className="atlasvoice-library-note">
						{ sprintf(
							/* translators: 1: parts that are made, 2: all parts of the audio. */
							__( '%1$d of %2$d parts', 'text-to-audio' ),
							job.parts_done,
							job.parts
						) }
					</span>
				) }
			</>
		);
	}

	if ( post.status === 'failed' ) {
		return (
			<>
				<Chip tone="err" dot>
					{ __( 'Failed', 'text-to-audio' ) }
				</Chip>
				<span className="atlasvoice-library-note">
					{ failureWords( job.error ) }
				</span>
			</>
		);
	}

	return (
		<Chip tone="warn" dot>
			{ __( 'No audio yet', 'text-to-audio' ) }
		</Chip>
	);
}

/**
 * The one action a post's audio allows right now.
 *
 * @param {Object}   props
 * @param {Object}   props.post     { id, status }.
 * @param {string}   props.name     The post's name, for screen readers.
 * @param {boolean}  props.busy     Whether this post's action is running.
 * @param {Function} props.onMake   Starts the post's audio job.
 * @param {Function} props.onCancel Cancels it.
 * @return {*} A button, or nothing for a post that is ready.
 */
export function AudioAction( { post, name, busy, onMake, onCancel } ) {
	if ( post.status === 'ready' ) {
		return null;
	}

	if ( post.status === 'making' ) {
		return (
			<Button
				variant="tertiary"
				size="compact"
				isBusy={ busy }
				disabled={ busy }
				onClick={ () => onCancel( post ) }
				aria-label={ sprintf(
					/* translators: %s: a post title. */
					__( 'Cancel the audio of “%s”', 'text-to-audio' ),
					name
				) }
			>
				{ __( 'Cancel', 'text-to-audio' ) }
			</Button>
		);
	}

	const again = post.status === 'failed';

	return (
		<Button
			variant="secondary"
			size="compact"
			isBusy={ busy }
			disabled={ busy }
			onClick={ () => onMake( post ) }
			aria-label={
				again
					? sprintf(
							/* translators: %s: a post title. */
							__(
								'Try the audio of “%s” again',
								'text-to-audio'
							),
							name
					  )
					: sprintf(
							/* translators: %s: a post title. */
							__( 'Make the audio of “%s”', 'text-to-audio' ),
							name
					  )
			}
		>
			{ again
				? __( 'Try again', 'text-to-audio' )
				: __( 'Make audio', 'text-to-audio' ) }
		</Button>
	);
}
