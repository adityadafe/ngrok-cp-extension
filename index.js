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
    background-color: black;
    color: white;
    font-family: 'Roboto Mono', monospace;
    font-size: 13px;
    font-weight: bold;
    padding: 6px 7px;
    border: 2px solid white;
    border-radius: 4px;
    box-shadow: 4px 4px 0px white;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 60px;
    min-width: 0;
    display: inline-block;
    margin-left: 8px;
    vertical-align: middle;
  }
  .custom-button:hover {
    background-color: white !important;
    color: black !important;
    box-shadow: 2px 2px 0px black !important;
  }
  .custom-button:active {
    box-shadow: 0 0 0px black !important;
    transform: translate(4px, 4px) !important;
  }
  .custom-button.copied {
    background-color: #10b981 !important;
    border-color: #10b981 !important;
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
