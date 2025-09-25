const sidebar = document.querySelector("aside");
const collapseBtn = document.getElementById("collapse-btn");
const collapseIcon = document.getElementById("collapse-icon");
const textarea = document.getElementById("user-textInput");
const fileInput = document.getElementById("attach-button");
const previewContainer = document.getElementById("attachment-preview-container");
const toneSelector = document.getElementById("tone-selector");
const trendingButton = document.getElementById("trending-button");
const hashtagButton = document.getElementById("hashtag-button");
const generateImageButton = document.getElementById("generate-image-button");
const imageGenModal = document.getElementById("image-generation-modal");
const imagePromptInput = document.getElementById("image-prompt-input");
const aiModelsDropdown = document.getElementById("AI-models-dropdown");
const aspectRatioDropdown = document.getElementById("AspectRatio-dropdown");
const generateImageSubmitBtn = document.getElementById("generate-image-submit-btn");
const closeImageModalBtn = document.getElementById("close-image-modal-btn");

const newChatDiv = document.getElementById("newchat-div");
const searchChatDiv = document.getElementById("searchchat-div");
const historyDiv = document.getElementById("history-div");

const newChatIcon = document.getElementById("newChat-img");
const searchChatIcon = document.getElementById("searchChat-img");
const historyIcon = document.getElementById("history-img");

const newChatText = document.getElementById("newChat-txt");
const searchChatText = document.getElementById("searchChat-txt");
const historyText = document.getElementById("history-txt");

const mobileToggleBtn = document.getElementById("mobile-sidebar-toggle");
const body = document.body;

const sendButton = document.getElementById("send-button");
const sendIcon = sendButton.querySelector("img");

// modal dialogs
const managementModal = document.getElementById("management-modal-container");
const chatSearchModal = document.getElementById("search-chats-modal-container");


const md = window.markdownit();
const DOMPurify = window.DOMPurify;

let abortController = null;
let isBotTyping = false;
const messageQueue = [];
let conversationHistory = [];
let selectedTone = "friendly";
let includeHashtags = false;
let selectedPlatforms = new Set();

let isChatReset = false; // Tracks if "New Chat" was clicked
let currentChatId = null;

// Fetch user data from backend
async function fetchUserData() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found. Please log in.");
    window.location.href = "/index.html";
    return null;
  }

  try {
    const response = await fetch("http://localhost:8000/api/users/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        window.location.href = "/index.html";
      }
      throw new Error("Failed to fetch user data");
    }

    const user = await response.json();
    return user;
  } catch (err) {
    console.error("Error fetching user data:", err);
    return null;
  }
}

// Open settings and populate Account-section
async function openSettings() {
  managementModal.showModal();

  const user = await fetchUserData();
  if (user) {
    const profileName = document.querySelector(".profile-section h1");
    const profileImage = document.querySelector(".profile-section img");
    if (profileName) profileName.textContent = user.userName || "Guest";
    if (profileImage)
      profileImage.src = user.profilePicture || "images/profile-user.png";

    const userNameLarge = document.getElementById("user-name-large");
    const profilePictureLarge = document.getElementById(
      "profile-picture-large"
    );
    const usernameInput = document.getElementById("username-input");
    const userIDInput = document.getElementById("userID-input");
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    if (userNameLarge) userNameLarge.textContent = user.userName || "Guest";
    if (profilePictureLarge)
      profilePictureLarge.src =
        user.profilePicture || "images/profile-user.png";
    if (usernameInput) usernameInput.value = user.userName || "";
    if (userIDInput) userIDInput.value = user.userID || "";
    if (emailInput) emailInput.value = user.email || "";
    if (passwordInput) passwordInput.value = "********";
  } else {
    const profileName = document.querySelector(".profile-section h1");
    const profileImage = document.querySelector(".profile-section img");
    const userNameLarge = document.getElementById("user-name-large");
    const profilePictureLarge = document.getElementById(
      "profile-picture-large"
    );
    const usernameInput = document.getElementById("username-input");
    const userIDInput = document.getElementById("userID-input");
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    if (profileName) profileName.textContent = "Guest";
    if (profileImage) profileImage.src = "images/profile-user.png";
    if (userNameLarge) userNameLarge.textContent = "Guest";
    if (profilePictureLarge)
      profilePictureLarge.src = "images/profile-user.png";
    if (usernameInput) usernameInput.value = "";
    if (userIDInput) userIDInput.value = "";
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
  }
}

// Close settings
function closeSettings() {
  managementModal.close();
}

// Profile picture upload
document
  .getElementById("edit-profilePicture-btn")
  ?.addEventListener("click", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("profilePicture", file);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:8000/api/users/user/profile-picture",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (!response.ok) throw new Error("Failed to upload profile picture");

        const data = await response.json();
        document.getElementById("profile-picture-large").src =
          data.profilePicture;
        document.querySelector(".profile-section img").src =
          data.profilePicture;
        alert("✅ Profile picture updated!");
      } catch (err) {
        console.error("Error uploading profile picture:", err);
        alert("❌ Failed to upload profile picture.");
      }
    };
    input.click();
  });

// Logout
document.querySelector(".logout-btn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  window.location.href = "/index.html";
});

// Update tone when selector changes
toneSelector.addEventListener("change", () => {
  selectedTone = toneSelector.value;
});

// Trending button: Fetch trending topics on click
trendingButton.addEventListener("click", () => {
  const statusDot = trendingButton.querySelector(".trending-dot");
  statusDot.classList.add("flash");
  setTimeout(() => statusDot.classList.remove("flash"), 500);
  messageQueue.push("List the top trending topics on social media right now.");
  processNextMessage();
});

