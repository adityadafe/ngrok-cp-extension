// Constants
const HTTP_METHODS = ["GET", "PUT", "POST", "DELETE", "PATCH"];
const BUTTON_TIMEOUT_MS = 2000;
const HEADER_BUTTON_DELAY_MS = 500;
const COPY_BUTTON_WIDTH = '70px';
const COPY_BUTTON_HEIGHT = '28px';

// Cached DOM queries
let tableRows = null;
let codeBlocks = null;

// Initialize cached queries
function initializeDOMCache() {
    tableRows = document.querySelectorAll('td.wrapped');
    codeBlocks = document.getElementsByTagName("code");
}

/**
 * Extract headers and body from HTTP request/response string
 * @param {string} httpString - HTTP request or response text
 * @returns {{headers: Object, body: string, bodyStartIndex: number}} Parsed HTTP data
 */
function parseHTTPMessage(httpString) {
    const lines = httpString.trim().split('\n');
    const headers = {};
    let bodyStartIndex = -1;
    
    // Start from line 1 to skip request/response line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Empty line indicates start of body
        if (!line) {
            bodyStartIndex = i + 1;
            break;
        }
        
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const headerName = line.substring(0, colonIndex).trim();
        const headerValue = line.substring(colonIndex + 1).trim();
        headers[headerName] = headerValue;
    }
    
    // Extract body if present
    const body = (bodyStartIndex > 0 && bodyStartIndex < lines.length) 
        ? lines.slice(bodyStartIndex).join('\n').trim() 
        : '';
    
    return { headers, body, bodyStartIndex };
}

/**
 * Convert HTTP request to curl command
 * @param {string} httpString - HTTP request text
 * @returns {string} curl command
 */
