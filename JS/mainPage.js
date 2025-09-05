const sidebar = document.querySelector('aside');
const collapseBtn = document.getElementById('collapse-btn');
const collapseIcon = document.getElementById('collapse-icon');
const textarea = document.getElementById('user-textInput');
const fileInput = document.getElementById("attach-button");
const previewContainer = document.getElementById("attachment-preview-container");
const toneSelector = document.getElementById('tone-selector');
const trendingButton = document.getElementById('trending-button');
const hashtagButton = document.getElementById('hashtag-button');

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

const managementModal = document.getElementById("management-modal-container");

let abortController = null;
let isBotTyping = false;       // Flag to track if bot is typing
const messageQueue = [];       // Queue to hold user messages waiting to send
let conversationHistory = [];  // Store conversation history
let selectedTone = 'friendly';  // Default tone
let includeHashtags = false;    // Track hashtag button state
let selectedPlatforms = new Set(); // Track selected platforms

// Fetch user data from backend
async function fetchUserData() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found. Please log in.');
    window.location.href = '/index.html';
    return null;
  }

  try {
    const response = await fetch('http://localhost:8000/api/users/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        window.location.href = '/index.html';
      }
      throw new Error('Failed to fetch user data');
    }

    const user = await response.json();
    return user;
  } catch (err) {
    console.error('Error fetching user data:', err);
    return null;
  }
}

// Open settings and populate Account-section
async function openSettings() {
  managementModal.showModal();

  const user = await fetchUserData();
  if (user) {
    const profileName = document.querySelector('.profile-section h1');
    const profileImage = document.querySelector('.profile-section img');
    if (profileName) profileName.textContent = user.userName || 'Guest';
    if (profileImage) profileImage.src = user.profilePicture || 'images/profile-user.png';

    const userNameLarge = document.getElementById('user-name-large');
    const profilePictureLarge = document.getElementById('profile-picture-large');
    const usernameInput = document.getElementById('username-input');
    const userIDInput = document.getElementById('userID-input');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');

    if (userNameLarge) userNameLarge.textContent = user.userName || 'Guest';
    if (profilePictureLarge) profilePictureLarge.src = user.profilePicture || 'images/profile-user.png';
    if (usernameInput) usernameInput.value = user.userName || '';
    if (userIDInput) userIDInput.value = user.userID || '';
    if (emailInput) emailInput.value = user.email || '';
    if (passwordInput) passwordInput.value = '********';
  } else {
    const profileName = document.querySelector('.profile-section h1');
    const profileImage = document.querySelector('.profile-section img');
    const userNameLarge = document.getElementById('user-name-large');
    const profilePictureLarge = document.getElementById('profile-picture-large');
    const usernameInput = document.getElementById('username-input');
    const userIDInput = document.getElementById('userID-input');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');

    if (profileName) profileName.textContent = 'Guest';
    if (profileImage) profileImage.src = 'images/profile-user.png';
    if (userNameLarge) userNameLarge.textContent = 'Guest';
    if (profilePictureLarge) profilePictureLarge.src = 'images/profile-user.png';
    if (usernameInput) usernameInput.value = '';
    if (userIDInput) userIDInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
  }
}

// Close settings
function closeSettings() {
  managementModal.close();
}

// Profile picture upload
document.getElementById('edit-profilePicture-btn')?.addEventListener('click', async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users/user/profile-picture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload profile picture');

      const data = await response.json();
      document.getElementById('profile-picture-large').src = data.profilePicture;
      document.querySelector('.profile-section img').src = data.profilePicture;
      alert('✅ Profile picture updated!');
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert('❌ Failed to upload profile picture.');
    }
  };
  input.click();
});

// Logout
document.querySelector('.logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  window.location.href = '/index.html';
});

// Update tone when selector changes
toneSelector.addEventListener('change', () => {
  selectedTone = toneSelector.value;
});

// Trending button: Fetch trending topics on click
trendingButton.addEventListener('click', () => {
  const statusDot = trendingButton.querySelector('.trending-dot');
  statusDot.classList.add('flash');
  setTimeout(() => statusDot.classList.remove('flash'), 500);
  messageQueue.push('List the top trending topics on social media right now.');
  processNextMessage();
});

// Hashtag button: Toggle hashtag inclusion
hashtagButton.addEventListener('change', () => {
  includeHashtags = hashtagButton.checked;
});

