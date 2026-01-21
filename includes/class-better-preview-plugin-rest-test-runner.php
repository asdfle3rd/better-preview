<?php
/**
 * REST API Test Runner for Better Preview Revisions.
 *
 * @package BetterPreviewPlugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Better_Preview_Plugin_REST_Test_Runner
 */
class Better_Preview_Plugin_REST_Test_Runner {

	/**
	 * Run the suite of REST API tests.
	 *
	 * @return array The results of the tests.
	 */
	public function run_tests() {
		$results = array();

		// --- Setup ---
		$temp_post_id = wp_insert_post(
			array(
				'post_title'   => 'Better Preview Revisions Test Post',
				'post_content' => 'Test Content',
				'post_status'  => 'publish',
				'post_type'    => 'post',
			)
		);

		if ( is_wp_error( $temp_post_id ) ) {
			return array(
				array(
					'name'    => 'Setup',
					'status'  => 'fail',
					'message' => 'Failed to create temporary post.',
				),
			);
		}

		// --- Test 1: id-to-html Success ---
		$response = $this->make_request( '/revisions/id-to-html/' . $temp_post_id );
		if ( 200 === $response->get_status() && strpos( $response->get_data(), 'Test Content' ) !== false ) {
			$results[] = array(
				'name'    => 'ID to HTML Endpoint',
				'status'  => 'pass',
				'message' => 'Successfully retrieved HTML content.',
			);
		} else {
			$results[] = array(
				'name'    => 'ID to HTML Endpoint',
				'status'  => 'fail',
				'message' => 'Failed to retrieve HTML content. Status: ' . $response->get_status(),
			);
		}

		// --- Test 2: id-to-html 404 (non-existent) ---
		$response = $this->make_request( '/revisions/id-to-html/999999' );
		if ( 404 === $response->get_status() ) {
			$results[] = array(
				'name'    => 'Error Handling (Non-existent ID)',
				'status'  => 'pass',
				'message' => 'Correctly returned 404 for non-existent ID.',
			);
		} else {
			$results[] = array(
				'name'    => 'Error Handling (Non-existent ID)',
				'status'  => 'fail',
				'message' => 'Expected 404, got ' . $response->get_status(),
			);
		}

		// --- Test 3: id-to-html Invalid ID (non-numeric) ---
		// Note: The route regex (?P<id>\d+) will cause a 404 if it doesn't match.
		$response = $this->make_request( '/revisions/id-to-html/abc' );
		if ( 404 === $response->get_status() ) {
			$results[] = array(
				'name'    => 'Error Handling (Non-numeric ID)',
				'status'  => 'pass',
				'message' => 'Correctly returned 404 for non-numeric ID route mismatch.',
			);
		} else {
			$results[] = array(
				'name'    => 'Error Handling (Non-numeric ID)',
				'status'  => 'fail',
				'message' => 'Expected 404, got ' . $response->get_status(),
			);
		}

		// --- Test 4: url-to-id Success ---
		$permalink = get_permalink( $temp_post_id );
		// Mock SERVER_NAME for validation callback in the plugin.
		if ( isset( $_SERVER['SERVER_NAME'] ) ) {
			$original_server_name = $_SERVER['SERVER_NAME'];
		}
		$_SERVER['SERVER_NAME'] = wp_parse_url( home_url(), PHP_URL_HOST );

		$response = $this->make_request( '/revisions/url-to-id', 'POST', array( 'url' => $permalink ) );
		$data     = $response->get_data();

		if ( 200 === $response->get_status() && isset( $data['id'] ) && (int) $data['id'] === $temp_post_id ) {
			$results[] = array(
				'name'    => 'URL to ID Resolution',
				'status'  => 'pass',
				'message' => 'Successfully resolved URL to ID.',
			);
		} else {
			$results[] = array(
				'name'    => 'URL to ID Resolution',
				'status'  => 'fail',
				'message' => 'Failed to resolve URL. Status: ' . $response->get_status(),
			);
		}

		if ( isset( $original_server_name ) ) {
			$_SERVER['SERVER_NAME'] = $original_server_name;
		} else {
			unset( $_SERVER['SERVER_NAME'] );
		}

		// --- Test 5: url-to-id External URL ---
		$response = $this->make_request( '/revisions/url-to-id', 'POST', array( 'url' => 'https://google.com' ) );
		if ( 400 === $response->get_status() ) {
			$results[] = array(
				'name'    => 'Error Handling (External URL)',
				'status'  => 'pass',
				'message' => 'Correctly rejected external URL with 400.',
			);
		} else {
			$results[] = array(
				'name'    => 'Error Handling (External URL)',
				'status'  => 'fail',
				'message' => 'Expected 400 for external URL, got ' . $response->get_status(),
			);
		}

		// --- Test 6: Permissions (Unauthorized) ---
		$current_user_id = get_current_user_id();
		wp_set_current_user( 0 ); // Simulate anonymous user.

		$response = $this->make_request( '/revisions/id-to-html/' . $temp_post_id );
		if ( 403 === $response->get_status() ) {
			$results[] = array(
				'name'    => 'Security (Unauthorized Access)',
				'status'  => 'pass',
				'message' => 'Correctly denied access to anonymous user.',
			);
		} else {
			$results[] = array(
				'name'    => 'Security (Unauthorized Access)',
				'status'  => 'fail',
				'message' => 'Expected 403 for unauthorized access, got ' . $response->get_status(),
			);
		}

		wp_set_current_user( $current_user_id ); // Restore user.

		// --- Cleanup ---
		wp_delete_post( $temp_post_id, true );

		return $results;
	}

	/**
	 * Helper to make internal REST requests.
	 *
	 * @param string $route  The REST route.
	 * @param string $method The HTTP method.
	 * @param array  $params The request parameters.
	 * @return WP_REST_Response The response object.
	 */
	private function make_request( $route, $method = 'GET', $params = array() ) {
		$request = new WP_REST_Request( $method, '/better-preview-plugin/v1' . $route );
		if ( 'POST' === $method ) {
			$request->set_body_params( $params );
		} else {
			foreach ( $params as $key => $value ) {
				$request->set_param( $key, $value );
			}
		}
		return rest_do_request( $request );
	}
}
