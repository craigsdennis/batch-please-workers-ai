document.addEventListener('DOMContentLoaded', () => {
	setupBatchRequestExample();
	setupBatchWithReferenceExample();
});

function setupBatchRequestExample() {
	const generateButton = document.getElementById('generate-prompts-btn');
	const submitButton = document.getElementById('submit-batch-btn');
	const promptsTextarea = document.getElementById('batch-prompts');
	const queueRequestCheckbox = document.getElementById('queue-request');
	const responseContainer = document.getElementById('response-container');

	// Generate example prompts
	generateButton.addEventListener('click', async () => {
		try {
			generateButton.disabled = true;
			generateButton.textContent = 'Generating...';
			const response = await fetch('/generate/prompts');
			const data = await response.json();
			promptsTextarea.value = JSON.stringify(data.response.prompts, null, 2);
		} catch (error) {
			console.error('Error generating prompts:', error);
			promptsTextarea.value = '// Error generating prompts. Please try again.';
		} finally {
			generateButton.disabled = false;
			generateButton.textContent = 'Generate Example Prompts';
		}
	});

	// Submit batch request
	submitButton.addEventListener('click', async () => {
		let queries = [];
		try {
			// Get the textarea content and parse it into an array of prompts
			const textareaValue = promptsTextarea.value.trim();
			queries = JSON.parse(textareaValue);

			// Ensure it's an array
			if (!Array.isArray(queries)) {
				throw new Error('Input must be a JSON array of strings or formatted examples');
			}
		} catch (parseError) {
			responseContainer.style.display = 'block';
			responseContainer.innerHTML = `<div class="error">Error: Invalid input format. Please enter valid examples or a JSON array of strings.</div>`;
			return;
		}

		// Prepare request payload
		const payload = {
			queries: queries,
			queueRequest: queueRequestCheckbox.checked,
		};

		// Show loading state
		submitButton.disabled = true;
		submitButton.textContent = 'Processing...';
		responseContainer.style.display = 'block';
		responseContainer.innerHTML = 'Submitting batch request...';
		responseContainer.classList.add('loading');

		// Send the request
		try {
			const response = await fetch('/example/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			// Handle the response
			if (response.ok) {
				const data = await response.json();

				// If it's a queued request that returns a request ID
				if (queueRequestCheckbox.checked && data.response && data.response.request_id) {
					responseContainer.innerHTML = `
            <div class="success">
              <p>Request queued successfully!</p>
              <p>Request ID: <code>${data.response.request_id}</code></p>
              <p>Check status with: <code>/check-request?id=${data.response.request_id}</code></p>
              <div class="button-group">
                <button id="check-status-btn">Check Status</button>
                <button id="retry-btn">Retry Request</button>
              </div>
              <div class="code-sample">
                <h4>Sample code to check request status:</h4>
                <pre>
// Check the status of a queued request
const result = await env.AI.run(model, {
  request_id: "${data.response.request_id}"
});

// Process the results when they're ready
console.log(result);
                </pre>
              </div>
            </div>
          `;

					// Add event listener for the check status button
					document.getElementById('check-status-btn').addEventListener('click', async () => {
						try {
							// Clear previous response and show loading state
							responseContainer.innerHTML = `<div>Checking status...</div>`;
							
							const statusResponse = await fetch(`/check-request?id=${data.response.request_id}`);
							const statusData = await statusResponse.json();

							// Always show Check Status button regardless of queue state
							responseContainer.innerHTML = `
                <h4>Request Status:</h4>
                <pre>${JSON.stringify(statusData, null, 2)}</pre>
                <div class="button-group">
                  <button id="back-to-queue-btn">Back to Queue Info</button>
                  <button id="check-status-btn">Check Status</button>
                </div>
              `;
							
							// Add event listener to go back to queue info
							document.getElementById('back-to-queue-btn').addEventListener('click', () => {
								// Simulate a click on the button to reshow queue info
								submitButton.click();
							});
							
							// Re-attach the check status button event listener
							document.getElementById('check-status-btn').addEventListener('click', async () => {
								try {
									// Clear previous response and show loading state
									responseContainer.innerHTML = `<div>Checking status...</div>`;
									
									const newStatusResponse = await fetch(`/check-request?id=${data.response.request_id}`);
									const newStatusData = await newStatusResponse.json();
									
									responseContainer.innerHTML = `
										<h4>Request Status:</h4>
										<pre>${JSON.stringify(newStatusData, null, 2)}</pre>
										<div class="button-group">
											<button id="back-to-queue-btn">Back to Queue Info</button>
											<button id="check-status-btn">Check Status</button>
										</div>
									`;
									
									// Re-attach event listeners
									document.getElementById('back-to-queue-btn').addEventListener('click', () => {
										submitButton.click();
									});
									
									// Recursively set up the check button again
									document.getElementById('check-status-btn').addEventListener('click', arguments.callee);
								} catch (error) {
									responseContainer.innerHTML = `<div class="error">Error checking status: ${error.message}</div>`;
								}
							});
						} catch (error) {
							responseContainer.innerHTML = `<div class="error">Error checking status: ${error.message}</div>`;
						}
					});
					
					// Add event listener for the retry button
					document.getElementById('retry-btn').addEventListener('click', async () => {
						// Disable the button to prevent multiple clicks
						document.getElementById('retry-btn').disabled = true;
						
						try {
							// Make a new request with the same parameters
							const newResponse = await fetch('/example/batch', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify(payload),
							});
							
							if (newResponse.ok) {
								const newData = await newResponse.json();
								
								// Update the UI with the new request ID
								if (newData.response && newData.response.request_id) {
									responseContainer.innerHTML = `
                    <div class="success">
                      <p>Request resubmitted successfully!</p>
                      <p>New Request ID: <code>${newData.response.request_id}</code></p>
                      <p>Check status with: <code>/check-request?id=${newData.response.request_id}</code></p>
                      <div class="button-group">
                        <button id="check-status-btn">Check Status</button>
                        <button id="retry-btn">Retry Request</button>
                      </div>
                      <div class="code-sample">
                        <h4>Sample code to check request status:</h4>
                        <pre>
// Check the status of a queued request
const result = await env.AI.run(model, {
  request_id: "${newData.response.request_id}"
});

// Process the results when they're ready
console.log(result);
                        </pre>
                      </div>
                    </div>
                  `;
                  
                  // Re-attach event listeners to the new buttons
                  document.getElementById('check-status-btn').addEventListener('click', async () => {
                    try {
                      // Clear previous response and show loading state
                      responseContainer.innerHTML = `<div>Checking status...</div>`;
                      
                      const statusResponse = await fetch(`/check-request?id=${newData.response.request_id}`);
                      const statusData = await statusResponse.json();
                      
                      responseContainer.innerHTML = `
                        <h4>Request Status:</h4>
                        <pre>${JSON.stringify(statusData, null, 2)}</pre>
                        <div class="button-group">
                          <button id="back-to-queue-btn">Back to Queue Info</button>
                          <button id="check-status-btn">Check Status</button>
                        </div>
                      `;
                      
                      // Add event listener to go back to queue info
                      document.getElementById('back-to-queue-btn').addEventListener('click', () => {
                        submitButton.click();
                      });
                      
                      // Re-attach the check status button event listener
                      document.getElementById('check-status-btn').addEventListener('click', async () => {
                        try {
                          // Clear previous response and show loading state
                          responseContainer.innerHTML = `<div>Checking status...</div>`;
                          
                          const newStatusResponse = await fetch(`/check-request?id=${newData.response.request_id}`);
                          const newStatusData = await newStatusResponse.json();
                          
                          responseContainer.innerHTML = `
                            <h4>Request Status:</h4>
                            <pre>${JSON.stringify(newStatusData, null, 2)}</pre>
                            <div class="button-group">
                              <button id="back-to-queue-btn">Back to Queue Info</button>
                              <button id="check-status-btn">Check Status</button>
                            </div>
                          `;
                          
                          // Re-attach event listeners
                          document.getElementById('back-to-queue-btn').addEventListener('click', () => {
                            submitButton.click();
                          });
                          
                          // Recursively set up the check button again
                          document.getElementById('check-status-btn').addEventListener('click', arguments.callee);
                        } catch (error) {
                          responseContainer.innerHTML = `<div class="error">Error checking status: ${error.message}</div>`;
                        }
                      });
                    } catch (error) {
                      responseContainer.innerHTML = `<div class="error">Error checking status: ${error.message}</div>`;
                    }
                  });
                  
                  document.getElementById('retry-btn').addEventListener('click', () => {
                    submitButton.click();
                  });
								} else {
									// Handle regular non-queued response
									responseContainer.innerHTML = `
                    <h4>Response:</h4>
                    <pre>${JSON.stringify(newData, null, 2)}</pre>
                  `;
								}
							} else {
								const errorData = await newResponse.text();
								responseContainer.innerHTML = `<div class="error">Error: ${newResponse.status} ${newResponse.statusText}<br>${errorData}</div>`;
							}
						} catch (error) {
							responseContainer.innerHTML = `<div class="error">Error retrying request: ${error.message}</div>`;
						}
					});
				} else {
					// Display the regular response
					responseContainer.innerHTML = `
            <h4>Response:</h4>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          `;
				}
			} else {
				const errorData = await response.text();
				responseContainer.innerHTML = `<div class="error">Error: ${response.status} ${response.statusText}<br>${errorData}</div>`;
			}
		} catch (error) {
			responseContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
			console.error('Error submitting batch:', error);
		} finally {
			submitButton.disabled = false;
			submitButton.textContent = 'Submit Batch';
			responseContainer.classList.remove('loading');
		}
	});

	// Initialize textarea with empty placeholder text
	promptsTextarea.value = 'Click "Generate Example Prompts" to get started';
}