// Function to toggle send/stop button icon and tooltip
function toggleSendStopButton(isTyping) {
  if (isTyping) {
    sendIcon.src = 'images/stop.png';
    sendIcon.alt = 'Stop';
    sendButton.title = 'Stop generating response';
  } else {
    sendIcon.src = 'images/send white.png';
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
  removeBtn.className = "remove-btn";
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
  conversationHistory = []; // Clear history when starting a new chat
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
  buttonsContainer.style.marginTop = "0";

  // Remove any existing buttons first to avoid duplicates
  const existingButtons = botTextDiv.parentElement.querySelector(".message-buttons");
  if (existingButtons) existingButtons.remove();

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "copy";
  copyBtn.setAttribute("aria-label", "Copy to clipboard");

  const tooltipSpan = document.createElement("span");
  tooltipSpan.className = "tooltip";
  tooltipSpan.textContent = "Copy";

  const iconSpan = document.createElement("span");
  iconSpan.className = "icon-span";
  iconSpan.innerHTML = `
    <svg xml:space="preserve" viewBox="0 0 6.35 6.35" height="20" width="20" class="clipboard" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z"/>
      </g>
    </svg>`;

  copyBtn.appendChild(tooltipSpan);
  copyBtn.appendChild(iconSpan);

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(botTextDiv.textContent)
      .then(() => {
        const originalIcon = iconSpan.innerHTML;
        iconSpan.innerHTML = `
          <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor" class="checkmark-icon">
            <path d="M20.285 6.709l-11.11 11.11-5.47-5.47 1.414-1.414 4.056 4.056 9.697-9.697z"/>
          </svg>
        `;
        copyBtn.style.color = "#4ade80";
        tooltipSpan.style.display = "none";
        copyBtn.blur();
        copyBtn.dispatchEvent(new Event("mouseout"));
        setTimeout(() => {
          iconSpan.innerHTML = originalIcon;
          copyBtn.style.color = "";
          tooltipSpan.style.display = "";
        }, 1500);
      })
      .catch(() => {
        copyBtn.style.color = "red";
        setTimeout(() => copyBtn.style.color = "", 1500);
      });
  };

  // Read aloud button
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
    const utterance = new SpeechSynthesisUtterance(botTextDiv.textContent);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
    speakBtn.blur();
  };

  // Save button (placeholder without functionality)
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

  buttonsContainer.appendChild(copyBtn);
  buttonsContainer.appendChild(speakBtn);
  buttonsContainer.appendChild(saveBtn);

  botTextDiv.parentElement.appendChild(buttonsContainer);
}

// Process next message in queue if any
async function processNextMessage() {
  if (isBotTyping) return;  // Don't start if bot is typing already
  if (messageQueue.length === 0) return;

  const nextMsg = messageQueue.shift();
  await sendMessage(nextMsg);
}

