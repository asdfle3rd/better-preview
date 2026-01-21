<?php
/**
 * Admin page functionality for Better Preview.
 *
 * @package Better_Preview_Revisions.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Include the logic class and ajax handlers.
require_once plugin_dir_path( __FILE__ ) . 'includes/class-better-preview-plugin-rest-test-runner.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/admin-ajax.php';

/**
 * Register the admin menu.
 */
function better_preview_plugin_revisions_register_admin_menu() {
	add_submenu_page(
		'options-general.php',
		'Better Preview',
		'Better Preview',
		'manage_options',
		'better-preview-plugin',
		'better_preview_plugin_revisions_render_admin_page'
	);
}
add_action( 'admin_menu', 'better_preview_plugin_revisions_register_admin_menu' );

/**
 * Enqueue scripts and styles.
 *
 * @param string $hook The current admin page hook.
 */
function better_preview_plugin_revisions_admin_enqueue_scripts( $hook ) {
	// Only load on our settings page.
	if ( 'settings_page_better-preview-plugin' !== $hook ) {
		return;
	}

	// Enqueue Tailwind via CDN.
	wp_enqueue_script(
		'tailwindcss',
		plugin_dir_url( __FILE__ ) . 'assets/tailwindcss.js',
		array(),
		'3.3.0',
		false
	);

	wp_enqueue_script(
		'better-preview-plugin-admin-js',
		plugin_dir_url( __FILE__ ) . 'assets/admin.js',
		array( 'jquery' ),
		'1.0.0',
		true
	);

	wp_localize_script(
		'better-preview-plugin-admin-js',
		'better_preview_plugin_revisions_admin',
		array(
			'nonce' => wp_create_nonce( 'better_preview_plugin_revisions_test_nonce' ),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'better_preview_plugin_revisions_admin_enqueue_scripts' );

/**
 * Render the admin page HTML.
 */
function better_preview_plugin_revisions_render_admin_page() {
	// Include the template file.
	require_once plugin_dir_path( __FILE__ ) . 'templates/admin-page.php';
}