// Hashtag button: Toggle hashtag inclusion
hashtagButton.addEventListener("change", () => {
  includeHashtags = hashtagButton.checked;
});

// Image generation button: Open modal
generateImageButton.addEventListener("click", () => {
  const statusDot = generateImageButton.querySelector(".generate-image-dot");
  statusDot.classList.add("flash");
  setTimeout(() => statusDot.classList.remove("flash"), 500);
  openImageGenModal();
});

// Image generation modal handlers
generateImageSubmitBtn.addEventListener("click", () => {
  const prompt = imagePromptInput.value.trim();
  if (prompt) {
    messageQueue.push({
      type: "image",
      prompt,
      model: aiModelsDropdown.value,
      aspectRatio: aspectRatioDropdown.value,
    });
    processNextMessage();
    closeImageGenModal();
    imagePromptInput.value = "";
  }
});

closeImageModalBtn.addEventListener("click", () => {
  closeImageGenModal();
  imagePromptInput.value = "";
});

// Function to toggle send/stop button icon and tooltip
function toggleSendStopButton(isTyping) {
  if (isTyping) {
    sendIcon.src = "images/stop.png";
    sendIcon.alt = "Stop";
    sendButton.title = "Stop generating response";
  } else {
    sendIcon.src = "images/send white.png";
    sendIcon.alt = "Send";
    sendButton.title = "Send message";
  }
}

// Collapse sidebar on desktop
collapseBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  const isCollapsed = sidebar.classList.contains("collapsed");
  collapseIcon.src = isCollapsed
    ? "images/sidebar open gray.png"
    : "images/sidebar close gray.png";

  document
    .querySelector("main")
    .classList.toggle("sidebar-collapsed", isCollapsed);
});

// Mobile sidebar toggle
if (mobileToggleBtn) {
  mobileToggleBtn.setAttribute("aria-expanded", "false");
  mobileToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = sidebar.classList.toggle("open");
    body.classList.toggle("sidebar-open", isOpen);
    mobileToggleBtn.setAttribute("aria-expanded", isOpen.toString());
  });
}

// Close mobile sidebar on clicking outside
document.body.addEventListener("click", (e) => {
  if (sidebar.classList.contains("open")) {
    if (!sidebar.contains(e.target) && !mobileToggleBtn.contains(e.target)) {
      sidebar.classList.remove("open");
      body.classList.remove("sidebar-open");
      mobileToggleBtn.setAttribute("aria-expanded", "false");
    }
  }
});

// Close sidebar when clicking any nav item (mobile UX)
document.querySelectorAll("aside nav ul li div").forEach((item) => {
  item.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
      body.classList.remove("sidebar-open");
      mobileToggleBtn.setAttribute("aria-expanded", "false");
    }
  });
});

// Chat tabs button logic (new chat, search, history)
function resetTabIcons() {
  newChatIcon.src = "images/new chat gray.png";
  newChatText.style.color = "#ffffff";
  searchChatIcon.src = "images/search gray.png";
  searchChatText.style.color = "#ffffff";
  historyIcon.src = "images/history gray.png";
  historyText.style.color = "#ffffff";
}

newChatDiv.addEventListener("click", async () => {
  console.log("New Chat clicked, aborting generation, isChatReset:", isChatReset);
  resetTabIcons();
  newChatIcon.src = "images/new chat blue.png";
  newChatText.style.color = "#00c2db";

  setTimeout(() => {
    newChatIcon.src = "images/new chat gray.png";
    newChatText.style.color = "#ffffff";
  }, 300);

  // Stop any ongoing generation process
  if (abortController) {
    console.log("Aborting fetch request");
    abortController.abort();
    abortController = null;
  }
  isBotTyping = false;
  isChatReset = true; // Mark chat as reset
  messageQueue.length = 0;
  toggleSendStopButton(false);
  textarea.disabled = false;

  // Remove thinking message and temporary messages
  const chatContainer = document.getElementById("chat-container");
  chatContainer.innerHTML = ""; // Clear all content immediately
  console.log("Chat container cleared");

  // Clear input, attachments, and chat
  clearInputAndAttachments();
  await createNewChat();
  resetLayout();
});

searchChatDiv.addEventListener("click", () => {
  resetTabIcons();
  searchChatIcon.src = "images/search blue.png";
  searchChatText.style.color = "#00c2db";

  chatSearchModal.showModal(); // opens the search chat modal

  setTimeout(() => {
    resetTabIcons();
  },300);
});

historyDiv.addEventListener("click", () => {
  resetTabIcons();
  historyIcon.src = "images/history blue.png";
  historyText.style.color = "#00c2db";
});

// Textarea autosize
textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
});

// File attachment preview
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const widget = document.createElement("div");
  widget.classList.add("attachment-widget");
  const fileName = document.createElement("span");
  fileName.textContent = file.name;
  widget.appendChild(fileName);
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => {
    widget.remove();
    if (previewContainer.children.length === 0) {
      fileInput.value = "";
      previewContainer.classList.remove("active");
    }
  });
  widget.appendChild(removeBtn);
  previewContainer.appendChild(widget);
  previewContainer.classList.add("active");
});

function clearInputAndAttachments() {
  textarea.value = "";
  textarea.style.height = "auto";
  previewContainer.innerHTML = "";
  fileInput.value = "";
  previewContainer.classList.remove("active");
}

function clearChat() {
  console.log("Clearing chat, setting isChatReset to true");
  const chatContainer = document.getElementById("chat-container");
  chatContainer.innerHTML = ""; // Ensure container is cleared
  chatContainer.scrollTop = 0;
  conversationHistory = [];
  isChatReset = true;
}

