const sidebar = document.querySelector('aside');
const collapseBtn = document.getElementById('collapse-btn');
const collapseIcon = document.getElementById('collapse-icon');
const textarea = document.getElementById('user-textInput');
const fileInput = document.getElementById("attach-button");
const previewContainer = document.getElementById("attachment-preview-container");

const newChatDiv = document.getElementById('newchat-div');
const searchChatDiv = document.getElementById('searchchat-div');
const historyDiv = document.getElementById('history-div');

const newChatIcon = document.getElementById('newChat-img');
const searchChatIcon = document.getElementById('searchChat-img');
const historyIcon = document.getElementById('history-img');

const newChatText = document.getElementById('newChat-txt');
const searchChatText = document.getElementById('searchChat-txt');
const historyText = document.getElementById('history-txt');

const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');
const body = document.body;

const sendButton = document.getElementById("send-button");
const sendIcon = sendButton.querySelector("img");

let abortController = null;
let isBotTyping = false;       // Flag to track if bot is typing
const messageQueue = [];       // Queue to hold user messages waiting to send

// Function to toggle send/stop button icon and tooltip
function toggleSendStopButton(isTyping) {
  if (isTyping) {
    sendIcon.src = 'images/stop-icon.png';   // <-- Add your stop icon image to images folder
    sendIcon.alt = 'Stop';
    sendButton.title = 'Stop generating response';
  } else {
    sendIcon.src = 'images/send white.png';  // original send icon
    sendIcon.alt = 'Send';
    sendButton.title = 'Send message';
  }
}

// Collapse sidebar on desktop
collapseBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  collapseIcon.src = isCollapsed
    ? 'images/sidebar open gray.png'
    : 'images/sidebar close gray.png';

  document.querySelector('main').classList.toggle('sidebar-collapsed', isCollapsed);
});

// Mobile sidebar toggle
if (mobileToggleBtn) {
  mobileToggleBtn.setAttribute('aria-expanded', 'false');
  mobileToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = sidebar.classList.toggle('open');
    body.classList.toggle('sidebar-open', isOpen);
    mobileToggleBtn.setAttribute('aria-expanded', isOpen.toString());
  });
}

// Close mobile sidebar on clicking outside
document.body.addEventListener('click', (e) => {
  if (sidebar.classList.contains('open')) {
    if (
      !sidebar.contains(e.target) &&
      !mobileToggleBtn.contains(e.target)
    ) {
      sidebar.classList.remove('open');
      body.classList.remove('sidebar-open');
      mobileToggleBtn.setAttribute('aria-expanded', 'false');
    }
  }
});

// Close sidebar when clicking any nav item (mobile UX)
document.querySelectorAll('aside nav ul li div').forEach(item => {
  item.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      body.classList.remove('sidebar-open');
      mobileToggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
});

// Chat tabs button logic (new chat, search, history)
function resetTabIcons() {
  newChatIcon.src = 'images/new chat gray.png';
  newChatText.style.color = '#ffffff';
  searchChatIcon.src = 'images/search gray.png';
  searchChatText.style.color = '#ffffff';
  historyIcon.src = 'images/history gray.png';
  historyText.style.color = '#ffffff';
}

newChatDiv.addEventListener('click', () => {
  resetTabIcons();
  newChatIcon.src = 'images/new chat blue.png';
  newChatText.style.color = '#00c2db';

  setTimeout(() => {
    newChatIcon.src = 'images/new chat gray.png';
    newChatText.style.color = '#ffffff';
  }, 300);

  clearInputAndAttachments();
  clearChat();
  resetLayout();
});

searchChatDiv.addEventListener('click', () => {
  resetTabIcons();
  searchChatIcon.src = 'images/search blue.png';
  searchChatText.style.color = '#00c2db';
});

historyDiv.addEventListener('click', () => {
  resetTabIcons();
  historyIcon.src = 'images/history blue.png';
  historyText.style.color = '#00c2db';
});

// Textarea autosize
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
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
  removeBtn.classList.add("remove-btn");
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => {
    widget.remove();
    if (previewContainer.children.length === 0) {
      fileInput.value = "";
    }
  });

  widget.appendChild(removeBtn);
  previewContainer.appendChild(widget);
});

function clearInputAndAttachments() {
  textarea.value = "";
  textarea.style.height = "auto";
  previewContainer.innerHTML = "";
  fileInput.value = "";
}

function clearChat() {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.innerHTML = "";
  chatContainer.scrollTop = 0;
}

function resetLayout() {
  const frontSection = document.getElementById("front-section");
  if (frontSection) {
    frontSection.style.display = "flex";
    frontSection.style.flexDirection = "column";
    frontSection.style.alignItems = "center";
    frontSection.style.justifyContent = "center";
  }
  const mainSection = document.getElementById("main-section");
  if (mainSection.classList.contains("input-sent")) {
    mainSection.classList.remove("input-sent");
  }
}

