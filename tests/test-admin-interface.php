<?php
/**
 * Test class for the admin interface
 *
 * @package BetterPreviewPlugin
 */

/**
 * Class Test_BetterPreviewPlugin_Admin_Interface
 */
class Test_BetterPreviewPlugin_Admin_Interface extends \WP_UnitTestCase {

	/**
	 * Test that the admin menu page is registered.
	 */
	public function test_admin_menu_page_is_added() {
		// Set current user to admin to pass menu capability checks.
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// Ensure admin functions are available.
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		// Initialize the global menu structure.
		global $menu, $submenu;
		$menu    = array();
		$submenu = array();

		// Load the default WP menu structure.
		// We use require because it's a script that runs procedurally, not a class.
		if ( file_exists( ABSPATH . 'wp-admin/menu.php' ) ) {
			require ABSPATH . 'wp-admin/menu.php';
		} else {
			// Fallback if file not found (unlikely in WP env).
			$this->markTestSkipped( 'wp-admin/menu.php not found.' );
		}

		$this->assertTrue( function_exists( 'better_preview_plugin_revisions_register_admin_menu' ), 'Function better_preview_plugin_revisions_register_admin_menu does not exist.' );

		// Manually call the function to ensure it runs.
		better_preview_plugin_revisions_register_admin_menu();

		// The parent slug is 'options-general.php'.
		$this->assertArrayHasKey( 'options-general.php', $submenu, 'Submenu options-general.php key missing.' );

		// Look for our plugin page in the submenu.
		$found = false;
		foreach ( $submenu['options-general.php'] as $item ) {
			// $item structure: [ 0 => menu_title, 1 => capability, 2 => menu_slug, ... ].
			if ( 'better-preview-plugin' === $item[2] ) {
				$found = true;
				// Verify capability.
				$this->assertEquals( 'manage_options', $item[1] );
				// Verify title.
				$this->assertEquals( 'Better Preview', $item[0] );
				break;
			}
		}

		$this->assertTrue( $found, 'The Better Preview submenu page was not found in options-general.php.' );
	}

	/**
	 * Test that the admin page renders correctly for an administrator.
	 */
	public function test_admin_page_renders_for_admin() {
		// Create and set an admin user.
		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		// We can't easily do a full HTTP request to the admin page in unit tests,
		// but we can check if the callback function generates output.

		ob_start();
		better_preview_plugin_revisions_render_admin_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Better Preview REST API Tests', $output );
		$this->assertStringContainsString( 'Test REST Endpoints', $output );
		// Check for the Tailwind container we added.
		$this->assertStringContainsString( 'bg-slate-800', $output );
	}

	/**
	 * Test that the AJAX action for running tests is registered.
	 */
	public function test_ajax_action_registered() {
		$this->assertTrue( has_action( 'wp_ajax_better_preview_plugin_revisions_run_tests' ) );
		$this->assertTrue( has_action( 'wp_ajax_better_preview_plugin_revisions_verify_integrity' ) );
	}
}