function resetLayout() {
  console.log("Resetting layout to initial state");
  const frontSection = document.getElementById("front-section");
  if (frontSection) {
    // Clear inline styles to rely on CSS
    frontSection.style.cssText = "";
    frontSection.style.display = "block"; // Use 'block' to match likely initial state, adjust if needed
  }

  const mainSection = document.getElementById("main-section");
  if (mainSection) {
    mainSection.classList.remove("input-sent");
  }

  const mainElement = document.querySelector("main");
  if (mainElement) {
    mainElement.classList.remove("chat-started");
  }

  // Log computed styles for debugging
  if (frontSection) {
    const computedStyles = window.getComputedStyle(frontSection);
    console.log("front-section computed styles after reset:", {
      display: computedStyles.display,
      justifyContent: computedStyles.justifyContent,
      alignItems: computedStyles.alignItems,
      margin: computedStyles.margin,
      padding: computedStyles.padding,
      top: computedStyles.top,
      transform: computedStyles.transform
    });
  }
}

// Helper to create and append buttons container to bot message
function addButtonsToBotMessage(botTextDiv) {
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "message-buttons";
  buttonsContainer.style.marginTop = "0";

  const existingButtons =
    botTextDiv.parentElement.querySelector(".message-buttons");
  if (existingButtons) existingButtons.remove();

  const isImageMessage = !!botTextDiv.querySelector("img");

  const actionBtn = document.createElement("button");
  actionBtn.className = isImageMessage ? "download" : "copy";
  actionBtn.setAttribute(
    "aria-label",
    isImageMessage ? "Download image" : "Copy to clipboard"
  );

  const tooltipSpan = document.createElement("span");
  tooltipSpan.className = "tooltip";
  tooltipSpan.setAttribute(
    "data-text-initial",
    isImageMessage ? "Download" : "Copy"
  );
  tooltipSpan.setAttribute(
    "data-text-end",
    isImageMessage ? "Downloaded!" : "Copied!"
  );

  const iconSpan = document.createElement("span");
  iconSpan.className = "icon-span";
  iconSpan.innerHTML = isImageMessage
    ? `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        <path stroke="none" d="M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 0 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V3a1 1 0 0 1 1-1zM3 15a1 1 0 0 1 1 1v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3a1 1 0 0 1 2 0v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"/>
      </svg>
      <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor" class="checkmark" style="display: none;">
        <path d="M20.285 6.709l-11.11 11.11-5.47-5.47 1.414-1.414 4.056 4.056 9.697-9.697z"/>
      </svg>`
    : `
      <svg xml:space="preserve" viewBox="0 0 6.35 6.35" height="20" width="20" class="clipboard" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="M2.43 .265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z"/>
        </g>
      </svg>
      <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor" class="checkmark" style="display: none;">
        <path d="M20.285 6.709l-11.11 11.11-5.47-5.47 1.414-1.414 4.056 4.056 9.697-9.697z"/>
      </svg>`;

  actionBtn.appendChild(tooltipSpan);
  actionBtn.appendChild(iconSpan);

  actionBtn.onclick = async () => {
    if (isImageMessage) {
      const img = botTextDiv.querySelector("img");
      if (!img) {
        console.error("No image found for download");
        tooltipSpan.textContent = "Error: No image";
        actionBtn.style.color = "#ff0000";
        setTimeout(() => {
          actionBtn.style.color = "";
          tooltipSpan.textContent = "Download";
        }, 1500);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        console.log("Sending download request for imageUrl:", img.src);

        const response = await fetch(
          "http://localhost:8000/api/users/download-image",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ imageUrl: img.src }),
          }
        );

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = "Failed to download image";
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || response.statusText;
          } else {
            errorMessage = `Server returned ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const blob = await response.blob();
        console.log("Blob:", blob.type, blob.size);
        if (blob.size === 0) {
          throw new Error("Empty image data received");
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        actionBtn.classList.add("downloaded");
        // The 'downloaded' class and CSS will handle the visual feedback.
        setTimeout(() => {
          actionBtn.classList.remove("downloaded");
          // The tooltip text will revert automatically via CSS.
        }, 1500);
      } catch (err) {
        console.error("Download failed:", err);
        tooltipSpan.textContent = `Error: ${err.message}`;
        actionBtn.style.color = "#ff0000";
        setTimeout(() => {
          actionBtn.style.color = "";
        }, 1500);
      }
    } else {
      const content = botTextDiv.textContent;
      navigator.clipboard
        .writeText(content)
        .then(() => {
          actionBtn.classList.add("copied");
          iconSpan.querySelector(".checkmark").style.display = "block";
          iconSpan.querySelector(".clipboard").style.display = "none";
          actionBtn.style.color = "#4ade80";
          tooltipSpan.textContent = "Copied!";
          setTimeout(() => {
            actionBtn.classList.remove("copied");
            iconSpan.querySelector(".checkmark").style.display = "none";
            iconSpan.querySelector(".clipboard").style.display = "block";
            actionBtn.style.color = "";
            tooltipSpan.textContent = "Copy";
          }, 1500);
        })
        .catch((err) => {
          console.error("Copy failed:", err);
          tooltipSpan.textContent = "Error";
          actionBtn.style.color = "#ff0000";
          setTimeout(() => {
            actionBtn.style.color = "";
            tooltipSpan.textContent = "Copy";
          }, 1500);
        });
    }
  };

  const speakBtn = document.createElement("button");
  speakBtn.className = "read-button";
  speakBtn.setAttribute("aria-label", "Read aloud");

  speakBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="speaker-icon" viewBox="0 0 24 24">
      <path d="M11 5L6 9H3v6h3l5 4V5z"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a9 9 0 0 1 0 14.14"/>
    </svg>
    <span style="margin-left: 6px;">Read</span>
  `;

  speakBtn.style.width = "auto";
  speakBtn.style.padding = "0 12px";

  speakBtn.onclick = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    const textContent = isImageMessage
      ? `Image generated for prompt: ${botTextDiv.getAttribute("data-prompt") || "unknown"}`
      : botTextDiv.textContent;
    const utterance = new SpeechSynthesisUtterance(textContent);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
    speakBtn.blur();
  };

  const saveBtn = document.createElement("label");
  saveBtn.className = "ui-bookmark";
  saveBtn.setAttribute("aria-label", "Bookmark");

  const saveInput = document.createElement("input");
  saveInput.type = "checkbox";

  const bookmarkSvg = document.createElement("div");
  bookmarkSvg.className = "bookmark";
  bookmarkSvg.innerHTML = `
    <svg viewBox="0 0 32 32" height="20" width="20">
      <path d="M6 2h20v28L16 20 6 30V2z"/>
    </svg>
  `;

  saveBtn.appendChild(saveInput);
  saveBtn.appendChild(bookmarkSvg);

  buttonsContainer.appendChild(actionBtn);
  buttonsContainer.appendChild(speakBtn);
  buttonsContainer.appendChild(saveBtn);

  botTextDiv.parentElement.appendChild(buttonsContainer);
}

