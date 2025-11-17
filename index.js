const tableRows = document.querySelectorAll('td.wrapped');
const codeBlocks = document.getElementsByTagName("code");
const HTTP_METHODS = ["GET", "PUT", "POST", "DELETE", "PATCH"];

function httpToCurl(httpString) {
    const lines = httpString.trim().split('\n');
    
    // Parse the first line: METHOD /path HTTP/version
    const requestLine = lines[0].trim();
    const [method, path] = requestLine.split(' ');
    
    // Parse headers and find where body starts
    const headers = {};
    let host = '';
    let bodyStartIndex = -1;
    
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
        
        if (headerName.toLowerCase() === 'host') {
            host = headerValue;
        }
        
        headers[headerName] = headerValue;
    }
    
    // Extract body if present
    let body = '';
    if (bodyStartIndex > 0 && bodyStartIndex < lines.length) {
        body = lines.slice(bodyStartIndex).join('\n').trim();
    }
    
    // Build the URL
    const protocol = 'https';
    const url = `${protocol}://${host}${path}`;
    
    // Build curl command
    let curlCommand = `curl -X ${method} '${url}'`;
    
    // Add headers
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

async function iterateAndCopyCode(wrappedElements){
    for (let el of wrappedElements){
        const content = el.innerText; 
        if(checkIfHTTP(content)){
            const curl = httpToCurl(content);
            return writeToClipBoard(curl);
        }
    }
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
    width: 70px;
    height: 28px;
    min-width: 70px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    vertical-align: middle;
  }
  .custom-button:hover {
    background-color: #404040;
  }
  .custom-button.copied {
    background-color: #10b981;
  }
  .header-buttons-container {
    display: inline-flex;
    gap: 8px;
    margin-left: 12px;
    align-items: center;
  }
