<?php

namespace TTA_Api;
/**
 * This class is for getting all  data related to analytics  through api.
 * This is applied for tracker menu.
 * @since      1.0.0
 * @package    TTA
 * @subpackage TTA/api
 * @author     Azizul Hasan <azizulhasan.cr@gmail.com>
 */
class AtlasVoice_Analytics {

	/*
 * Manage customize data
 */
	public function track( $request ) {


		$body = $request->get_body();
		$body = json_decode( $body, 1 );

		$post_id = isset( $body['post_id'] ) ? intval( $body['post_id'] ) : 0;
		$event   = isset( $body['event'] ) ? sanitize_text_field( $body['event'] ) : '';
		$time    = isset( $body['time'] ) ? intval( $body['time'] ) : 0;

		switch ( $event ) {

			case 'init':
				$init_counter = get_post_meta( $post_id, 'atlasVoice_analytics_init', true );
				update_post_meta( $post_id, 'atlasVoice_analytics_init', $init_counter ? $init_counter + 1 : 1 );
				break;

			case 'play':
				$play_counter = get_post_meta( $post_id, 'atlasVoice_analytics_play', true );
				update_post_meta( $post_id, 'atlasVoice_analytics_play', $play_counter ? $play_counter + 1 : 1 );
				break;

			case 'pause':
				$pause_counter = get_post_meta( $post_id, 'atlasVoice_analytics_pause', true );
				update_post_meta( $post_id, 'atlasVoice_analytics_pause', $pause_counter ? $pause_counter + 1 : 1 );
				break;

			case 'resume':
				$resume_counter = get_post_meta( $post_id, 'atlasVoice_analytics_resume', true );
				update_post_meta( $post_id, 'atlasVoice_analytics_resume', $resume_counter ? $resume_counter + 1 : 1 );
				break;

			case 'listening_length':
				$time_counter = get_post_meta( $post_id, 'atlasVoice_analytics_time', true );
				update_post_meta( $post_id, 'atlasVoice_analytics_time', $time_counter ? $time_counter + $time : $time );
				break;

			case 'end':
				$end_counter = get_post_meta( $post_id, 'atlasVoice_analytics_end', true );
				update_post_meta( $post_id, 'atlasVoice_analytics_end', $end_counter ? $end_counter + 1 : 1 );
				break;

			default:
				break;
		}

		$response['status'] = true;
		$response['data']   = [];

		return rest_ensure_response( $response );
	}
}