async function processNextMessage() {
  if (isBotTyping) return;
  if (messageQueue.length === 0) return;

  const nextItem = messageQueue.shift();
  if (typeof nextItem === "string") {
    await sendMessage(nextItem);
  } else if (nextItem.type === "image") {
    await generateImage(nextItem.prompt, nextItem.model, nextItem.aspectRatio);
  }
}

async function generateImage(prompt, model, aspectRatio) {
  if (!prompt) {
    console.log("No prompt provided, exiting generateImage");
    return;
  }

  console.log("Starting image generation for prompt:", prompt);
  isChatReset = false; // Reset flag at start of generation

  // Clear input and attachments
  clearInputAndAttachments();

  // Check if chat was reset before proceeding
  if (isChatReset) {
    console.log("Chat reset detected, aborting generateImage");
    return;
  }

  if (abortController) {
    console.log("Aborting previous request");
    abortController.abort();
    const chatContainer = document.getElementById("chat-container");
    const existingThinking = chatContainer.querySelector(".thinking-message");
    if (existingThinking) {
      console.log("Removing existing thinking message");
      existingThinking.remove();
    }
    const oldTempMsg = chatContainer.querySelector(".bot-message.temp");
    if (oldTempMsg) {
      console.log("Removing existing temp message");
      oldTempMsg.remove();
    }
  }
  abortController = new AbortController();

  isBotTyping = true;
  toggleSendStopButton(true);
  textarea.disabled = true;

  const mainSection = document.getElementById("main-section");
  const chatContainer = document.getElementById("chat-container");

  if (mainSection && !mainSection.classList.contains("input-sent")) {
    mainSection.classList.add("input-sent");
  }

  const mainElement = document.querySelector("main");
  if (!mainElement.classList.contains("chat-started")) {
    mainElement.classList.add("chat-started");
  }

  document.getElementById("front-section").style.display = "none";

  const userMsg = document.createElement("div");
  userMsg.className = "message user-message";
  const userText = document.createElement("div");
  userText.className = "message-text selectable";
  userText.textContent = `Generate image: ${prompt}`;
  userMsg.appendChild(userText);
  chatContainer.appendChild(userMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  conversationHistory.push({
    role: "user",
    content: `Generate image: ${prompt}`,
  });

  await saveMessage("user", `Generate image: ${prompt}`);

  const maxHistoryLength = 10;
  if (conversationHistory.length > maxHistoryLength) {
    conversationHistory = conversationHistory.slice(-maxHistoryLength);
  }

  // Create the thinking message with SVG animation
  const thinkingMsg = document.createElement("div");
  thinkingMsg.className = "message thinking-message";
  thinkingMsg.setAttribute("aria-label", "Generating image in progress");
  thinkingMsg.innerHTML = `
    <div class="analyze">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        height="54"
        width="54"
      >
        <rect height="24" width="24"></rect>
        <path
          stroke-linecap="round"
          stroke-width="1.5"
          stroke="white"
          d="M19.25 9.25V5.25C19.25 4.42157 18.5784 3.75 17.75 3.75H6.25C5.42157 3.75 4.75 4.42157 4.75 5.25V18.75C4.75 19.5784 5.42157 20.25 6.25 20.25H12.25"
          class="board"
        ></path>
        <path
          d="M9.18748 11.5066C9.12305 11.3324 8.87677 11.3324 8.81234 11.5066L8.49165 12.3732C8.47139 12.428 8.42823 12.4711 8.37348 12.4914L7.50681 12.8121C7.33269 12.8765 7.33269 13.1228 7.50681 13.1872L8.37348 13.5079C8.42823 13.5282 8.47139 13.5714 8.49165 13.6261L8.81234 14.4928C8.87677 14.6669 9.12305 14.6669 9.18748 14.4928L9.50818 13.6261C9.52844 13.5714 9.5716 13.5282 9.62634 13.5079L10.493 13.1872C10.6671 13.1228 10.6671 12.8765 10.493 12.8121L9.62634 12.4914C9.5716 12.4711 9.52844 12.428 9.50818 12.3732L9.18748 11.5066Z"
          class="star-2"
        ></path>
        <path
          d="M11.7345 6.63394C11.654 6.41629 11.3461 6.41629 11.2656 6.63394L10.8647 7.71728C10.8394 7.78571 10.7855 7.83966 10.717 7.86498L9.6337 8.26585C9.41605 8.34639 9.41605 8.65424 9.6337 8.73478L10.717 9.13565C10.7855 9.16097 10.8394 9.21493 10.8647 9.28335L11.2656 10.3667C11.3461 10.5843 11.654 10.5843 11.7345 10.3667L12.1354 9.28335C12.1607 9.21493 12.2147 9.16097 12.2831 9.13565L13.3664 8.73478C13.5841 8.65424 13.5841 8.34639 13.3664 8.26585L12.2831 7.86498C12.2147 7.78571 12.1607 7.78571 12.1354 7.71728L11.7345 6.63394Z"
          class="star-1"
        ></path>
        <path
          class="stick"
          stroke-linejoin="round"
          stroke-width="1.5"
          stroke="white"
          d="M17 14L21.2929 18.2929C21.6834 18.6834 21.6834 19.3166 21.2929 19.7071L20.7071 20.2929C20.3166 20.6834 19.6834 20.6834 19.2929 20.2929L15 16M17 14L15.7071 12.7071C15.3166 12.3166 14.6834 12.3166 14.2929 12.7071L13.7071 13.2929C13.3166 13.6834 13.3166 14.3166 13.7071 14.7071L15 16M17 14L15 16"
        ></path>
      </svg>
    </div>
  `;
  chatContainer.appendChild(thinkingMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    let width, height;
    switch (aspectRatio) {
      case "square":
        width = 1080;
        height = 1080;
        break;
      case "landscape":
        width = 1920;
        height = 1080;
        break;
      case "landscape_large":
        width = 2560;
        height = 1440;
        break;
      case "portrait":
        width = 1080;
        height = 1920;
        break;
      case "portrait_large":
        width = 1440;
        height = 2560;
        break;
      case "default":
      default:
        width = 1920;
        height = 1080;
        break;
    }

    const seed = Date.now();
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${encodeURIComponent(model)}&seed=${seed}`;
    console.log("Loading image from:", imageUrl);

    // Check if chat was reset before loading image
    if (isChatReset) {
      console.log("Chat reset detected, aborting image load");
      thinkingMsg.remove();
      return;
    }

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = `Generated image for: ${prompt}`;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "8px";
    img.style.margin = "0.5em 0";
    img.style.display = "block";

    await new Promise((resolve, reject) => {
      img.onload = () => {
        console.log("Image loaded successfully");
        resolve();
      };
      img.onerror = () => {
        console.error("Image load failed");
        reject(new Error("Failed to load image"));
      };
      // Check for abort signal
      if (abortController.signal.aborted) {
        reject(new Error("Image load aborted"));
      }
    });

    // Check if chat was reset before appending image
    if (isChatReset) {
      console.log("Chat reset detected, skipping image append");
      thinkingMsg.remove();
      return;
    }

    console.log("Appending image to chat container");
    thinkingMsg.remove();

    const tempBotMsg = document.createElement("div");
    tempBotMsg.className = "message bot-message temp";
    chatContainer.appendChild(tempBotMsg);

    const botText = document.createElement("div");
    botText.className = "message-text selectable";
    botText.setAttribute("data-prompt", prompt);
    tempBotMsg.appendChild(botText);

    botText.appendChild(img);
    tempBotMsg.className = "message bot-message";
    addButtonsToBotMessage(botText);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    conversationHistory.push({
      role: "bot",
      content: `[Image generated for: ${prompt}]`,
    });

    await saveMessage("bot", `[Image generated: ${imageUrl}]`);
  } catch (err) {
    if (err.name === "AbortError" || err.message === "Image load aborted") {
      console.log("Image generation aborted");
      thinkingMsg.remove();
      return;
    }
    console.error("Image generation error:", err.message);
    thinkingMsg.remove();
    if (isChatReset) {
      console.log("Chat reset detected, skipping error message");
      return;
    }
    const errorMsg = document.createElement("div");
    errorMsg.className = "message bot-message";
    const errorText = document.createElement("div");
    errorText.className = "message-text selectable";
    errorText.textContent = `Error generating image: ${err.message}. Please try again.`;
    errorMsg.appendChild(errorText);
    chatContainer.appendChild(errorMsg);
    addButtonsToBotMessage(errorText);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } finally {
    console.log("Cleaning up generateImage, resetting states");
    isBotTyping = false;
    toggleSendStopButton(false);
    textarea.disabled = false;
    abortController = null;
    // Do not reset isChatReset here to ensure it persists until next generation
    processNextMessage();
  }
}

async function sendMessage(userInput) {
  if (!userInput) return;

  // Clear input and attachments to prevent any leftover elements
  clearInputAndAttachments();

  if (abortController) {
    abortController.abort();
    const chatContainer = document.getElementById("chat-container");
    const existingThinking = chatContainer.querySelector(".thinking-message");
    if (existingThinking) existingThinking.remove();
    const oldTempMsg = chatContainer.querySelector(".bot-message.temp");
    if (oldTempMsg) {
      const oldButtons = oldTempMsg.querySelectorAll(".message-buttons");
      oldButtons.forEach((btns) => btns.remove());
    }
    const partialBotMsg = chatContainer.querySelector(
      ".message.bot-message.temp"
    );
    if (partialBotMsg) partialBotMsg.classList.remove("temp");
    if (partialBotMsg) {
      const botTextDiv = partialBotMsg.querySelector(".message-text");
      if (botTextDiv && !partialBotMsg.querySelector(".message-buttons")) {
        addButtonsToBotMessage(botTextDiv);
      }
    }
  }
  abortController = new AbortController();

  isBotTyping = true;
  toggleSendStopButton(true);
  textarea.disabled = true;

  const mainSection = document.getElementById("main-section");
  const chatContainer = document.getElementById("chat-container");

  if (mainSection && !mainSection.classList.contains("input-sent")) {
    mainSection.classList.add("input-sent");
  }

  const mainElement = document.querySelector("main");
  if (!mainElement.classList.contains("chat-started")) {
    mainElement.classList.add("chat-started");
  }

  document.getElementById("front-section").style.display = "none";

  const userMsg = document.createElement("div");
  userMsg.className = "message user-message";
  const userText = document.createElement("div");
  userText.className = "message-text selectable";
  userText.textContent = userInput;
  userMsg.appendChild(userText);
  chatContainer.appendChild(userMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  conversationHistory.push({ role: "user", content: userInput });

  await saveMessage("user", userInput);

  const maxHistoryLength = 10;
  if (conversationHistory.length > maxHistoryLength) {
    conversationHistory = conversationHistory.slice(-maxHistoryLength);
  }

  const thinkingMsg = document.createElement("div");
  thinkingMsg.className = "message thinking-message";
  thinkingMsg.innerHTML = `Thinking<span class="thinking-dots"><span></span><span></span><span></span></span>`;
  chatContainer.appendChild(thinkingMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Debug log to check chat-container state before adding bot message
  console.log("Chat container children before adding bot message:", Array.from(chatContainer.children).map(el => el.outerHTML));

  try {
    const platformsInstruction =
      selectedPlatforms.size > 0
        ? `Ignore all previous platform selections mentioned in the conversation history and tailor the response exclusively for the following platforms: ${Array.from(selectedPlatforms).join(", ")}. Adapt any references to previous content in the conversation to fit these current platforms, ensuring relevance to the ongoing discussion.`
        : "Ignore all previous platform selections mentioned in the conversation history and provide a general response suitable for any social media platform. Adapt any references to previous content to maintain relevance to the ongoing discussion.";
    const toneInstruction = `Respond in a ${selectedTone} tone.`;
    const hashtagInstruction = includeHashtags
      ? "Include relevant hashtags in the response to enhance social media engagement."
      : "";
    const formattingInstruction = "Format your response beautifully using markdown for optimal readability, similar to ChatGPT's style. Use headings (e.g., ## Heading), bold (**bold**) and italic (*italic*) text, bulleted or numbered lists, code blocks (```language\ncode\n```), blockquotes (> quote), and horizontal rules (---) where appropriate to structure the content clearly. Ensure paragraphs are separated properly, and avoid clutter. Make the response concise, engaging, and visually appealing.";
    const promptWithHistory =
      `${formattingInstruction}\n${toneInstruction}\n${platformsInstruction}\n${hashtagInstruction}\n\n` +
      conversationHistory
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n\n") +
      `\n\nUser: ${userInput}`;
    const response = await fetch("http://localhost:8000/api/gemini/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptWithHistory }),
      signal: abortController.signal,
    });

    const data = await response.json();
    const geminiResponse = data.response || "No response.";

    thinkingMsg.remove();

    const tempBotMsg = document.createElement("div");
    tempBotMsg.className = "message bot-message temp";
    chatContainer.appendChild(tempBotMsg);

    const botText = document.createElement("div");
    botText.className = "message-text selectable";
    tempBotMsg.appendChild(botText);

    // Debug log after adding tempBotMsg
    console.log("Added tempBotMsg:", tempBotMsg.outerHTML);

    await typeText(botText, geminiResponse, abortController.signal);

    tempBotMsg.classList.remove("temp");
    addButtonsToBotMessage(botText);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    conversationHistory.push({ role: "bot", content: geminiResponse });

    await saveMessage("bot", geminiResponse);

    // Update chat title if this is the first message
    if (conversationHistory.length === 2 && conversationHistory[0].role === "user") { // First user and first bot
      await updateChatTitle(userInput.substring(0, 50) + (userInput.length > 50 ? "..." : ""));
    }
  } catch (err) {
    thinkingMsg.remove();
    if (err.name === "AbortError") {
      return;
    }
    console.error("API error:", err);
    const errorMsg = document.createElement("div");
    errorMsg.className = "message bot-message";
    const errorText = document.createElement("div");
    errorText.className = "message-text selectable";
    errorText.textContent = "Error. Please try again.";
    errorMsg.appendChild(errorText);
    chatContainer.appendChild(errorMsg);
    addButtonsToBotMessage(errorText);
  } finally {
    isBotTyping = false;
    toggleSendStopButton(false);
    textarea.disabled = false;
    processNextMessage();
  }
}

async function typeText(element, text, signal, line_delay = 200) {
  element.innerHTML = "";

  // Create a container for the typing animation
  const markdownContent = document.createElement("div");
  markdownContent.className = "markdown-content";
  element.appendChild(markdownContent);

  // Initialize markdownit with your existing configuration
  const md = window.markdownit({
    html: false,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      if (lang && window.hljs) {
        try {
          const highlighted = hljs.highlight(str, { language: lang }).value;
          return `<pre class="code-block-container"><div class="code-block-header"><span class="code-language">${lang || 'Code'}</span><div class="code-block-controls"><button class="code-copy-btn" aria-label="Copy code"><span>Copy</span></button><button class="code-collapse-btn" aria-label="Collapse code"><span>Collapse</span></button></div></div><code class="language-${lang} code-block-content">${highlighted}</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="code-block-container"><div class="code-block-header"><span class="code-language">Code</span><div class="code-block-controls"><button class="code-copy-btn" aria-label="Copy code"><span>Copy</span></button><button class="code-collapse-btn" aria-label="Collapse code"><span>Collapse</span></button></div></div><code class="code-block-content">${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  // Customize link rendering
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const targetIndex = token.attrIndex("target");
    if (targetIndex < 0) {
      token.attrPush(["target", "_blank"]);
    } else {
      token.attrs[targetIndex][1] = "_blank";
    }
    const relIndex = token.attrIndex("rel");
    if (relIndex < 0) {
      token.attrPush(["rel", "noopener noreferrer"]);
    } else {
      token.attrs[relIndex][1] = "noopener noreferrer";
    }
    return self.renderToken(tokens, idx, options);
  };

  // Pre-render the full markdown to HTML
  const fullHTML = DOMPurify.sanitize(md.render(text), {
    ADD_ATTR: ["target", "rel"],
    ALLOWED_TAGS: [
      "p",
      "br",
      "b",
      "i",
      "strong",
      "em",
      "a",
      "ul",
      "ol",
      "li",
      "pre",
      "code",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "div",
      "span",
      "button",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "aria-label", "style"],
  });

  // Create a temporary container to parse the HTML
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = fullHTML;

  // Extract block-level elements as "lines"
  const blockElements = Array.from(tempContainer.children).filter(node =>
    ["P", "UL", "OL", "PRE", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6", "TABLE", "HR"].includes(node.tagName)
  );

  // Handle case where there are no block elements
  if (blockElements.length === 0) {
    markdownContent.innerHTML = fullHTML;
    return finalizeMessage(element, markdownContent);
  }

  // Type out each block element with delay
  let currentLineIndex = 0;
  const totalLines = blockElements.length;
  const fast_delay = 100;
  const switch_point = totalLines > 10 ? Math.floor(totalLines * 0.8) : totalLines;

  while (currentLineIndex < totalLines) {
    if (signal.aborted) {
      return finalizeMessage(element, markdownContent);
    }

    // Update delay at switch point
    const delay = currentLineIndex < switch_point ? fast_delay : line_delay;

    // Append the current block element
    const block = blockElements[currentLineIndex];
    const clonedBlock = block.cloneNode(true);
    markdownContent.appendChild(clonedBlock);

    // Add event listeners to code block controls
    if (clonedBlock.classList.contains("code-block-container")) {
      const copyBtn = clonedBlock.querySelector(".code-copy-btn");
      const collapseBtn = clonedBlock.querySelector(".code-collapse-btn");
      const codeContent = clonedBlock.querySelector(".code-block-content");

      if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
          const codeText = codeContent.textContent;
          try {
            await navigator.clipboard.writeText(codeText);
            copyBtn.querySelector("span").textContent = "Copied!";
            copyBtn.style.color = "#4ade80";
            setTimeout(() => {
              copyBtn.querySelector("span").textContent = "Copy";
              copyBtn.style.color = "";
            }, 1500);
          } catch (err) {
            console.error("Copy failed:", err);
            copyBtn.querySelector("span").textContent = "Error";
            copyBtn.style.color = "#ff0000";
            setTimeout(() => {
              copyBtn.querySelector("span").textContent = "Copy";
              copyBtn.style.color = "";
            }, 1500);
          }
        });
      }

      if (collapseBtn && codeContent) {
        collapseBtn.addEventListener("click", () => {
          const isCollapsed = codeContent.style.display === "none";
          codeContent.style.display = isCollapsed ? "block" : "none";
          collapseBtn.setAttribute("aria-label", isCollapsed ? "Collapse code" : "Expand code");
          collapseBtn.querySelector("span").textContent = isCollapsed ? "Collapse" : "Expand";
        });
      }
    }

    // Reapply syntax highlighting for code blocks
    markdownContent.querySelectorAll("pre code").forEach((block) => {
      if (window.hljs) {
        hljs.highlightElement(block);
      }
    });

    // Scroll to the latest content
    element.parentElement.scrollIntoView({ behavior: "smooth", block: "end" });
    currentLineIndex++;

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Ensure final content is correct
  markdownContent.innerHTML = fullHTML;

  // Reattach event listeners to all code blocks in final content
  markdownContent.querySelectorAll(".code-block-container").forEach((container) => {
    const copyBtn = container.querySelector(".code-copy-btn");
    const collapseBtn = container.querySelector(".code-collapse-btn");
    const codeContent = container.querySelector(".code-block-content");

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const codeText = codeContent.textContent;
        try {
          await navigator.clipboard.writeText(codeText);
          copyBtn.querySelector("span").textContent = "Copied!";
          copyBtn.style.color = "#4ade80";
          setTimeout(() => {
            copyBtn.querySelector("span").textContent = "Copy";
            copyBtn.style.color = "";
          }, 1500);
        } catch (err) {
          console.error("Copy failed:", err);
          copyBtn.querySelector("span").textContent = "Error";
          copyBtn.style.color = "#ff0000";
          setTimeout(() => {
            copyBtn.querySelector("span").textContent = "Copy";
            copyBtn.style.color = "";
          }, 1500);
        }
      });
    }

    if (collapseBtn && codeContent) {
      collapseBtn.addEventListener("click", () => {
        const isCollapsed = codeContent.style.display === "none";
        codeContent.style.display = isCollapsed ? "block" : "none";
        collapseBtn.setAttribute("aria-label", isCollapsed ? "Collapse code" : "Expand code");
        collapseBtn.querySelector("span").textContent = isCollapsed ? "Collapse" : "Expand";
      });
    }
  });

  // Reapply syntax highlighting for final content
  markdownContent.querySelectorAll("pre code").forEach((block) => {
    if (window.hljs) {
      hljs.highlightElement(block);
    }
  });

  await finalizeMessage(element, markdownContent);

  async function finalizeMessage(element, markdownContent) {
    // Finalize the message
    const parent = element.closest(".bot-message");
    if (parent && parent.classList.contains("temp")) {
      parent.classList.remove("temp");
      if (!parent.querySelector(".message-buttons")) {
        addButtonsToBotMessage(element);
      }
    }

    // Scroll to the end
    element.parentElement.scrollIntoView({ behavior: "smooth", block: "end" });
  }
}