// Modified sendMessage to include hashtags when toggled
async function sendMessage(userInput) {
  if (!userInput) return;

  // Abort ongoing bot reply if any
  if (abortController) {
    abortController.abort();
    const chatContainer = document.getElementById("chat-container");
    const existingThinking = chatContainer.querySelector(".thinking-message");
    if (existingThinking) existingThinking.remove();
    const oldTempMsg = chatContainer.querySelector(".bot-message.temp");
    if (oldTempMsg) {
      const oldButtons = oldTempMsg.querySelectorAll(".message-buttons");
      oldButtons.forEach(btns => btns.remove());
    }
    const partialBotMsg = chatContainer.querySelector(".message.bot-message.temp");
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

  const mainElement = document.querySelector('main');
  if (!mainElement.classList.contains('chat-started')) {
    mainElement.classList.add('chat-started');
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

  const maxHistoryLength = 10;
  if (conversationHistory.length > maxHistoryLength) {
    conversationHistory = conversationHistory.slice(-maxHistoryLength);
  }

  const thinkingMsg = document.createElement("div");
  thinkingMsg.className = "message thinking-message";
  thinkingMsg.innerHTML = `Thinking<span class="thinking-dots"><span></span><span></span><span></span></span>`;
  chatContainer.appendChild(thinkingMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const tempBotMsg = document.createElement("div");
  tempBotMsg.className = "message bot-message temp";
  chatContainer.appendChild(tempBotMsg);

  const botText = document.createElement("div");
  botText.className = "message-text selectable";
  tempBotMsg.appendChild(botText);

  try {
    // Construct the prompt with tone, platforms, and optional hashtag instruction
    const platformsInstruction = selectedPlatforms.size > 0 
      ? `Ignore all previous platform selections mentioned in the conversation history and tailor the response exclusively for the following platforms: ${Array.from(selectedPlatforms).join(', ')}. Adapt any references to previous content in the conversation to fit these current platforms, ensuring relevance to the ongoing discussion.` 
      : 'Ignore all previous platform selections mentioned in the conversation history and provide a general response suitable for any social media platform. Adapt any references to previous content to maintain relevance to the ongoing discussion.';
    const toneInstruction = `Respond in a ${selectedTone} tone.`;
    const hashtagInstruction = includeHashtags 
      ? 'Include relevant hashtags in the response to enhance social media engagement.' 
      : '';
    const promptWithHistory = `${toneInstruction}\n${platformsInstruction}\n${hashtagInstruction}\n\n` + conversationHistory
      .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n") + `\n\nUser: ${userInput}`;
    const response = await fetch("http://localhost:8000/api/gemini/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptWithHistory }),
      signal: abortController.signal,
    });

    const data = await response.json();
    const geminiResponse = data.response || "No response.";

    thinkingMsg.remove();

    await typeText(botText, geminiResponse, abortController.signal);

    conversationHistory.push({ role: "bot", content: geminiResponse });

  } catch (err) {
    thinkingMsg.remove();
    if (err.name === "AbortError") {
      return;
    }
    console.error("API error:", err);
    const errorMsg = document.createElement("div");
    errorMsg.className = "message bot-message";
    errorMsg.textContent = "Error. Please try again.";
    chatContainer.appendChild(errorMsg);
  } finally {
    isBotTyping = false;
    toggleSendStopButton(false);
    textarea.disabled = false;
    processNextMessage();
  }
}

async function typeText(element, text, signal, normal_delay = 10) {
  element.innerHTML = ""; // Clear existing content

  const md = window.markdownit({
    html: false, // Disable raw HTML for safety
    breaks: true, // Convert newlines to <br> for better text flow
    linkify: true, // Autoconvert URLs to links
    typographer: true, // Enable smart quotes and other typographic enhancements
    highlight: function (str, lang) {
      // Optional: Add syntax highlighting for code blocks
      if (lang && window.hljs) {
        try {
          return `<pre class="code-block"><code class="language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="code-block"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  let accumulated = "";
  const length = text.length;
  let delay = normal_delay;
  let switch_point = length; // Default to normal speed

  if (length > 1000) { // Very long reply
    const fast_delay = 5; // Faster speed
    switch_point = Math.floor(length * 0.8); // Switch at 80%
    delay = fast_delay;
  }

  for (let i = 0; i < length; i++) {
    if (signal.aborted) {
      const parent = element.closest(".bot-message");
      if (parent && parent.classList.contains("temp")) {
        parent.classList.remove("temp");
        if (!parent.querySelector(".message-buttons")) {
          addButtonsToBotMessage(element);
        }
      }
      return;
    }

    if (i === switch_point) {
      delay = normal_delay; // Switch to normal speed for the last part
    }

    accumulated += text.charAt(i);
    const dirtyHTML = md.render(accumulated);
    const cleanHTML = DOMPurify.sanitize(dirtyHTML);
    element.innerHTML = `<div class="markdown-content" style="margin-bottom:0;padding-bottom:0;">${cleanHTML}</div>`;
    element.parentElement.scrollIntoView({ behavior: "smooth", block: "end" });
    await new Promise((r) => setTimeout(r, delay));
  }

  const parent = element.closest(".bot-message");
  if (parent && parent.classList.contains("temp")) {
    parent.classList.remove("temp");
    if (!parent.querySelector(".message-buttons")) {
      addButtonsToBotMessage(element);
    }
  }
}

// Textarea keydown handler
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

// Send/Stop button handler
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

// Platform selector logic
const platformButtons = document.querySelectorAll('.platform-btn');
platformButtons.forEach(button => {
  button.addEventListener('click', () => {
    const platform = button.getAttribute('data-social');
    if (selectedPlatforms.has(platform)) {
      selectedPlatforms.delete(platform);
      button.classList.remove('active');
    } else {
      selectedPlatforms.add(platform);
      button.classList.add('active');
    }
  });
});

// On load: set username greeting, check authentication, and ensure text selection
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  const user = await fetchUserData();
  const userName = user ? user.userName : localStorage.getItem("userName") || "User";
  document.getElementById("header-text").textContent = `Hello ${userName}`;
  const profileName = document.querySelector(".profile-section h1");
  if (profileName) profileName.textContent = userName;
  document.addEventListener('selectstart', (e) => {
    if (e.target.closest('.markdown-content') || e.target.closest('.message-text')) {
      e.stopPropagation();
    }
  });
});