(function () {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        try {
            const url = args[0] || '';

            // Check if this is a submission check
            // LeetCode submission URL pattern: /problems/{slug}/submit/
            if (typeof url === 'string' && url.includes('/submit/')) {
                const clone = response.clone();
                clone.json().then(data => {
                    // Extract problem slug from URL
                    const match = url.match(/problems\/([^\/]+)\/submit/);
                    const problemSlug = match ? match[1] : '';

                    // We also need the request body to get the code/language
                    // args[1] is the options object
                    const options = args[1] || {};
                    const body = options.body ? JSON.parse(options.body) : {};

                    window.postMessage({
                        type: 'BSG_LEETCODE_SUBMISSION',
                        payload: {
                            problemSlug: problemSlug,
                            submissionId: data.submission_id,
                            lang: body.lang,
                            question_id: body.question_id,
                            typed_code: body.typed_code,
                            // We don't get the verdict immediately from the submit call response
                            // The response usually just contains a submission_id
                            // The frontend creates a separate poll request to /submissions/detail/{id}/check/
                        }
                    }, '*');
                }).catch(err => console.error("BSG: Failed to parse submit response", err));
            }

            // Check if this is the submission result polling
            // URL pattern: /submissions/detail/{id}/check/
            if (typeof url === 'string' && url.includes('/check/')) {
                const clone = response.clone();
                clone.json().then(data => {
                    // Only care if state is SUCCESS
                    if (data.state === 'SUCCESS') {
                        window.postMessage({
                            type: 'BSG_LEETCODE_RESULT',
                            payload: {
                                submissionId: url.split('/')[3], // extract ID from URL
                                status_msg: data.status_msg,
                                total_correct: data.total_correct,
                                total_testcases: data.total_testcases,
                                runtime_percentile: data.runtime_percentile,
                                memory_percentile: data.memory_percentile,
                                code_output: data.code_output,
                                std_output: data.std_output,
                                elapsed_time: data.elapsed_time,
                                // Add other relevant fields
                            }
                        }, '*');
                    }
                }).catch(err => console.error("BSG: Failed to parse check response", err));
            }

        } catch (e) {
            console.error("BSG Interceptor Error:", e);
        }

        return response;
    };
})();