`;
document.head.appendChild(style);

async function writeToClipBoard(text) {
    await navigator.clipboard.writeText(text);
}

function checkIfHTTP(content) {
    const escapedTerms = HTTP_METHODS.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = new RegExp(escapedTerms.join('|'), 'g');
    return !!content.match(regexPattern);
}

function addCopyButton(tableRow) {
    // Avoid adding duplicate buttons
    tableRow.style = `display: flex;`

    if (tableRow.querySelector('.custom-button')) return;
    
    const button = document.createElement("button");
    button.className = "custom-button";
    button.textContent = "copy";
    
    button.addEventListener('click', async () => {
        try {
            // Copy immediately (must be synchronous with user click)
            const codeBlocks = document.getElementsByTagName("code");

            setTimeout(async () => {
            await iterateAndCopyCode(codeBlocks);
            
            // Show success feedback
            button.textContent = "✓";
            button.classList.add('copied');
            
            // Reset after 2 seconds
                button.textContent = "copy";
                button.classList.remove('copied');
            }, 200);
        } catch (err) {
            console.error('Failed to copy:', err);
            button.textContent = "error";
            setTimeout(() => {
                button.textContent = "copy";
            }, 2000);
        }
    });
    
    tableRow.appendChild(button);
}

tableRows.forEach(addCopyButton);

// Watch for new rows being added
const observer = new MutationObserver((mutations) => {
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
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Function to extract request body from the page
function getRequestBody() {
    const codeBlocks = document.getElementsByTagName("code");
    for (let codeBlock of codeBlocks) {
        const content = codeBlock.innerText;
        if (checkIfHTTP(content)) {
            const lines = content.trim().split('\n');
            let bodyStartIndex = -1;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) {
                    bodyStartIndex = i + 1;
                    break;
                }
            }

            if (bodyStartIndex > 0 && bodyStartIndex < lines.length) {
                return lines.slice(bodyStartIndex).join('\n').trim();
            }
        }
    }
    return '';
}

// Function to extract response body from the page
function getResponseBody() {
    const codeBlocks = document.getElementsByTagName("code");
    let requestIndex = -1;

    // First, find the request code block
    for (let i = 0; i < codeBlocks.length; i++) {
        const content = codeBlocks[i].innerText;
        if (checkIfHTTP(content)) {
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

            if (content.trim().startsWith('HTTP/')) {
                const lines = content.trim().split('\n');
                let bodyStartIndex = -1;

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) {
                        bodyStartIndex = i + 1;
                        break;
                    }
                }

                if (bodyStartIndex > 0 && bodyStartIndex < lines.length) {
                    return lines.slice(bodyStartIndex).join('\n').trim();
                }
            }
        }

        // Check if there's a JSON response in the next code block after HTTP response
        if (requestIndex + 2 < codeBlocks.length) {
            const jsonBlock = codeBlocks[requestIndex + 2];
            const content = jsonBlock.innerText.trim();

            // Check if it's JSON
            if (content.startsWith('{') || content.startsWith('[')) {
                return content;
            }
        }
    }

    return '';
}

// Function to create header buttons for request/response bodies
function addHeaderButtons() {
    // Find the div with glyphicon-user (IP section)
    const userIcons = document.querySelectorAll('.glyphicon-user');

    for (let icon of userIcons) {
        // Navigate up to find the container: icon -> parent div -> parent div
        const ipDiv = icon.closest('div'); // The div containing the icon
        if (!ipDiv || !ipDiv.parentElement) continue;

        const containerDiv = ipDiv.parentElement; // The FCt2oaamvYnTMfllC2X7 div
        if (!containerDiv || !containerDiv.parentElement) continue;

        const mainContainer = containerDiv.parentElement; // The SQTMcP1EPvWl7g1cwpj0 div

        // Check if we've already added buttons using a marker class
        if (mainContainer.classList.contains('taapu-buttons-added')) continue;

        // Mark this container as processed
        mainContainer.classList.add('taapu-buttons-added');

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'header-buttons-container';

        // Create request body button
        const requestButton = document.createElement('button');
        requestButton.className = 'custom-button';
        requestButton.textContent = 'Req Body';
        requestButton.addEventListener('click', async () => {
            try {
                const body = getRequestBody();
                if (body) {
                    await writeToClipBoard(body);
                    requestButton.textContent = '✓';
                    requestButton.classList.add('copied');
                    setTimeout(() => {
                        requestButton.textContent = 'Req Body';
                        requestButton.classList.remove('copied');
                    }, 2000);
                } else {
                    requestButton.textContent = 'Empty';
                    setTimeout(() => {
                        requestButton.textContent = 'Req Body';
                    }, 2000);
                }
            } catch (err) {
                console.error('Failed to copy:', err);
                requestButton.textContent = 'Error';
                setTimeout(() => {
                    requestButton.textContent = 'Req Body';
                }, 2000);
            }
        });

        // Create response body button
        const responseButton = document.createElement('button');
        responseButton.className = 'custom-button';
        responseButton.textContent = 'Res Body';
        responseButton.addEventListener('click', async () => {
            try {
                const body = getResponseBody();
                if (body) {
                    await writeToClipBoard(body);
                    responseButton.textContent = '✓';
                    responseButton.classList.add('copied');
                    setTimeout(() => {
                        responseButton.textContent = 'Res Body';
                        responseButton.classList.remove('copied');
                    }, 2000);
                } else {
                    responseButton.textContent = 'Empty';
                    setTimeout(() => {
                        responseButton.textContent = 'Res Body';
                    }, 2000);
                }
            } catch (err) {
                console.error('Failed to copy:', err);
                responseButton.textContent = 'Error';
                setTimeout(() => {
                    responseButton.textContent = 'Res Body';
                }, 2000);
            }
        });

        buttonContainer.appendChild(requestButton);
        buttonContainer.appendChild(responseButton);

        // Insert the button container before the IP container
        mainContainer.insertBefore(buttonContainer, containerDiv);
        break;
    }
}

// Add header buttons initially
setTimeout(() => {
    addHeaderButtons();
}, 500);

// Watch for new headers being added
const headerObserver = new MutationObserver(() => {
    addHeaderButtons();
});

headerObserver.observe(document.body, {
    childList: true,
    subtree: true
});
