
let showResult = false;
let loading = false;
let input = "";
let currentTheme = "light";

let chatHistory = [];


const nav_img = document.getElementById("nav-img");
const newChatBtn = document.getElementById("new-chat-btn");
const themeToggle = document.getElementById("theme-toggle");
const lightImg = document.querySelector("#theme-toggle .light-img");
const darkImg = document.querySelector("#theme-toggle .dark-img");

const greetSection = document.getElementById("greet-section");
const resultSection = document.getElementById("result-section");
const recentPromptDisplay = document.getElementById("recent-prompt-display");
const loader = document.getElementById("loader");
const resultDataDisplay = document.getElementById("result-data-display");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

const copyBtn = document.getElementById("copy-btn");

const summaryTypeSelect = document.getElementById("summary-type");
const summarizeBtn = document.getElementById("summarize-btn");



async function saveChatHistory() {
  try {
    await chrome.storage.local.set({ chatHistory: chatHistory });
    // console.log("chat history saved:", chatHistory);
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
}

async function loadChatHistory() {
  try {
    const result = await chrome.storage.local.get("chatHistory");
    // console.log("chat history loaded:", result.chatHistory);
    return result.chatHistory || [];
  } catch (error) {
    console.error("Error loading chat history:", error);
    return [];
  }
}

function renderChatHistory() {
  resultDataDisplay.innerHTML = "";
  chatHistory.forEach((message) => {
    displayChatMessage(message.role, message.content, false);
  });
}


function applyTheme(theme) {
  currentTheme = theme;
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    lightImg.classList.add("hidden");
    darkImg.classList.remove("hidden");
  } else {
    document.body.classList.remove("dark-mode");
    lightImg.classList.remove("hidden");
    darkImg.classList.add("hidden");
  }
  chrome.storage.local.set({ themeMode: theme });
}

function toggleTheme() {
  applyTheme(currentTheme === "light" ? "dark" : "light");
}


function displayChatMessage(role, content, isTypingPlaceholder = false) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", `${role}-message`);

  if (isTypingPlaceholder) {
    // For typing effect, create an empty span inside, which delayPara will update
    const contentSpan = document.createElement("span");
    messageDiv.appendChild(contentSpan);
    messageDiv.dataset.role = role;
  } else {
    messageDiv.innerHTML = content;
  }

  resultDataDisplay.appendChild(messageDiv);
  resultDataDisplay.scrollTop = resultDataDisplay.scrollHeight;
  return messageDiv;
}

function updateLoadingUI() {
  if (loading) {
    loader.classList.remove("hidden");
    sendButton.disabled = true;
    summarizeBtn.disabled = true;
    copyBtn.disabled = true;
  } else {
    loader.classList.add("hidden");
    sendButton.disabled = false;
    summarizeBtn.disabled = false;
    copyBtn.disabled = false;
  }
}


function updateMainUI() {
  if (showResult) {
    greetSection.classList.add("hidden");
    nav_img.classList.add("hidden");
    resultSection.classList.remove("hidden");
    updateLoadingUI();
  } else {
    greetSection.classList.remove("hidden");
    nav_img.classList.remove("hidden"); // Show nav_img with greet section
    resultSection.classList.add("hidden");
  }
}


function setInputValue(value) {
  input = value;
  userInput.value = input;
}



const delayPara = (targetElement, index, nextWord) => {
    setTimeout(() => {
        // Ensure the element still exists and is visible before appending
        if (targetElement && targetElement.parentNode) {
            targetElement.innerHTML += nextWord;
            resultDataDisplay.scrollTop = resultDataDisplay.scrollHeight;
        }
    }, 75 * index);
  }


// Chat Logic 

async function newChat() {
  loading = false;
  showResult = false;
  chatHistory = [];
  await saveChatHistory();
  resultDataDisplay.innerHTML = "";
  input = "";
  userInput.value = "";
  recentPromptDisplay.textContent = "";
  updateMainUI();
}