textarea.addEventListener("keydown", (e) => {
  if (isBotTyping) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
    return;
  }
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const userInput = textarea.value.trim();
    if (userInput) {
      messageQueue.push(userInput);
      processNextMessage();
      textarea.value = "";
      textarea.style.height = "auto";
    }
  }
});

sendButton.addEventListener("click", () => {
  if (isBotTyping) {
    if (abortController) abortController.abort();
  } else {
    const userInput = textarea.value.trim();
    if (userInput) {
      messageQueue.push(userInput);
      processNextMessage();
      textarea.value = "";
      textarea.style.height = "auto";
    }
  }
});

const platformButtons = document.querySelectorAll(".platform-btn");
platformButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const platform = button.getAttribute("data-social");
    if (selectedPlatforms.has(platform)) {
      selectedPlatforms.delete(platform);
      button.classList.remove("active");
    } else {
      selectedPlatforms.add(platform);
      button.classList.add("active");
    }
  });
});

// New functions for chat saving and loading

async function loadChats() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:8000/api/chats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to load chats");

    const chats = await response.json();
    const historyScroll = document.querySelector(".chat-history-scroll");
    historyScroll.innerHTML = "";

    chats.forEach((chat) => {
      const tab = document.createElement("div");
      tab.className = "chat-tab";
      tab.dataset.chatId = chat._id;
      tab.textContent = chat.title || `Chat ${new Date(chat.createdAt).toLocaleDateString()}`;
      tab.addEventListener("click", () => loadChat(chat._id));
      historyScroll.appendChild(tab);
    });

    // Load the most recent chat by default if exists
    if (chats.length > 0) {
      loadChat(chats[0]._id);
    }
  } catch (err) {
    console.error("Error loading chats:", err);
  }
}