function httpToCurl(httpString) {
    const lines = httpString.trim().split('\n');
    
    // Parse the first line: METHOD /path HTTP/version
    const requestLine = lines[0].trim();
    const [method, path] = requestLine.split(' ');
    
    if (!method || !path) {
        console.error('Invalid HTTP request format');
        return '';
    }
    
    const { headers, body } = parseHTTPMessage(httpString);
    
    // Get host header for URL construction
    const host = headers['Host'] || headers['host'] || '';
    if (!host) {
        console.error('No host header found');
        return '';
    }
    
    // Build the URL
    const protocol = 'https';
    const url = `${protocol}://${host}${path}`;
    
    // Build curl command
    let curlCommand = `curl -X ${method} '${url}'`;
    
    // Add headers (excluding host and content-length)
    for (const [headerName, headerValue] of Object.entries(headers)) {
        const lowerHeaderName = headerName.toLowerCase();
        if (lowerHeaderName !== 'host' && lowerHeaderName !== 'content-length') {
            curlCommand += ` \\\n  -H '${headerName}: ${headerValue}'`;
        }
    }
    
    // Add body data if present
    if (body) {
        // Escape single quotes in JSON for shell
        const escapedBody = body.replace(/'/g, "'\\''");
        curlCommand += ` \\\n  -d '${escapedBody}'`;
    }
    
    return curlCommand;
}

/**
 * Check if content contains HTTP method keywords
 * @param {string} content - Content to check
 * @returns {boolean} True if HTTP method found
 */
function checkIfHTTP(content) {
    if (!content || typeof content !== 'string') return false;
    
    const escapedTerms = HTTP_METHODS.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = new RegExp(escapedTerms.join('|'), 'g');
    return !!content.match(regexPattern);
}

/**
 * Iterate through code blocks and copy the first HTTP request as curl
 * @param {HTMLCollectionOf<Element>} wrappedElements - Code elements to search
 * @returns {Promise<boolean>} Success status
 */
async function iterateAndCopyCode(wrappedElements){
    for (let el of wrappedElements){
        const content = el.innerText;
        if (content && checkIfHTTP(content)){
            const curl = httpToCurl(content);
            if (curl) {
                return await writeToClipBoard(curl);
            }
        }
    }
    return false;
}

// Insert CSS styles
const style = document.createElement('style');
style.textContent = `
  .custom-button {
    background-color: #000000;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
    font-weight: 500;
    padding: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: ${COPY_BUTTON_WIDTH};
    height: ${COPY_BUTTON_HEIGHT};
    min-width: ${COPY_BUTTON_WIDTH};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    vertical-align: middle;
    transition: background-color 0.2s ease;
  }
  .custom-button:hover {
    background-color: #404040;
  }
  .custom-button:active {
    background-color: #202020;
  }
  .custom-button.copied {
    background-color: #10b981;
  }
  .custom-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .header-buttons-container {
    display: inline-flex;
    gap: 8px;
    margin-left: 12px;
    align-items: center;
  }
`;
document.head.appendChild(style);

/**
 * Copy text to clipboard with fallback support
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function writeToClipBoard(text) {
    if (!text) {
        console.warn('Attempted to copy empty text to clipboard');
        return false;
    }
    
    try {
        // Modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
            throw new Error('execCommand copy failed');
        }
        
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
}

function checkIfHTTP(content) {
    if (!content || typeof content !== 'string') return false;
    
    const escapedTerms = HTTP_METHODS.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = new RegExp(escapedTerms.join('|'), 'g');
    return !!content.match(regexPattern);
}

/**
 * Add copy button to table row
 * @param {HTMLElement} tableRow - Table row element to add button to
 */
function addCopyButton(tableRow) {
    // Avoid adding duplicate buttons
    if (!tableRow || tableRow.querySelector('.custom-button')) return;
    
    tableRow.style.display = 'flex';
    
    const button = document.createElement("button");
    button.className = "custom-button";
    button.textContent = "copy";
    button.setAttribute('aria-label', 'Copy request as cURL');
    
    button.addEventListener('click', async () => {
        // Prevent multiple clicks
        if (button.disabled) return;
        button.disabled = true;
        
        try {
            const codeBlocks = document.getElementsByTagName("code");
            const success = await iterateAndCopyCode(codeBlocks);
            
            if (success) {
                // Show success feedback
                button.textContent = "✓";
                button.classList.add('copied');
            } else {
                button.textContent = "error";
            }
            
            // Reset after timeout
            setTimeout(() => {
                button.textContent = "copy";
                button.classList.remove('copied');
                button.disabled = false;
            }, BUTTON_TIMEOUT_MS);
        } catch (err) {
            console.error('Failed to copy:', err);
            button.textContent = "error";
            setTimeout(() => {
                button.textContent = "copy";
                button.disabled = false;
            }, BUTTON_TIMEOUT_MS);
        }
    });
    
    tableRow.appendChild(button);
}

// Initialize and add buttons to existing rows
initializeDOMCache();
tableRows.forEach(addCopyButton);

// Debounce function for mutation observer
let mutationTimeout = null;
function debouncedAddButtons(mutations) {
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.matches && node.matches('td.wrapped')) {
                        addCopyButton(node);
                    } else if (node.querySelectorAll) {
                        const newRows = node.querySelectorAll('td.wrapped');
                        newRows.forEach(addCopyButton);
                    }
                }
            });
        });
    }, 100);
}

// Watch for new rows being added
const observer = new MutationObserver(debouncedAddButtons);

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/**
 * Extract request body from HTTP request code block
 * @returns {string} Request body or empty string
 */
function getRequestBody() {
    const codeBlocks = document.getElementsByTagName("code");
    for (let codeBlock of codeBlocks) {
        const content = codeBlock.innerText;
        if (content && checkIfHTTP(content)) {
            const { body } = parseHTTPMessage(content);
            return body;
        }
    }
    return '';
}

/**
 * Extract response body from HTTP response code block
 * @returns {string} Response body or empty string
 */
