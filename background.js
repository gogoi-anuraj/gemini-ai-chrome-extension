

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    if (!result.geminiApiKey) {
      chrome.tabs.create({
        url: "options/options.html",
      });
    }
  });
});


// API Key 
async function getGeminiApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["geminiApiKey"], (result) => {
      resolve(result.geminiApiKey || null);
    });
  });
}

//Gemini API Call Function

async function callGeminiAPI(prompt) {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API Key not set. Please go to extension options to set it."
    );
  }

  try {
    const backendUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          }, }),
    });

    if (!response.ok) {
      let errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        errorText =
          errorJson.error || errorJson.message || JSON.stringify(errorJson);
      } catch (e) {
      }
      throw new Error(
        `API Backend Error (${response.status}): ${
          errorText || "Unknown error from backend"
        }`
      );
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Gemini API Error: ${data.error}`);
    }
    // return data.text;
    if (data && data.candidates && data.candidates.length > 0 &&
    data.candidates[0].content && data.candidates[0].content.parts &&
    data.candidates[0].content.parts.length > 0 && data.candidates[0].content.parts[0].text) {
    return data.candidates[0].content.parts[0].text;
} else {
    if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`Gemini API response blocked due to: ${data.promptFeedback.blockReason}`);
    }
    throw new Error("No valid text response found from Gemini API.");
}





  } catch (error) {
    console.error("Error in background script during Gemini API call:", error);
    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      if (error.response && error.response.status && error.response.data) {
        errorMessage = `API Error ${error.response.status}: ${JSON.stringify(
          error.response.data
        )}`;
      } else if (error.status && error.message) {
        errorMessage = `API Error ${error.status}: ${error.message}`;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.details) {
        errorMessage = JSON.stringify(error.details);
      } else {
        errorMessage = JSON.stringify(error);
      }
    } else {
      errorMessage = String(error);
    }

    throw new Error(errorMessage);
  }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CALL_GEMINI_API") {
    callGeminiAPI(message.prompt)
      .then((response) => {
        sendResponse({ success: true, text: response });
      })
      .catch((error) => {
        console.error(
          "Error received from callGeminiAPI and sending to popup:",
          error
        );
        sendResponse({
          success: false,
          error: error.message || "An unknown error occurred during API call.",
        });
      });
    return true;
  }

  else if (message.type === "SUMMARIZE_PAGE") {
    const tabId = message.tabId;
    const summaryType = message.summaryType;

    (async () => {
      try {
        // 1. Send message to content.js in the active tab to get page content
        const contentResponse = await chrome.tabs.sendMessage(tabId, {
          type: "GET_PAGE_CONTENT",
        });

        if (
          !contentResponse ||
          !contentResponse.success ||
          !contentResponse.content ||
          !contentResponse.content.text
        ) {
          throw new Error("Could not extract article text from this page.");
        }

        const pageContent = contentResponse.content.text;
        const maxLength = 20000; // max length for input text to the model
        const truncatedContent =
          pageContent.length > maxLength
            ? pageContent.substring(0, maxLength) + "..."
            : pageContent;

        // prompt based on summaryType
        let prompt;
        switch (summaryType) {
          case "brief":
            prompt = `Provide a brief summary of the following article in 2-3 sentences:\n\n${truncatedContent}`;
            break;
          case "detailed":
            prompt = `Provide a detailed summary of the following article, covering all main points and key details:\n\n${truncatedContent}`;
            break;
          case "bullets":
            prompt = `Summarize the following article in 5-7 key points. Format each point as a line starting with "- " (dash followed by a space). Do not use asterisks or other bullet symbols, only use the dash. Keep each point concise and focused on a single key insight from the article:\n\n${truncatedContent}`;
            break;
          default:
            prompt = `Summarize the following article:\n\n${truncatedContent}`;
        }

        // 2. Call Gemini API with the constructed prompt
        const summaryText = await callGeminiAPI(prompt);

        sendResponse({ success: true, text: summaryText });
      } catch (error) {
        console.error(
          "Error in background script during summarization:",
          error
        );
        sendResponse({
          success: false,
          error: error.message || "Failed to generate summary.",
        });
      }
    })();
    return true;
  }
});