// Helper to create and append buttons container to bot message
function addButtonsToBotMessage(botTextDiv) {
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "message-buttons";

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "chat-button";
  copyBtn.innerText = "📋 Copy";
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(botTextDiv.textContent)
      .then(() => {
        copyBtn.innerText = "✅ Copied";
        setTimeout(() => (copyBtn.innerText = "📋 Copy"), 1500);
      })
      .catch(() => {
        copyBtn.innerText = "❌ Failed";
        setTimeout(() => (copyBtn.innerText = "📋 Copy"), 1500);
      });
  };

  // Read aloud button
  const speakBtn = document.createElement("button");
  speakBtn.className = "chat-button";
  speakBtn.innerText = "🔊 Read";
  speakBtn.onclick = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(botTextDiv.textContent);
    speechSynthesis.speak(utterance);
  };

  buttonsContainer.appendChild(copyBtn);
  buttonsContainer.appendChild(speakBtn);

  botTextDiv.parentElement.appendChild(buttonsContainer);
}

// Process next message in queue if any
async function processNextMessage() {
  if (isBotTyping) return;  // Don't start if bot is typing already
  if (messageQueue.length === 0) return;

  const nextMsg = messageQueue.shift();
  await sendMessage(nextMsg);
}

// Modified sendMessage accepts userInput as parameter (so it can be queued)
async function sendMessage(userInput) {
  if (!userInput) return;

  // Abort ongoing bot reply if any, remove temp UI elements except partial message stays
  if (abortController) {
    abortController.abort();

    const chatContainer = document.getElementById("chat-container");
    const existingThinking = chatContainer.querySelector(".thinking-message");
    if (existingThinking) existingThinking.remove();

    // Remove old buttons if any to avoid duplicates
    const oldButtons = chatContainer.querySelectorAll(".message-buttons");
    oldButtons.forEach(btns => btns.remove());

    // Remove 'temp' class from any partial bot message to keep it permanent
    const partialBotMsg = chatContainer.querySelector(".message.bot-message.temp");
    if (partialBotMsg) partialBotMsg.classList.remove("temp");

    // Add buttons immediately after stopping typing
    if (partialBotMsg) {
      const botTextDiv = partialBotMsg.querySelector(".message-text");
      if (botTextDiv && !partialBotMsg.querySelector(".message-buttons")) {
        addButtonsToBotMessage(botTextDiv);
      }
    }
  }
  abortController = new AbortController();

  isBotTyping = true;
  toggleSendStopButton(true); // show stop button
  textarea.disabled = true;   // disable textarea while bot typing

  const mainSection = document.getElementById("main-section");
  const chatContainer = document.getElementById("chat-container");

  if (mainSection && !mainSection.classList.contains("input-sent")) {
    mainSection.classList.add("input-sent");
  }

  const mainElement = document.querySelector('main');
  if (!mainElement.classList.contains('chat-started')) {
    mainElement.classList.add('chat-started');
  }

  document.getElementById("front-section").style.display = "none";

  // Append new user message
  const userMsg = document.createElement("div");
  userMsg.className = "message user-message";
  const userText = document.createElement("div");
  userText.className = "message-text selectable"; // add selectable here
  userText.textContent = userInput;
  userMsg.appendChild(userText);
  chatContainer.appendChild(userMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Add thinking message for new bot reply
  const thinkingMsg = document.createElement("div");
  thinkingMsg.className = "message thinking-message";
  thinkingMsg.innerHTML = `Thinking<span class="thinking-dots"><span></span><span></span><span></span></span>`;
  chatContainer.appendChild(thinkingMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Create temp bot message container and bubble
  const tempBotMsg = document.createElement("div");
  tempBotMsg.className = "message bot-message temp";
  chatContainer.appendChild(tempBotMsg);

  const botText = document.createElement("div");
  botText.className = "message-text selectable";

  tempBotMsg.appendChild(botText);

  try {
    const response = await fetch("http://localhost:8000/api/gemini/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userInput }),
      signal: abortController.signal,
    });

    const data = await response.json();
    const geminiResponse = data.response || "No response.";

    thinkingMsg.remove();

    // Typing effect that respects abort
    await typeText(botText, geminiResponse, abortController.signal);

    // If not aborted, finalize message and add buttons
    if (!abortController.signal.aborted) {
      tempBotMsg.classList.remove("temp");
      addButtonsToBotMessage(botText);
    }

  } catch (err) {
    thinkingMsg.remove();
    if (err.name === "AbortError") {
      // Fetch aborted, no error message needed
      return;
    }
    console.error("API error:", err);
    const errorMsg = document.createElement("div");
    errorMsg.className = "message bot-message";
    errorMsg.textContent = "Error. Please try again.";
    chatContainer.appendChild(errorMsg);
  } finally {
    isBotTyping = false;
    toggleSendStopButton(false);  // back to send button
    textarea.disabled = false;     // enable textarea after bot finished
    processNextMessage();  // Trigger next message in queue after bot reply done
  }
}

async function typeText(element, text, signal, delay = 30) {
  element.textContent = "";
  for (let i = 0; i < text.length; i++) {
    if (signal.aborted) return;
    element.textContent += text.charAt(i);
    await new Promise(r => setTimeout(r, delay));
  }
}

// Modified event handlers to queue messages instead of directly calling sendMessage

textarea.addEventListener("keydown", (e) => {
  if (isBotTyping) {
    // If bot is typing, ignore Enter key for new message
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
    // Stop the bot reply on stop button click
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

// Profile navigation
function GoToProfilePage() {
  window.location.href = "profilePage.html";
}

// On load: set username greeting
document.addEventListener("DOMContentLoaded", () => {
  const userName = localStorage.getItem("userName") || "User";
  document.getElementById("header-text").textContent = `Hello ${userName}`;
  const profileName = document.querySelector(".profile-section h1");
  if (profileName) profileName.textContent = userName;
});
