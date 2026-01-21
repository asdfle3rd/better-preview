<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package BetterPreviewPlugin
 */

$better_preview_plugin_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $better_preview_plugin_tests_dir ) {
	$better_preview_plugin_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( $better_preview_plugin_tests_dir . '/includes/functions.php' ) ) {
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo "Could not find $better_preview_plugin_tests_dir/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL;
	exit( 1 );
}

// Give access to tests_add_filter() function.
require_once $better_preview_plugin_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function better_preview_plugin_manually_load_plugin() {
	require dirname( __DIR__ ) . '/better-preview-plugin.php';
}
// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
tests_add_filter( 'muplugins_loaded', 'better_preview_plugin_manually_load_plugin' );

// Start up the WP testing environment.
require $better_preview_plugin_tests_dir . '/includes/bootstrap.php';