function setupBatchWithReferenceExample() {
	const generateUsersButton = document.getElementById('generate-users-btn');
	const submitUsersButton = document.getElementById('submit-users-batch-btn');
	const usersTextarea = document.getElementById('batch-users');
	const queueUsersRequestCheckbox = document.getElementById('queue-users-request');
	const usersResponseContainer = document.getElementById('users-response-container');

	// Generate fake users
	generateUsersButton.addEventListener('click', async () => {
		try {
			generateUsersButton.disabled = true;
			generateUsersButton.textContent = 'Generating...';
			const response = await fetch('/generate/users');
			const data = await response.json();
			usersTextarea.value = JSON.stringify(data.response.users, null, 2);
		} catch (error) {
			console.error('Error generating users:', error);
			usersTextarea.value = '// Error generating users. Please try again.';
		} finally {
			generateUsersButton.disabled = false;
			generateUsersButton.textContent = 'Generate Fake Users';
		}
	});

	// Submit batch request with references
	submitUsersButton.addEventListener('click', async () => {
		let users = [];
		try {
			// Get the textarea content and parse it into an array of user objects
			const textareaValue = usersTextarea.value.trim();
			users = JSON.parse(textareaValue);

			// Ensure it's an array
			if (!Array.isArray(users)) {
				throw new Error('Input must be a JSON array of user objects');
			}
			
			// Ensure each user has username and profileStatus
			for (const user of users) {
				if (!user.username || !user.profileStatus) {
					throw new Error('Each user must have a username and profileStatus');
				}
			}
		} catch (parseError) {
			usersResponseContainer.style.display = 'block';
			usersResponseContainer.innerHTML = `<div class="error">Error: ${parseError.message}</div>`;
			return;
		}

		// Prepare request payload
		const payload = {
			users: users,
			queueRequest: queueUsersRequestCheckbox.checked
		};

		// Show loading state
		submitUsersButton.disabled = true;
		submitUsersButton.textContent = 'Processing...';
		usersResponseContainer.style.display = 'block';
		usersResponseContainer.innerHTML = 'Submitting batch request with references...';
		usersResponseContainer.classList.add('loading');

		// Send the request
		try {
			const response = await fetch('/example/batch/with-reference', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			// Handle the response
			if (response.ok) {
				const data = await response.json();
				
				// If it's a queued request that returns a request ID
				if (queueUsersRequestCheckbox.checked && data.response && data.response.request_id) {
					usersResponseContainer.innerHTML = `
						<div class="success">
							<p>Request queued successfully!</p>
							<p>Request ID: <code>${data.response.request_id}</code></p>
							<p>Check status with: <code>/check-request?id=${data.response.request_id}</code></p>
							<button id="check-users-status-btn">Check Status</button>
							<div class="code-sample">
								<h4>Sample code to check request status:</h4>
								<pre>
// Check the status of a queued request
const result = await env.AI.run(model, {
  request_id: "${data.response.request_id}"
});

// Process the results when they're ready
console.log(result);
								</pre>
							</div>
						</div>
					`;

					// Add event listener for the check status button
					document.getElementById('check-users-status-btn').addEventListener('click', async () => {
						try {
							// Clear previous response and show loading state
							usersResponseContainer.innerHTML = `<div>Checking status...</div>`;
							
							const statusResponse = await fetch(`/check-request?id=${data.response.request_id}`);
							const statusData = await statusResponse.json();

							// Always show Check Status button
							usersResponseContainer.innerHTML = `
								<h4>Request Status:</h4>
								<pre>${JSON.stringify(statusData, null, 2)}</pre>
								<div class="button-group">
									<button id="back-to-users-queue-btn">Back to Queue Info</button>
									<button id="check-users-status-btn">Check Status</button>
								</div>
							`;
							
							// Add event listener to go back to queue info
							document.getElementById('back-to-users-queue-btn').addEventListener('click', () => {
								// Simulate a click on the button to reshow queue info
								submitUsersButton.click();
							});
							
							// Re-attach the check status button event listener
							document.getElementById('check-users-status-btn').addEventListener('click', async () => {
								try {
									// Clear previous response and show loading state
									usersResponseContainer.innerHTML = `<div>Checking status...</div>`;
									
									const newStatusResponse = await fetch(`/check-request?id=${data.response.request_id}`);
									const newStatusData = await newStatusResponse.json();
									
									usersResponseContainer.innerHTML = `
										<h4>Request Status:</h4>
										<pre>${JSON.stringify(newStatusData, null, 2)}</pre>
										<div class="button-group">
											<button id="back-to-users-queue-btn">Back to Queue Info</button>
											<button id="check-users-status-btn">Check Status</button>
										</div>
									`;
									
									// Re-attach event listeners
									document.getElementById('back-to-users-queue-btn').addEventListener('click', () => {
										submitUsersButton.click();
									});
									
									// Recursively set up the check button again
									document.getElementById('check-users-status-btn').addEventListener('click', arguments.callee);
								} catch (error) {
									usersResponseContainer.innerHTML = `<div class="error">Error checking status: ${error.message}</div>`;
								}
							});
						} catch (error) {
							usersResponseContainer.innerHTML = `<div class="error">Error checking status: ${error.message}</div>`;
						}
					});
				} else {
					// Display the regular response
					usersResponseContainer.innerHTML = `
						<h4>Response:</h4>
						<pre>${JSON.stringify(data, null, 2)}</pre>
					`;
				}
			} else {
				const errorData = await response.text();
				usersResponseContainer.innerHTML = `<div class="error">Error: ${response.status} ${response.statusText}<br>${errorData}</div>`;
			}
		} catch (error) {
			usersResponseContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
			console.error('Error submitting batch with references:', error);
		} finally {
			submitUsersButton.disabled = false;
			submitUsersButton.textContent = 'Submit Batch with References';
			usersResponseContainer.classList.remove('loading');
		}
	});

	// Initialize textarea with empty placeholder text
	usersTextarea.value = 'Click "Generate Fake Users" to get started';
}