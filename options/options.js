document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  const saveButton = document.getElementById("save-button");
  const successMessage = document.getElementById("success-message");
  const errorMessage = document.getElementById("error-message");

  // Load saved API key if it exists
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save API key when button is clicked
  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();


    if (!apiKey) {
      errorMessage.textContent = "Please enter your Gemini API Key.";
      errorMessage.style.display = "block";
      return;
    }
    if (apiKey) {
      chrome.storage.sync
        .set({ geminiApiKey: apiKey })
        .then(() => {
          successMessage.style.display = "block";
          setTimeout(() => {
            chrome.tabs.getCurrent((tab) => {
              if (tab) {
                chrome.tabs.remove(tab.id);
              } else {
                window.close();
              }
            });
          }, 1000);
        })
        .catch((error) => {
          console.error("Error saving API key:", error);
          errorMessage.textContent =
            "Failed to save API key. Please try again.";
          errorMessage.style.display = "block";
        });
    }
  });
});
