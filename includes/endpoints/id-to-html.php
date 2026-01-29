<?php
/**
 * ID to HTML endpoint functionality.
 *
 * @package BetterPreviewPlugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the ID to HTML REST API route.
 */
function better_preview_plugin_revisions_register_id_to_html_route() {
	register_rest_route(
		'better-preview-plugin/v1',
		'/revisions/id-to-html/(?P<id>-?\d+)',
		array(
			'methods'             => 'GET',
			'callback'            => 'better_preview_plugin_revisions_get_entity_content',
			'permission_callback' => 'better_preview_plugin_revisions_entity_content_permission_callback',
			'args'                => array(
				'id' => array(
					'validate_callback' => function ( string $id ) {
						if ( ! isset( $id ) ) {
							return new \WP_Error(
								'rest_missing_id',
								__( 'The "id" parameter is required.', 'better-preview-plugin' ),
								array( 'status' => 400 )
							);
						}
						if ( empty( $id ) ) {
							return new \WP_Error(
								'rest_empty_id',
								__( 'The "id" parameter cannot be empty.', 'better-preview-plugin' ),
								array( 'status' => 400 )
							);
						}

						if ( ! is_numeric( $id ) ) {
							return new \WP_Error(
								'rest_invalid_id',
								__( 'The "id" parameter must be a valid number.', 'better-preview-plugin' ),
								array( 'status' => 400 )
							);
						}

						return true;
					},
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'better_preview_plugin_revisions_register_id_to_html_route' );

/**
 * Permission callback for the REST API endpoint.
 *
 * @param  WP_REST_Request $request The request object.
 * @return boolean|WP_Error
 */
function better_preview_plugin_revisions_entity_content_permission_callback( WP_REST_Request $request ): WP_Error|bool {
	$revision_id = (int) $request['id'];
	$entity      = get_post( $revision_id );
	if ( null === $entity && 0 < $revision_id ) {
		return new \WP_Error( 'rest_revision_not_found', __( 'Revision not found.', 'better-preview-plugin' ), array( 'status' => 404 ) );
	}

	if ( 0 < $revision_id && ! current_user_can( 'edit_post', $entity->ID ) ) {
		return new \WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to view this entity.', 'better-preview-plugin' ), array( 'status' => 403 ) );
	}

	if ( ! current_user_can( 'edit_posts' ) ) {
		return new \WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this post.', 'better-preview-plugin' ), array( 'status' => 403 ) );
	}

	return true;
}

/**
 * Callback function for the REST API endpoint.
 *
 * @param  WP_REST_Request $request The request object.
 * @return WP_REST_Response|WP_Error The response object or a WP_Error.
 */
function better_preview_plugin_revisions_get_entity_content( WP_REST_Request $request ): WP_REST_Response|WP_Error {
	$entity_id = (int) $request['id'];

	$post_data = better_preview_plugin_revisions_setup_post_data( $entity_id );
	if ( $post_data instanceof WP_Error ) {
		return new \WP_REST_Response( $post_data->get_error_message(), $post_data->get_error_code() );
	}

	add_filter( 'show_admin_bar', '__return_false' );

	ob_start();

	if ( wp_is_block_theme() ) {
			better_preview_plugin_revisions_render_block_theme_revision( $post_data['post'] );
	} else {
		better_preview_plugin_revisions_render_classic_theme_revision();
	}

	$html = ob_get_clean();

	// Restore the original global state.
	if ( ! empty( $post_data['original_query'] ) ) {
		// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited
		$GLOBALS['post']     = $post_data['original_post'];
		$GLOBALS['wp_query'] = $post_data['original_query'];
		wp_reset_postdata();
		// phpcs:enable WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	return new \WP_REST_Response( $html, 200 );
}

/**
 * Sets up the post data for a revision or post.
 *
 * @param int|string $entity_id The entity ID.
 * @return array|WP_Error The post data array or a WP_Error object.
 */
function better_preview_plugin_revisions_setup_post_data( $entity_id ): array|WP_Error {

	// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited
	global $wp_query, $post;

	// Backup the original post and query objects.
	$original_post  = $post;
	$original_query = $wp_query;

	$wp_query = new \WP_Query();
	$wp_query->init();

	if ( $entity_id < 0 ) {
		// Handle "Latest Posts" or default home page.

		$show_on_front = get_option( 'show_on_front' );

		if ( 'posts' === $show_on_front ) {
			$wp_query->is_home       = true;
			$wp_query->is_front_page = true;
		} else {
			// If we're here and $post is null, it's likely a request for the home/blog that we couldn't resolve to a specific post.
			$wp_query->is_home = true;
		}

		$wp_query->query(
			array(
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'posts_per_page'         => get_option( 'posts_per_page' ),
				'fields'                 => 'all',
				'update_post_term_cache' => true,
				'update_post_meta_cache' => true,
				'cache_results'          => true,
				'suppress_filters'       => false,
				'ignore_sticky_posts'    => false,
			)
		);

		return array(
			'post'           => null,
			'entity'         => null,
			'original_post'  => $original_post,
			'original_query' => $original_query,
		);
	}

	$entity = get_post( $entity_id );

	// The permission callback should prevent this from being reached by unauthorized users,
	// but it's good practice to have this check.
	if ( ! $entity ) {
		return new \WP_Error( 'rest_revision_not_found', __( 'Revision not found. ', 'better-preview-plugin' ), array( 'status' => 404 ) );
	}

	// Set up the post object with data.
	if ( ! empty( $entity->post_parent ) ) {
		$post               = get_post( $entity->post_parent );
		$post->post_title   = $entity->post_title;
		$post->post_content = $entity->post_content;
		$post->post_excerpt = $entity->post_excerpt;
	} else {
		$post = $entity;
	}

	if ( ! $post ) {
		return new \WP_Error( 'rest_revision_not_found', __( 'Revision not found. ', 'better-preview-plugin' ), array( 'status' => 404 ) );
	}

		// Populate query_vars to avoid warnings in WP_Query methods.
		$wp_query->query_vars = array(
			'p'                      => $post->ID,
			'post_type'              => $post->post_type,
			'name'                   => $post->post_name,
			'fields'                 => 'all',
			'update_post_term_cache' => true,
			'update_post_meta_cache' => true,
			'cache_results'          => true,
			'suppress_filters'       => false,
			'ignore_sticky_posts'    => false,
		);

		$is_front_page = (int) get_option( 'page_on_front' ) === $post->ID;
		$is_home_page  = (int) get_option( 'page_for_posts' ) === $post->ID;

		if ( $is_front_page ) {
			$wp_query->is_front_page = true;
			$wp_query->is_singular   = true;
			$wp_query->is_page       = true;
		} elseif ( $is_home_page ) {
			$wp_query->is_home     = true;
			$wp_query->is_singular = false;
			$wp_query->is_page     = true;
		} else {
			$wp_query->is_single   = true;
			$wp_query->is_singular = true;
		}

		$wp_query->queried_object    = $post;
		$wp_query->queried_object_id = $post->ID;
		$wp_query->post              = $post;
		$wp_query->posts             = array( $post );
		$wp_query->post_count        = 1;

		// Set up post data for template tags.
		setup_postdata( $post );
		$post_query = array(
			'post'           => $post,
			'entity'         => $entity,
			'original_post'  => $original_post,
			'original_query' => $original_query,
		);
		return $post_query;
}

/**
 * Gets the possible template slugs for a given post.
 *
 * @param WP_Post $post The post object.
 * @return array List of template slugs.
 */
function better_preview_plugin_revisions_get_post_templates( $post ): array {
	$is_front_page = (int) get_option( 'page_on_front' ) === $post->ID;
	$is_home_page  = (int) get_option( 'page_for_posts' ) === $post->ID;

	// 1. Front Page (Highest Priority for root).
	if ( $is_front_page ) {
		$templates[] = 'front-page';
	}

	// 2. Home (Posts Page).
	if ( $is_home_page ) {
		$templates[] = 'home';
	}

	// 3. Custom Template.
	$template_slug = get_page_template_slug( $post );
	if ( $template_slug ) {
		$templates[] = $template_slug;
	}

	// 4. Specific Type Templates.
	$post_type = get_post_type( $post );
	$slug      = $post->post_name;
	$id        = $post->ID;

	if ( 'page' === $post_type ) {
		$templates[] = "page-$slug";
		$templates[] = "page-$id";
		$templates[] = 'page';
	} else {
		$templates[] = "single-$post_type-$slug";
		$templates[] = "single-$post_type";
		$templates[] = 'single';
	}

	// 5. Singular.
	$templates[] = 'singular';

	// 6. Index.
	$templates[] = 'index';
	return $templates;
}

/**
 * Renders the entity content for a block theme.
 *
 * @param WP_Post $post The parent post object.
 */
function better_preview_plugin_revisions_render_block_theme_revision( $post ) {

	$templates = array();
	if ( null === $post ) {
		$templates[] = 'front-page';
		$templates[] = 'home';
		$templates[] = 'index';
	} else {
		$templates = better_preview_plugin_revisions_get_post_templates( $post );
	}

	$templates = array_unique( $templates );

	$template = null;
	foreach ( $templates as $slug ) {
		$template = get_block_template( get_stylesheet() . '//' . $slug, 'wp_template' );
		if ( $template && ! empty( $template->content ) ) {
			break;
		}
	}

	if ( ! $template ) {
		// Fallback to default single template.
		$template = get_block_template( get_stylesheet() . '//single', 'wp_template' );
	}

	if ( $template && $template->content ) {
		// Parse blocks from template.
		$blocks = parse_blocks( $template->content );

		$rendered_blocks = array();
		foreach ( $blocks as $block ) {
			$rendered_blocks[] = render_block( $block );
		}

		// Render the blocks.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<!DOCTYPE html>';
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<html ' . get_language_attributes() . '>';
		echo '<head>';
		wp_head();
		echo '</head>';
		echo '<body ';
		body_class();
		echo '>';
		wp_body_open();

		echo '<div class="wp-site-blocks">';
		// Render each block.
		foreach ( $rendered_blocks as $better_preview_plugin_revisions_block ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo $better_preview_plugin_revisions_block;
		}

		echo '</div>';

		wp_footer();
		wp_print_speculation_rules();
		echo '</body>';
		echo '</html>';
	} else {
		echo esc_html__( 'Template not found', 'better-preview-plugin' );
	} //end if
}

/**
 * Renders the entity content for a classic theme.
 */
function better_preview_plugin_revisions_render_classic_theme_revision() {

	$template = '';

	if ( is_front_page() ) {
		$template = get_front_page_template();
	}

	if ( ! $template && is_home() ) {
		$template = get_home_template();
	}

	if ( ! $template && is_single() ) {
		$template = get_single_template();
	}

	if ( ! $template && is_page() ) {
		$template = get_page_template();
	}

	if ( ! $template && is_singular() ) {
		$template = get_singular_template();
	}

	if ( ! $template ) {
		$template = get_index_template();
	}

	if ( $template && file_exists( $template ) ) {
		include $template;
	} else {
		echo esc_html__( 'Template not found', 'better-preview-plugin' );
	}
}
