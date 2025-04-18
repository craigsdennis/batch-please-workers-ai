document.addEventListener('DOMContentLoaded', () => {
  setupBatchRequestExample();
  setupBatchWithReferenceExample();
  setupBatchExtractExample();
});

function setupBatchRequestExample() {
  const generateButton = document.getElementById('generate-prompts-btn');
  const submitButton = document.getElementById('submit-batch-btn');
  const promptsTextarea = document.getElementById('batch-prompts');
  const responseContainer = document.getElementById('response-container');

  // Generate example prompts
  generateButton.addEventListener('click', async () => {
    try {
      generateButton.disabled = true;
      generateButton.textContent = 'Generating...';
      const response = await fetch('/generate/sentences');
      const data = await response.json();
      promptsTextarea.value = JSON.stringify(data.response.sentences, null, 2);
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

        // Check if we need to poll for results
        if (data.response && data.response.request_id) {
          const requestId = data.response.request_id;
          const model = data.model;

          responseContainer.innerHTML = `
            <div>
              <h4>Request queued - polling for results...</h4>
              <p>Request ID: ${requestId}</p>
              <div id="polling-status">Checking status...</div>
            </div>
          `;

          // Start polling
          pollForResults(requestId, model, responseContainer);
        } else {
          // Display regular response
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

  // Let the textarea use its HTML placeholder
}

function setupBatchWithReferenceExample() {
  const generateUsersButton = document.getElementById('generate-users-btn');
  const submitUsersButton = document.getElementById('submit-users-batch-btn');
  const usersTextarea = document.getElementById('batch-users');
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
      users: users
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

        // Check if we need to poll for results
        if (data.response && data.response.request_id) {
          const requestId = data.response.request_id;
          const model = data.model;

          usersResponseContainer.innerHTML = `
            <div>
              <h4>Request queued - polling for results...</h4>
              <p>Request ID: ${requestId}</p>
              <div id="users-polling-status">Checking status...</div>
            </div>
          `;

          // Start polling
          pollForResults(requestId, model, usersResponseContainer, "users-polling-status");
        } else {
          // Display regular response
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

  // Let the textarea use its HTML placeholder
}

function setupBatchExtractExample() {
  const generateUsersButton = document.getElementById('generate-extract-users-btn');
  const submitButton = document.getElementById('submit-extract-btn');
  const usersTextarea = document.getElementById('extract-users');
  const responseContainer = document.getElementById('extract-response-container');

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

  // Submit extract request
  submitButton.addEventListener('click', async () => {
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
      responseContainer.style.display = 'block';
      responseContainer.innerHTML = `<div class="error">Error: ${parseError.message}</div>`;
      return;
    }

    // Prepare request payload
    const payload = {
      users: users
    };

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    responseContainer.style.display = 'block';
    responseContainer.innerHTML = 'Submitting extraction request...';
    responseContainer.classList.add('loading');

    // Send the request
    try {
      const response = await fetch('/example/batch/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Handle the response
      if (response.ok) {
        const data = await response.json();

        // Check if we need to poll for results
        if (data.response && data.response.request_id) {
          const requestId = data.response.request_id;
          const model = data.model;

          responseContainer.innerHTML = `
            <div>
              <h4>Request queued - polling for results...</h4>
              <p>Request ID: ${requestId}</p>
              <div id="extract-polling-status">Checking status...</div>
            </div>
          `;

          // Start polling
          pollForResults(requestId, model, responseContainer, "extract-polling-status");
        } else {
          // Display regular response
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
      console.error('Error submitting extraction request:', error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Extract Company Names';
      responseContainer.classList.remove('loading');
    }
  });

  // Let the textarea use its HTML placeholder
}

// Function to poll for batch request results
function pollForResults(requestId, model, containerElement, statusElementId = "polling-status") {
  const statusElement = containerElement.querySelector(`#${statusElementId}`);
  let pollAttempt = 0;

  const checkStatus = async () => {
    try {
      pollAttempt++;
      statusElement.textContent = `Checking status... (Attempt ${pollAttempt})`;

      const checkResponse = await fetch(`/check-request?id=${requestId}&model=${encodeURIComponent(model)}`);

      if (!checkResponse.ok) {
        throw new Error(`Status check failed: ${checkResponse.status} ${checkResponse.statusText}`);
      }

      const statusData = await checkResponse.json();

      // If still queued or running, poll again after 1 second
      if (statusData.status === 'queued' || statusData.status === 'running') {
        const statusText = statusData.status === 'queued' ? 'Queued' : 'Running';
        containerElement.innerHTML = `
          <div>
            <h4>Request ${statusText.toLowerCase()} - polling for results...</h4>
            <p>Request ID: ${requestId}</p>
            <div id="${statusElementId}">Status: ${statusText} (Attempt ${pollAttempt}) - checking again in 1 second...</div>
            <h4>Current Status Response:</h4>
            <pre>${JSON.stringify(statusData, null, 2)}</pre>
          </div>
        `;
        setTimeout(checkStatus, 1000);
      } else {
        // Results are ready, show them
        containerElement.innerHTML = `
          <h4>Results received:</h4>
          <pre>${JSON.stringify(statusData, null, 2)}</pre>
        `;
      }
    } catch (error) {
      statusElement.textContent = `Error checking status: ${error.message}`;
      console.error('Polling error:', error);

      // Retry up to 5 times even after error
      if (pollAttempt < 5) {
        setTimeout(checkStatus, 1000);
      } else {
        containerElement.innerHTML = `
          <div class="error">
            <h4>Error checking request status</h4>
            <p>${error.message}</p>
            <p>Request ID was: ${requestId}</p>
          </div>
        `;
      }
    }
  };

  // Start the polling process
  checkStatus();
}
