
# Gemini AI Chrome Extension

A conversational AI Chrome Extension that allows users to chat with the Gemini AI model and summarize web page content, all while maintaining chat history across sessions and supporting dark mode.


## Features

- AI Chat: Engage in real-time conversations with the Gemini AI model directly from your browser extension popup.

- Web Page Summarization: Get quick summaries (brief, detailed, or bullet points) of the active web page's content.

- Persistent Chat History: Your conversations are saved locally using chrome.storage.local, so they persist even if you close and reopen the extension or your browser.

- Theming (Light/Dark Mode): Toggle between light and dark modes to suit your preference, with the theme setting also persisting across sessions.

- Typing Animation: Enjoy a smooth typing effect for AI responses, mimicking a natural conversation flow.

- Copy to Clipboard: Easily copy the entire chat history or summary to your clipboard.

- API Key Management: Securely store your Gemini API key in the extension's options page.


## Technologies used

* HTML5: For the structure of the extension popup.

* CSS3: For styling and responsive layout, including flexbox for dynamic content sizing and dark mode.

* JavaScript (ES6+): For all the interactive logic, API calls, DOM manipulation, and chrome.storage integration.

* Chrome Extension APIs:

   * chrome.runtime: For messaging between popup and background scripts.

   * chrome.tabs: For querying active tabs (used in summarization).

   * chrome.storage: For persisting chat history and theme preferences.

   * chrome.scripting: (Implicitly used by background.js to run content script logic).

* Google Gemini API (gemini-2.0-flash): The large language model powering the AI responses and summarization.


## Installation

To install this extension in your Chrome browser:

1. Download the project: Clone or download this repository to your local machine.

2. Open Chrome Extensions page:

 - Open Chrome browser.

 - Type chrome://extensions in the address bar and press Enter.

- Alternatively, go to Menu (⋮) > More tools > Extensions.

3. Enable Developer Mode:

In the top-right corner of the Extensions page, toggle on "Developer mode".

4. Load the unpacked extension:

 * Click the "Load unpacked" button that appears.

* Navigate to the directory where you downloaded/cloned the project.

* Select the root folder of the extension (the folder containing manifest.json, popup.html, popup.css, popup.js, etc.) and click "Select Folder".

5. Pin the extension (Optional but Recommended):

* Click the puzzle piece icon (Extensions icon) in your Chrome toolbar.

* Find "Gemini Chat Extension" (or your chosen name) and click the pin icon next to it to make it easily accessible in your toolbar.

6. Set your Gemini API Key:

* The first time you install, an options page should automatically open. If not, go back to chrome://extensions, find your extension, click "Details", and then "Extension options".

* Enter your Gemini API Key (get one from Google AI Studio or Google Cloud Console).

* Click "Save API Key".
    
## Usage

1. Open the Extension: Click on the extension icon in your Chrome toolbar.

2. Start a Chat:

* If it's your first time or you clicked "New Chat", you'll see a greeting.

* Type your prompt in the input box at the bottom and press Enter or click the send button.

* Your message will appear, followed by Gemini's response with a typing animation.

3. Summarize a Page:

* Navigate to any article or blog page you want to summarize.

* Open the extension popup.

* Select a summary type (Brief, Detailed, Bullet) from the dropdown.

* Click "Summarize Article Page". Gemini will provide a summary of the current page.

4. New Chat: Click the "+" icon in the sidebar to clear the current conversation and start a fresh one.

5. Toggle Theme: Click the moon/sun icon in the sidebar to switch between light and dark modes.

6. Copy Content: Click the "Copy" button to copy the displayed chat messages/summary to your clipboard.

