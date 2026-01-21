jQuery(document).ready(function($) {
    var $runBtn = $('#better-preview-plugin-run-tests');
    var $verifyBtn = $('#better-preview-plugin-verify-integrity');
    var $overlay = $('#better-preview-plugin-confirm-overlay');
    var $cancelBtn = $('#better-preview-plugin-confirm-cancel');
    var $proceedBtn = $('#better-preview-plugin-confirm-proceed');
    var $results = $('#better-preview-plugin-test-results');
    var $consoleOutput = $('#better-preview-plugin-console-output');
    var $confirmMessage = $('#better-preview-plugin-confirm-message');
    
    var currentAction = null;

    // Messages
    var msgDiagnostics = 'Running diagnostics will create and delete a temporary post in your database to verify system integrity. This is a safe operation.';
    var msgIntegrity = 'Isolated tests will execute the PHPUnit suite in a separate environment. This process may take a few seconds.';

    // Show modal on "Run Diagnostics" click
    $runBtn.on('click', function(e) {
        e.preventDefault();
        currentAction = 'diagnostics';
        $confirmMessage.text(msgDiagnostics);
        $overlay.removeClass('hidden');
    });

    // Show modal on "Run Isolated REST API Tests" click
    $verifyBtn.on('click', function(e) {
        e.preventDefault();
        currentAction = 'integrity';
        $confirmMessage.text(msgIntegrity);
        $overlay.removeClass('hidden');
    });

    // Close modal on Cancel or Overlay click
    function closeModal() {
        $overlay.addClass('hidden');
        currentAction = null;
    }

    $cancelBtn.on('click', function(e) {
        e.preventDefault();
        closeModal();
    });

    $overlay.on('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Proceed with tests
    $proceedBtn.on('click', function(e) {
        e.preventDefault();
        var action = currentAction;
        closeModal();
        
        if (action === 'diagnostics') {
            runDiagnostics();
        } else if (action === 'integrity') {
            verifyIntegrity();
        }
    });

    function runDiagnostics() {
        $runBtn.prop('disabled', true).text('Running Tests...').addClass('opacity-50 cursor-not-allowed');
        $results.html('<div class="flex justify-center my-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>');
        $consoleOutput.addClass('hidden'); // Hide console if visible

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'better_preview_plugin_revisions_run_tests',
                nonce: better_preview_plugin_revisions_admin.nonce
            },
            success: function(response) {
                $runBtn.prop('disabled', false).text('Run Diagnostics').removeClass('opacity-50 cursor-not-allowed');
                
                if (response.success) {
                    var html = '<div class="mt-6 space-y-4">';
                    var allPassed = true;
                    
                    $.each(response.data, function(_, test) {
                        var statusColor = test.status === 'pass' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
                        var icon = test.status === 'pass' ? 
                            '<svg class="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : 
                            '<svg class="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
                        
                        if (test.status === 'fail') allPassed = false;
                        
                        html += '<div class="flex items-center p-4 border rounded-lg shadow-sm ' + statusColor + '">';
                        html += icon;
                        html += '<div class="flex-1">';
                        html += '<h3 class="font-semibold">' + test.name + '</h3>';
                        html += '<p class="text-sm opacity-90">' + test.message + '</p>';
                        html += '</div>';
                        html += '</div>';
                    });
                    html += '</div>';
                    
                    if (allPassed) {
                         html += '<div class="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-center font-bold">All systems operational!</div>';
                    } else {
                         html += '<div class="mt-6 p-4 bg-red-100 text-red-800 rounded-lg text-center font-bold">Some tests failed. Check logs.</div>';
                    }
                    
                    $results.html(html);
                } else {
                    $results.html('<div class="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">Error: ' + response.data + '</div>');
                }
            },
            error: function() {
                $runBtn.prop('disabled', false).text('Run Diagnostics').removeClass('opacity-50 cursor-not-allowed');
                $results.html('<div class="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">Request failed.</div>');
            }
        });
    }

    function verifyIntegrity() {
        $verifyBtn.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');
        $runBtn.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');
        
        // Reset console
        $consoleOutput.removeClass('hidden');
        var $pre = $consoleOutput.find('pre');
        $pre.html('<div class="text-blue-300">Initializing isolated REST API tests...</div>');
        
        const formData = new FormData();
        formData.append('action', 'better_preview_plugin_revisions_verify_integrity');
        formData.append('nonce', better_preview_plugin_revisions_admin.nonce);

        fetch(ajaxurl, {
            method: 'POST',
            body: formData
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            function read() {
                reader.read().then(({done, value}) => {
                    if (done) {
                        $verifyBtn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
                        $runBtn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
                        return;
                    }

                    const chunk = decoder.decode(value, {stream: true});
                    // Append HTML chunk
                    if (chunk) {
                        $pre[0].insertAdjacentHTML('beforeend', chunk);
                        // Auto scroll
                        $consoleOutput[0].scrollTop = $consoleOutput[0].scrollHeight;
                    }

                    read();
                }).catch(error => {
                    console.error('Stream reading error:', error);
                    $pre[0].insertAdjacentHTML('beforeend', '<div class="text-red-500 font-bold">Stream error occurred.</div>');
                });
            }
            read();

        }).catch(error => {
            $verifyBtn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
            $runBtn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
            $pre.text('Request Failed: ' + error);
        });
    }
});
