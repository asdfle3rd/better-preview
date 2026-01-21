<?php
/**
 * Test file for Better Preview Revisions.
 *
 * @package BetterPreviewPlugin
 */

namespace BetterPreviewPlugin\Tests;

/**
 * Class Test_BetterPreviewPlugin
 *
 * @package BetterPreviewPlugin
 */
class Test_BetterPreviewPlugin extends \WP_UnitTestCase {

	/**
	 * Base path for the REST API endpoints.
	 *
	 * @var string
	 */
	private $base_path = '/better-preview-plugin/v1/revisions/';

	/**
	 * Test the /revisions/id-to-html/{id} endpoint for successful HTML retrieval with a valid ID.
	 */
	public function test_get_entity_content_success() {
		// Create a dummy post to serve as the revision.
		$post_id = self::factory()->post->create(
			array(
				'post_title'   => 'Test Revision',
				'post_content' => 'Content',
			)
		);

		// Ensure the current user has permission to edit posts.
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );

		// Simulate the REST request parameters.
		$request = new \WP_REST_Request( 'GET', "{$this->base_path}id-to-html/{$post_id}" );

		$request->set_param( 'id', $post_id ); // Manually set the id parameter for direct callback call.

		// Call the function directly to test its internal logic, as rest_do_request handles validation separately.
		$response = \better_preview_plugin_revisions_get_entity_content( $request );

		// Check response status.
		$this->assertEquals( 200, $response->get_status() );

		// Verify the filter was actually added.
		$this->assertNotFalse( has_filter( 'show_admin_bar', '__return_false' ) );

		// Check that HTML is returned.
		$data = $response->get_data();

		$this->assertIsString( $data );

		$this->assertStringContainsString( 'Test Revision', $data );
	}

	/**
	 * Test the /revisions/id-to-html/{id} endpoint when no ID is provided in the path.
	 * Expects a 404 Not Found as the route regex requires an ID.
	 */
	public function test_get_entity_content_no_id_in_path() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );

		// Request endpoint without an ID in the path.
		$request = new \WP_REST_Request( 'GET', "{$this->base_path}id-to-html/" );

		$response = \rest_do_request( $request );

		$this->assertEquals( 404, $response->get_status() );

		$this->assertTrue( $response->is_error() );

		$this->assertEquals( 'rest_no_route', $response->as_error()->get_error_code() );
	}

	/**
	 * Test the /revisions/id-to-html/{id} endpoint when a non-numeric ID is provided in the path.
	 * Expects a 404 Not Found as the route regex requires a numeric ID.
	 */
	public function test_get_entity_content_non_numeric_id_in_path() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );

		// Request endpoint with a non-numeric ID in the path.
		$request = new \WP_REST_Request( 'GET', "{$this->base_path}id-to-html/abc" );

		$response = \rest_do_request( $request );

		$this->assertEquals( 404, $response->get_status() );

		$this->assertTrue( $response->is_error() );

		$this->assertEquals( 'rest_no_route', $response->as_error()->get_error_code() );
	}

	/**
	 * Test the /revisions/id-to-html/{id} endpoint when the ID does not exist.
	 * Expects a 404 Not Found as the internal logic handles non-existent posts.
	 */
	public function test_get_entity_content_non_existent_id() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );

		// Request a non-existent ID.
		$request = new \WP_REST_Request( 'GET', "{$this->base_path}id-to-html/999999" ); // Assuming 999999 does not exist.

		// No need to set_param('id') for path-based parameters, WP REST handles it.
		$response = \rest_do_request( $request );

		$this->assertEquals( 404, $response->get_status() );

		$this->assertTrue( $response->is_error() );

		$this->assertEquals( 'rest_revision_not_found', $response->as_error()->get_error_code() );
	}

	/**
	 * Test that access is denied for unauthorized users.
	 */
	public function test_access_denied_for_unauthorized() {
		$post_id = self::factory()->post->create();

		// Set current user to 0 (anonymous).
		wp_set_current_user( 0 );

		$request = new \WP_REST_Request( 'GET', "{$this->base_path}id-to-html/{$post_id}" );

		$request->set_param( 'id', $post_id );

		// We check the permission callback directly.
		$permission = \better_preview_plugin_revisions_entity_content_permission_callback( $request );

		$this->assertNotTrue( $permission );

		$this->assertInstanceOf( 'WP_Error', $permission );

		$data = $permission->get_error_data();

		$this->assertEquals( 403, $data['status'] );
	}

	/**
	 * Test the POST /revisions/url-to-id endpoint for success.
	 */
	public function test_get_post_id_success() {
		// Set up user.
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );

		// Create post.
		$post_id = self::factory()->post->create();

		$permalink = \get_permalink( $post_id );

		// Set server name to match expected env defaults.
		$_SERVER['SERVER_NAME'] = 'example.org';

		$request = new \WP_REST_Request( 'POST', "{$this->base_path}url-to-id" );

		$request->set_param( 'url', $permalink );

		$response = \rest_do_request( $request );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertEquals( $post_id, $data['id'] );

		$this->assertEquals( 'post', $data['type'] );
	}

	/**
	 * Test that external URLs are rejected by validation.
	 */
	public function test_get_post_id_invalid_url() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );

		// Set server name.
		$_SERVER['SERVER_NAME'] = 'example.org';

		$request = new \WP_REST_Request( 'POST', "{$this->base_path}url-to-id" );

		$request->set_param( 'url', 'https://google.com/some-post' );

		$response = \rest_do_request( $request );

		// Validation errors return 400.
		$this->assertEquals( 400, $response->get_status() );

		$this->assertTrue( $response->is_error() );

		$this->assertEquals( 'rest_invalid_param', $response->as_error()->get_error_code() );
	}

	/**
	 * Test permission callback for url-to-id endpoint.
	 */
	public function test_get_post_id_permissions() {
		// Anonymous user.
		wp_set_current_user( 0 );

		$post_id = self::factory()->post->create();

		$permalink = \get_permalink( $post_id );

		// Set server name.
		$_SERVER['SERVER_NAME'] = 'example.org';

		$request = new \WP_REST_Request( 'POST', "{$this->base_path}url-to-id" );

		$request->set_param( 'url', $permalink );

		$response = \rest_do_request( $request );

		$this->assertEquals( 403, $response->get_status() );
	}
}