async function onSent(promptParam) {
  loading = true;
  showResult = true;
  updateMainUI();

  const userPrompt = promptParam !== undefined ? promptParam : input;
  recentPromptDisplay.textContent = userPrompt;
  setInputValue("");

  // Add user message to history and display it
  chatHistory.push({ role: "user", content: userPrompt });
  displayChatMessage("user", userPrompt);
  await saveChatHistory();


  const modelMessageDiv = displayChatMessage("model", "", true);
  const modelContentSpan = modelMessageDiv.querySelector("span");

  let fullModelResponse = "";
  try {
    const response = await chrome.runtime.sendMessage({
      type: "CALL_GEMINI_API",
      prompt: userPrompt,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to get AI response.");
    }

    loader.classList.add("hidden");

    let responseText = response.text;
   
    let formattedResponse = responseText
      .split("**")
      .map((part, i) => (i % 2 === 1 ? `<b>${part}</b>` : part))
      .join("")
      .split("*")
      .join("<br/>");

    fullModelResponse = formattedResponse;

    // Simulate typing effect into the specific modelContentSpan
    let newResponseArray = formattedResponse.split(" ");
    for (let i = 0; i < newResponseArray.length; i++) {
      const nextWord = newResponseArray[i];
      await delayPara(modelContentSpan, i, nextWord + " ");
    }

  } catch (error) {
    console.error("Error during chat message processing:", error);
    const errorMessage = `Error: ${
      error.message || "An unexpected error occurred."
    }`;
    fullModelResponse = errorMessage;

    if (modelContentSpan) {
      modelContentSpan.innerHTML = errorMessage;
    } else {
      displayChatMessage("model", errorMessage);
    }
    loader.classList.add("hidden");
  } finally {
    if (
      chatHistory.length === 0 ||
      chatHistory[chatHistory.length - 1].role === "user"
    ) {
      chatHistory.push({ role: "model", content: fullModelResponse });
    } else {
      chatHistory[chatHistory.length - 1].content = fullModelResponse;
    }
    await saveChatHistory();
    loading = false;
    updateLoadingUI();

  }
}

//Summarization Logic
summarizeBtn.addEventListener("click", async () => {
  const summaryType = summaryTypeSelect.value;

  await newChat();

  loading = true;
  showResult = true;
  updateMainUI();

  recentPromptDisplay.textContent = `Summarizing page (${summaryType})...`;

  const summaryMessageDiv = displayChatMessage("model", "", true);
  const summaryContentSpan = summaryMessageDiv.querySelector("span");

  let fullSummaryResponse = "";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) {
      throw new Error("No active tab found.");
    }

    const summaryResponse = await chrome.runtime.sendMessage({
      type: "SUMMARIZE_PAGE",
      tabId: tab.id,
      summaryType: summaryType,
    });

    if (summaryResponse.success) {
      let summaryText = summaryResponse.text;
      let formattedSummary = summaryText
        .split("**")
        .map((part, i) => (i % 2 === 1 ? `<b>${part}</b>` : part))
        .join("")
        .split("*")
        .join("<br>")
        .split("-")
        .join("<br/>- ");
      fullSummaryResponse = formattedSummary;
    } else {
      fullSummaryResponse = `Open a blog/Article Page for summary`;
    }

    loader.classList.add("hidden");


    if (summaryContentSpan) {
      summaryContentSpan.innerHTML = fullSummaryResponse;
    } else {
      displayChatMessage("model", fullSummaryResponse);
    }
  } catch (error) {
    console.error("Error during summarization process:", error);
    const errorMessage = `Error: ${
      error.message || "An unexpected error occurred."
    }`;
    fullSummaryResponse = errorMessage;
    if (summaryContentSpan) {
      summaryContentSpan.innerHTML = errorMessage;
    } else {
      displayChatMessage("model", errorMessage);
    }

    loader.classList.add("hidden");
  } finally {
    chatHistory.push({ role: "model", content: fullSummaryResponse });
    await saveChatHistory();
    loading = false;
    updateLoadingUI();
    resultDataDisplay.scrollTop = resultDataDisplay.scrollHeight;
  }
});

// Copy Logic


function copyResultToClipboard() {

  const allMessages = resultDataDisplay.querySelectorAll(".message");
  let textToCopy = "";
  allMessages.forEach((msgDiv) => {
    const text = msgDiv.textContent.trim();
    const role = msgDiv.classList.contains("user-message") ? "User: " : "AI: ";
    textToCopy += `${role}${text}\n\n`; // Add roles and double newlines
  });

  if (textToCopy.trim() !== "") {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 1500);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy text. Please try again.");
      });
  }
}

// Event Listeners

document.addEventListener("DOMContentLoaded", async () => {

  chrome.storage.local.get(["themeMode"], (result) => {
    applyTheme(result.themeMode || "light");
  });

  chatHistory = await loadChatHistory();
  if (chatHistory.length > 0) {
    showResult = true;
    updateMainUI();
    renderChatHistory();
  } else {
    newChat();
  }


  newChatBtn.addEventListener("click", newChat);
  themeToggle.addEventListener("click", toggleTheme);


  userInput.addEventListener("input", (e) => setInputValue(e.target.value));
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Send on Enter, allow Shift+Enter for new line
      e.preventDefault();
      if (input.trim().length > 0) {
        onSent();
      }
    }
  });
  sendButton.addEventListener("click", () => {
    if (input.trim().length > 0) {
      onSent();
    }
  });

  // Copy Button Listener
  copyBtn.addEventListener("click", copyResultToClipboard);

});
