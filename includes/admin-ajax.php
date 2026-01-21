<?php
/**
 * Admin AJAX handlers for Better Preview Revisions.
 *
 * @package Better_Preview_Revisions
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handle the AJAX request to verify integrity.
 */
function better_preview_plugin_revisions_ajax_verify_integrity() {
	check_ajax_referer( 'better_preview_plugin_revisions_test_nonce', 'nonce' );

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( 'Permission denied' );
	}

	// Increase time limit for setup and tests.
	set_time_limit( 300 );

	require_once ABSPATH . 'wp-admin/includes/file.php';
	if ( ! WP_Filesystem() ) {
		wp_send_json_error( 'Failed to initialize WordPress Filesystem API.' );
	}
	global $wp_filesystem;

	// Use dirname( dirname( __FILE__ ) ) to go up one level from includes/ to root.
	$plugin_dir   = dirname( __DIR__ ) . '/';
	$setup_script = $plugin_dir . 'bin/setup-application-env.sh';
	$test_script  = $plugin_dir . 'bin/test';

	// Ensure scripts are executable.
	if ( ! is_executable( $setup_script ) ) {
		$wp_filesystem->chmod( $setup_script, 0755 );
	}
	if ( ! is_executable( $test_script ) ) {
		$wp_filesystem->chmod( $test_script, 0755 );
	}

	$commands = array();

	$bundled_lib = $plugin_dir . 'bundled-tests/wordpress-tests-lib/includes/functions.php';
	$tmp_lib     = '/tmp/better-preview-plugin-tests/wordpress-tests-lib/includes/functions.php';

	// Check if environment needs setup
	// We skip setup if bundled lib exists OR if tmp lib exists.
	if ( ! $wp_filesystem->exists( $bundled_lib ) && ! $wp_filesystem->exists( $tmp_lib ) ) {
		$commands[] = escapeshellcmd( $setup_script );
	}

	// Add test command with testdox and no colors for better parsing.
	$commands[] = escapeshellcmd( $test_script ) . ' --testdox --colors=never';

	// Get current WP version.
	$wp_version = get_bloginfo( 'version' );

	// Combine commands: export env var, run commands in subshell, redirect all output to stdout.
	$full_command = 'export WP_VERSION=' . escapeshellarg( $wp_version ) . '; (' . implode( ' && ', $commands ) . ') 2>&1';

	if ( ! function_exists( 'proc_open' ) ) {
		wp_send_json_error( esc_html__( 'The proc_open() function is disabled on your server. Integrity tests cannot be run.', 'better-preview-plugin' ) );
	}

	$descriptors = array(
		0 => array( 'pipe', 'r' ), // stdin.
		1 => array( 'pipe', 'w' ), // stdout.
	);

	// Clear all existing buffers to ensure immediate flushing.
	while ( ob_get_level() > 0 ) {
		ob_end_flush();
	}

	// Send headers to disable Nginx buffering.
	header( 'X-Accel-Buffering: no' );
	header( 'Content-Encoding: none' );

	// Send padding to fill any initial buffers (4KB).
	echo esc_html( str_repeat( ' ', 4096 ) );
	flush();

	// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_proc_open
	$process = proc_open( $full_command, $descriptors, $pipes, $plugin_dir );

	if ( ! is_resource( $process ) ) {
		echo '<div class="text-red-500 font-bold">Failed to spawn test process.</div>';
		wp_die();
	}

	// Close stdin immediately.
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
	fclose( $pipes[0] );

	// Process output line by line.
	while ( ! feof( $pipes[1] ) ) {
		$line = fgets( $pipes[1] );
		if ( false !== $line ) {
			// Basic formatting.
			$formatted_line = htmlspecialchars( $line );

			// Colorize known patterns.
			if ( strpos( $line, '[x]' ) !== false || strpos( $line, '✔' ) !== false ) {
				$formatted_line = '<div class="text-green-400">' . $formatted_line . '</div>';
			} elseif ( strpos( $line, '[ ]' ) !== false || strpos( $line, '✘' ) !== false || strpos( $line, 'FAIL' ) !== false || strpos( $line, 'Error' ) !== false ) {
				$formatted_line = '<div class="text-red-400 font-bold">' . $formatted_line . '</div>';
			} elseif ( strpos( $line, '>>>' ) === 0 ) {
				$formatted_line = '<div class="text-blue-300 font-bold mt-2 border-b border-gray-700 pb-1">' . $formatted_line . '</div>';
			} else {
				$formatted_line = '<div>' . $formatted_line . '</div>';
			}

			echo $formatted_line; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

			// Flush system output buffer.
			flush();
		}
	}

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
	fclose( $pipes[1] );

	proc_close( $process );

	wp_die();
}
add_action( 'wp_ajax_better_preview_plugin_revisions_verify_integrity', 'better_preview_plugin_revisions_ajax_verify_integrity' );

/**
 * Handle the AJAX request to run tests.
 */
function better_preview_plugin_revisions_ajax_run_tests() {
	check_ajax_referer( 'better_preview_plugin_revisions_test_nonce', 'nonce' );

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( 'Permission denied' );
	}

	// Ensure the runner class is loaded.
	if ( ! class_exists( 'Better_Preview_Plugin_REST_Test_Runner' ) ) {
		require_once plugin_dir_path( __FILE__ ) . 'class-rest-test-runner.php';
	}

	$runner  = new Better_Preview_Plugin_REST_Test_Runner();
	$results = $runner->run_tests();

	wp_send_json_success( $results );
}
add_action( 'wp_ajax_better_preview_plugin_revisions_run_tests', 'better_preview_plugin_revisions_ajax_run_tests' );
