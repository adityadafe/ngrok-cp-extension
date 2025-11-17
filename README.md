# Taapu - ngrok Inspector Helper

A Chrome extension that enhances the ngrok inspect page with convenient copy buttons for API requests, request bodies, and response bodies.

## Features

- **Quick cURL Copy**: Copy any HTTP request as a cURL command with a single click
- **Request Body Copy**: Extract and copy request bodies from HTTP requests
- **Response Body Copy**: Extract and copy response bodies from HTTP responses
- **Modern UI**: Clean, minimalist button design that integrates seamlessly with ngrok's interface
- **Smart Detection**: Automatically detects HTTP requests and responses in code blocks
- **Multiple Host Support**: Works with both `localhost:4040` and `127.0.0.1:4040`

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Navigate to your ngrok inspect page at `http://localhost:4040/inspect/http`

## Usage

### Copy as cURL
Click the "copy" button next to any request to copy it as a cURL command.

### Copy Request/Response Body
Use the "Req Body" and "Res Body" buttons in the header section to quickly copy request or response bodies.

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers supporting Manifest V3

## Technical Details

### Architecture
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Content Script**: Runs at `document_idle` for optimal performance
- **Permissions**: Only clipboard write permission required

### Performance Optimizations
- Debounced mutation observers to prevent excessive DOM operations
- Cached DOM queries for frequently accessed elements
- Efficient button state management to prevent duplicate elements

### Code Quality
- JSDoc comments for all functions
- Input validation and null checks
- Comprehensive error handling with user feedback
- Fallback clipboard API for older browsers

## Security

- No external network requests
- Limited to localhost/127.0.0.1:4040 for maximum security
- No data storage or tracking
- Open source and auditable

## Development

The extension consists of:
- `manifest.json`: Extension configuration
- `index.js`: Main content script
- `assets/images/`: Extension icons

### Key Functions
- `httpToCurl()`: Converts HTTP requests to cURL commands
- `parseHTTPMessage()`: Extracts headers and body from HTTP messages
- `writeToClipBoard()`: Handles clipboard operations with fallback
- `addCopyButton()`: Creates and manages copy buttons
- `addHeaderButtons()`: Adds request/response body buttons

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Aditya Dafe
