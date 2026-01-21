<?php
/**
 * Admin page template for Better Preview.
 *
 * @package Better_Preview_Revisions
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="wrap">
	<div class="max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-xl overflow-hidden">
		<div class="bg-slate-800 p-6">
			<h1 class="text-2xl font-bold text-white m-0 flex items-center gap-3">
				<?php echo esc_html__( 'Better Preview REST API Tests', 'better-preview-plugin' ); ?>
			</h1>
		</div>

		<div class="p-8">
			<p class="text-gray-600 mb-6 text-lg">
				<?php echo esc_html__( 'Test the REST API endpoints to ensure the revisions functionality is working correctly within your environment.', 'better-preview-plugin' ); ?>
			</p>

			<div class="flex justify-start gap-4">
				<button id="better-preview-plugin-run-tests" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow transition duration-200 flex items-center gap-2">
					<span><?php echo esc_html__( 'Test REST Endpoints', 'better-preview-plugin' ); ?></span>
				</button>
				<button id="better-preview-plugin-verify-integrity" class="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded shadow transition duration-200 flex items-center gap-2">
					<svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span><?php echo esc_html__( 'Run Isolated REST API Tests', 'better-preview-plugin' ); ?></span>
				</button>
			</div>

			<div id="better-preview-plugin-test-results" class="mt-8">
				<!-- Results will be injected here -->
			</div>

			<div id="better-preview-plugin-console-output" class="hidden mt-8 p-4 bg-gray-900 text-gray-200 font-mono text-sm rounded-lg overflow-x-auto border border-gray-700 shadow-inner">
				<div class="font-bold text-gray-400 mb-2 border-b border-gray-700 pb-2">Console Output:</div>
				<pre class="whitespace-pre-wrap"></pre>
			</div>
		</div>
	</div>

	<!-- Custom Confirmation Modal -->
	<div id="better-preview-plugin-confirm-overlay" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center transition-opacity duration-300">
		<div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full transform transition-all scale-100 mx-4 border border-gray-100">
			<div class="mb-6">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
					<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h3 class="text-xl font-bold text-center text-gray-900 mb-2"><?php echo esc_html__( 'Run Isolated REST API Tests?', 'better-preview-plugin' ); ?></h3>
				<p class="text-gray-500 text-center leading-relaxed" id="better-preview-plugin-confirm-message">
					<?php echo esc_html__( 'Isolated tests will execute the PHPUnit suite in a separate environment. This process may take a few seconds.', 'better-preview-plugin' ); ?>
				</p>
			</div>
			<div class="flex justify-center gap-3">
				<button id="better-preview-plugin-confirm-cancel" class="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors w-full sm:w-auto">
					<?php echo esc_html__( 'Cancel', 'better-preview-plugin' ); ?>
				</button>
				<button id="better-preview-plugin-confirm-proceed" class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg shadow-blue-600/30 w-full sm:w-auto">
					<?php echo esc_html__( 'Proceed', 'better-preview-plugin' ); ?>
				</button>
			</div>
		</div>
	</div>
</div>