function getResponseBody() {
    const codeBlocks = document.getElementsByTagName("code");
    let requestIndex = -1;

    // First, find the request code block
    for (let i = 0; i < codeBlocks.length; i++) {
        const content = codeBlocks[i].innerText;
        if (content && checkIfHTTP(content)) {
            requestIndex = i;
            break;
        }
    }

    // If request found, look for response in subsequent blocks
    if (requestIndex >= 0) {
        // Check the next code block (should be HTTP response)
        if (requestIndex + 1 < codeBlocks.length) {
            const responseBlock = codeBlocks[requestIndex + 1];
            const content = responseBlock.innerText;

            if (content && content.trim().startsWith('HTTP/')) {
                const { body } = parseHTTPMessage(content);
                if (body) return body;
            }
        }

        // Check if there's a JSON response in the next code block after HTTP response
        if (requestIndex + 2 < codeBlocks.length) {
            const jsonBlock = codeBlocks[requestIndex + 2];
            const content = jsonBlock.innerText.trim();

            // Check if it's JSON
            if (content.startsWith('{') || content.startsWith('[')) {
                try {
                    // Validate it's proper JSON
                    JSON.parse(content);
                    return content;
                } catch {
                    // Not valid JSON, return as-is
                    return content;
                }
            }
        }
    }

    return '';
}

/**
 * Create and configure a body copy button
 * @param {string} label - Button label
 * @param {Function} getBodyFn - Function to get body content
 * @returns {HTMLButtonElement} Configured button element
 */
function createBodyButton(label, getBodyFn) {
    const button = document.createElement('button');
    button.className = 'custom-button';
    button.textContent = label;
    button.setAttribute('aria-label', `Copy ${label.toLowerCase()}`);
    
    button.addEventListener('click', async () => {
        if (button.disabled) return;
        button.disabled = true;
        
        try {
            const body = getBodyFn();
            if (body) {
                const success = await writeToClipBoard(body);
                if (success) {
                    button.textContent = '✓';
                    button.classList.add('copied');
                } else {
                    button.textContent = 'Error';
                }
            } else {
                button.textContent = 'Empty';
            }
            
            setTimeout(() => {
                button.textContent = label;
                button.classList.remove('copied');
                button.disabled = false;
            }, BUTTON_TIMEOUT_MS);
        } catch (err) {
            console.error('Failed to copy:', err);
            button.textContent = 'Error';
            setTimeout(() => {
                button.textContent = label;
                button.disabled = false;
            }, BUTTON_TIMEOUT_MS);
        }
    });
    
    return button;
}

/**
 * Add header buttons for request/response bodies
 */
function addHeaderButtons() {
    // Find the div with glyphicon-user (IP section)
    const userIcons = document.querySelectorAll('.glyphicon-user');

    for (let icon of userIcons) {
        // Navigate up to find the container: icon -> parent div -> parent div
        const ipDiv = icon.closest('div');
        if (!ipDiv || !ipDiv.parentElement) continue;

        const containerDiv = ipDiv.parentElement;
        if (!containerDiv || !containerDiv.parentElement) continue;

        const mainContainer = containerDiv.parentElement;

        // Check if we've already added buttons using a marker class
        if (mainContainer.classList.contains('taapu-buttons-added')) continue;

        // Mark this container as processed
        mainContainer.classList.add('taapu-buttons-added');

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'header-buttons-container';

        // Create request and response body buttons
        const requestButton = createBodyButton('Req Body', getRequestBody);
        const responseButton = createBodyButton('Res Body', getResponseBody);

        buttonContainer.appendChild(requestButton);
        buttonContainer.appendChild(responseButton);

        // Insert the button container before the IP container
        mainContainer.insertBefore(buttonContainer, containerDiv);
        break;
    }
}

// Add header buttons initially with a delay to ensure DOM is ready
setTimeout(() => {
    addHeaderButtons();
}, HEADER_BUTTON_DELAY_MS);

// Debounce header button additions
let headerMutationTimeout = null;
function debouncedAddHeaderButtons() {
    clearTimeout(headerMutationTimeout);
    headerMutationTimeout = setTimeout(addHeaderButtons, 100);
}

// Watch for new headers being added
const headerObserver = new MutationObserver(debouncedAddHeaderButtons);

headerObserver.observe(document.body, {
    childList: true,
    subtree: true
});