async function loadChat(chatId) {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`http://localhost:8000/api/chats/${chatId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to load chat");

    const chat = await response.json();
    currentChatId = chat._id;
    clearChat();

    chat.messages.forEach((msg) => {
      const msgDiv = document.createElement("div");
      msgDiv.className = `message ${msg.role}-message`;
      const textDiv = document.createElement("div");
      textDiv.className = "message-text selectable";

      // If it's an image message, parse and display image
      if (msg.content.startsWith("[Image generated:")) {
        const imageUrl = msg.content.match(/\[Image generated: (.*)\]/)?.[1];
        if (imageUrl) {
          const img = document.createElement("img");
          img.src = imageUrl;
          img.alt = "Generated image";
          img.style.maxWidth = "100%";
          img.style.height = "auto";
          img.style.borderRadius = "8px";
          img.style.margin = "0.5em 0";
          img.style.display = "block";
          textDiv.appendChild(img);
        } else {
          textDiv.textContent = msg.content;
        }
      } else {
        const md = window.markdownit(); // Assume md is defined
        textDiv.innerHTML = `<div class="markdown-content">${md.render(msg.content)}</div>`;
      }

      msgDiv.appendChild(textDiv);
      if (msg.role === "bot") addButtonsToBotMessage(textDiv);
      document.getElementById("chat-container").appendChild(msgDiv);
    });

    document.getElementById("chat-container").scrollTop = document.getElementById("chat-container").scrollHeight;

    // Update conversation history
    conversationHistory = chat.messages.map((m) => ({ role: m.role, content: m.content }));
  } catch (err) {
    console.error("Error loading chat:", err);
  }
}

async function createNewChat() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:8000/api/chats", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "New Chat" }), // Initial title
    });

    if (!response.ok) throw new Error("Failed to create new chat");

    const data = await response.json();
    currentChatId = data.chatId || data._id;
    clearChat();
    await loadChats(); // Refresh history
  } catch (err) {
    console.error("Error creating new chat:", err);
  }
}

async function saveMessage(role, content) {
  const token = localStorage.getItem("token");
  if (!token || !currentChatId) return;

  try {
    const response = await fetch(`http://localhost:8000/api/chats/${currentChatId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role, content }),
    });

    if (!response.ok) throw new Error("Failed to save message");
  } catch (err) {
    console.error("Error saving message:", err);
  }
}

async function updateChatTitle(title) {
  const token = localStorage.getItem("token");
  if (!token || !currentChatId) return;

  try {
    const response = await fetch(`http://localhost:8000/api/chats/${currentChatId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) throw new Error("Failed to update chat title");
    await loadChats(); // Refresh history to show new title
  } catch (err) {
    console.error("Error updating chat title:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/index.html";
    return;
  }

  const user = await fetchUserData();
  const userName = user
    ? user.userName
    : localStorage.getItem("userName") || "User";
  document.getElementById("header-text").textContent = `Hello ${userName}`;
  const profileName = document.querySelector(".profile-section h1");
  if (profileName) profileName.textContent = userName;
  document.addEventListener("selectstart", (e) => {
    if (
      e.target.closest(".markdown-content") ||
      e.target.closest(".message-text")
    ) {
      e.stopPropagation();
    }
  });

  // Load chats on startup
  await loadChats();
});

function openImageGenModal() {
  imageGenModal.showModal();
}

function closeImageGenModal() {
  imageGenModal.close();
}


function closeSearchChatsModal() {
  chatSearchModal.close();
}