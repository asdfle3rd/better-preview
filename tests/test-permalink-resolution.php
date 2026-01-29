<?php
/**
 * Test file for Permalink Resolution.
 *
 * @package BetterPreviewPlugin
 */

namespace BetterPreviewPlugin\Tests;

/**
 * Class Test_Permalink_Resolution
 *
 * @package BetterPreviewPlugin
 */
class Test_Permalink_Resolution extends \WP_UnitTestCase {

	/**
	 * Helper to test a specific structure configuration.
	 *
	 * @param string $structure The permalink structure.
	 * @param string $cat_base  Optional category base.
	 * @param string $tag_base  Optional tag base.
	 */
	protected function check_structure_resolution( $structure, $cat_base = '', $tag_base = '' ) {
		global $wp_rewrite;

		// Ensure %category% tag is available.
		add_rewrite_tag( '%category%', '([^/]+)', 'category_name=' );

		// 1. Configure Settings.
		$wp_rewrite->set_permalink_structure( $structure );
		if ( ! empty( $cat_base ) ) {
			$wp_rewrite->set_category_base( $cat_base );
		}

		// 2. Flush Rules (Required for url_to_postid to work with new settings).
		$wp_rewrite->flush_rules();

		// 3. Create Data.
		// Create a category to ensure complex structures work.
		$cat_id = self::factory()->category->create(
			array(
				'name' => 'News',
				'slug' => 'news',
			)
		);

		// Create a user for author-based permalinks.
		$user_id = self::factory()->user->create(
			array(
				'role'       => 'author',
				'user_login' => 'testauthor',
			)
		);

		$post_id = self::factory()->post->create(
			array(
				'post_title'    => 'Test Permalinks',
				'post_name'     => 'test-permalinks',
				'post_date'     => '2026-01-26 12:00:00',
				'post_category' => array( $cat_id ),
				'post_author'   => $user_id,
			)
		);

		// 4. Generate the URL (Source of Truth).
		$permalink = get_permalink( $post_id );

		// 5. Reverse Resolve (The Test).
		// Note: url_to_postid requires a full URL usually, or path relative to home.
		$resolved_id = url_to_postid( $permalink );

		// 6. Assert.
		$this->assertEquals(
			$post_id,
			$resolved_id,
			"Failed to resolve ID for structure: $structure"
		);
	}

	/**
	 * Test plain default structure.
	 */
	public function test_plain_structure() {
		$this->check_structure_resolution( '' );
	}

	/**
	 * Test day and name structure.
	 */
	public function test_day_and_name() {
		$this->check_structure_resolution( '/%year%/%monthnum%/%day%/%postname%/' );
	}

	/**
	 * Test month and name structure.
	 */
	public function test_month_and_name() {
		$this->check_structure_resolution( '/%year%/%monthnum%/%postname%/' );
	}

	/**
	 * Test numeric archive structure.
	 */
	public function test_numeric_archive() {
		$this->check_structure_resolution( '/archives/%post_id%' );
	}

	/**
	 * Test post name structure.
	 */
	public function test_post_name() {
		$this->check_structure_resolution( '/%postname%/' );
	}

	/**
	 * Test custom structure with category.
	 */
	public function test_category_hierarchy() {
		// Corresponds to the available tags in the HTML.
		$this->check_structure_resolution( '/%category%/%postname%/' );
	}

	/**
	 * Test custom category base.
	 */
	public function test_custom_category_base() {
		// Corresponds to the "Optional" section in the HTML.
		$this->check_structure_resolution( '/%category%/%postname%/', 'topics' );
	}

	/**
	 * Test author hierarchy structure.
	 */
	public function test_author_hierarchy() {
		$this->check_structure_resolution( '/author/%author%/%postname%/' );
	}

	/**
	 * Test full time complexity structure.
	 */
	public function test_full_time_complexity() {
		$this->check_structure_resolution( '/%year%/%monthnum%/%day%/%hour%/%minute%/%second%/%postname%/' );
	}
}
