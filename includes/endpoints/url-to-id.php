<?php
/**
 * URL to ID endpoint functionality.
 *
 * @package BetterPreviewPlugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the URL to ID REST API route.
 */
function better_preview_plugin_revisions_register_url_to_id_route() {
	register_rest_route(
		'better-preview-plugin/v1',
		'/revisions/url-to-id',
		array(
			'methods'             => 'POST',
			'callback'            => 'better_preview_plugin_revisions_get_post_id',
			'permission_callback' => 'better_preview_plugin_revisions_get_post_id_permissions_callback',
			'args'                => array(
				'url' => array(
					'validate_callback' => function ( $param ) {
						$sanitized_server_name = isset( $_SERVER['SERVER_NAME'] ) ? sanitize_url( wp_unslash( $_SERVER['SERVER_NAME'] ) ) : '';
						$sanitized_param       = sanitize_url( wp_unslash( $param ) );
						$sanitized_home_url    = sanitize_url( wp_unslash( home_url() ) );
						return str_starts_with( $sanitized_param, $sanitized_server_name ) && str_starts_with( $sanitized_param, $sanitized_home_url );
					},
					'required'          => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'better_preview_plugin_revisions_register_url_to_id_route' );

/**
 * Permission callback for the better-preview-plugin/v1/revisions/post-id endpoint.
 *
 * @return boolean|WP_Error
 */
function better_preview_plugin_revisions_get_post_id_permissions_callback() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return new \WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this post.', 'better-preview-plugin' ), array( 'status' => 403 ) );
	}

	return true;
}

/**
 * Callback function for the better-preview-plugin/v1/revisions/post-id endpoint.
 *
 * @param  WP_REST_Request $request The request object.
 * @return WP_REST_Response|WP_Error The response object or a WP_Error.
 */
function better_preview_plugin_revisions_get_post_id( WP_REST_Request $request ) {
	$url               = $request->get_param( 'url' );
	$retrieved_post_id = url_to_postid( $url );

	if ( empty( $retrieved_post_id ) && untrailingslashit( $url ) === untrailingslashit( home_url() ) ) {
		$retrieved_post_id = (int) get_option( 'page_on_front' );
		$retrieved_post_id = empty( $retrieved_post_id ) ? (int) get_option( 'page_on_front' ) : $retrieved_post_id;
		if ( empty( $retrieved_post_id ) ) {
			return new \WP_REST_Response(
				array(
					'id'   => -1,
					'type' => 'unknown',
				),
				200
			);
		}
		if ( empty( $retrieved_post_id ) ) {
			try {
				$retrieved_post_id = get_posts(
					array(
						'numberposts' => 1,
						'orderby'     => 'date',
						'order'       => 'DESC',
						'post_type'   => 'post',
						'post_status' => 'publish',
					)
				)[0]->ID;
			} catch ( \Throwable $th ) {
				( $th->__toString() );
			}
		}
	}

	if ( empty( $retrieved_post_id ) ) {
		return new \WP_REST_Response( __( 'Post ID could not be found for', 'better-preview-plugin' ) . ' ' . $url, 404 );
	}

	$post = get_post( $retrieved_post_id );
	if ( ! $post ) {
		return new \WP_REST_Response( __( 'Post could not be found.', 'better-preview-plugin' ), 404 );
	}

	$retrieved_post_type = $post->post_type;
	if ( ! current_user_can( 'edit_post', $retrieved_post_id ) ) {
		return new \WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this post.', 'better-preview-plugin' ), array( 'status' => 403 ) );
	}

	return new \WP_REST_Response(
		array(
			'id'   => $retrieved_post_id,
			'type' => $retrieved_post_type,
		),
		200
	);
}
