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

let abortController = null;

// Collapse sidebar on desktop
collapseBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  collapseIcon.src = isCollapsed
    ? 'images/sidebar open gray.png'
    : 'images/sidebar close gray.png';

  // Adjust main content layout based on sidebar state
  document.querySelector('main').classList.toggle('sidebar-collapsed', isCollapsed);
});


// Mobile sidebar toggle
if (mobileToggleBtn) {
  mobileToggleBtn.setAttribute('aria-expanded', 'false');
  mobileToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent body click handler from immediately closing sidebar
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

// Message sending with abort controller to cancel previous responses
async function sendMessage() {
  const userInput = textarea.value.trim();
  if (!userInput) return;

  // Abort previous request if any
  if (abortController) abortController.abort();
  abortController = new AbortController();

  const mainSection = document.getElementById("main-section");
  const chatContainer = document.getElementById("chat-container");

  if (mainSection && !mainSection.classList.contains("input-sent")) {
    mainSection.classList.add("input-sent");
  }

  // Add the 'chat-started' class to the main section after the first message
  const mainElement = document.querySelector('main');
  if (!mainElement.classList.contains('chat-started')) {
    mainElement.classList.add('chat-started');
  }

  document.getElementById("front-section").style.display = "none";

  // Clear the textarea after the message is sent
  textarea.value = "";
  textarea.style.height = "auto";

  // Append the user message to the chat container
  const userMsg = document.createElement("div");
  userMsg.className = "message user-message";
  userMsg.textContent = userInput;
  chatContainer.appendChild(userMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Thinking message
  const thinkingMsg = document.createElement("div");
  thinkingMsg.className = "message thinking-message";
  thinkingMsg.innerHTML = `Thinking<span class="thinking-dots"><span></span><span></span><span></span></span>`;
  chatContainer.appendChild(thinkingMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const response = await fetch("http://localhost:8000/api/gemini/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userInput }),
      signal: abortController.signal,
    });

    const data = await response.json();
    const geminiResponse = data.response || "No response.";

    // Remove the "thinking" message once the response arrives
    thinkingMsg.remove();

    // Add the bot response to the chat container
    const botMsg = document.createElement("div");
    botMsg.className = "message bot-message";
    chatContainer.appendChild(botMsg);

    // Type the bot's response with a typing effect
    await typeText(botMsg, geminiResponse, abortController.signal);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } catch (err) {
    thinkingMsg.remove();
    if (err.name === 'AbortError') return;
    console.error("API error:", err);
    const errorMsg = document.createElement("div");
    errorMsg.className = "message bot-message";
    errorMsg.textContent = "Error. Please try again.";
    chatContainer.appendChild(errorMsg);
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

// Enter key to send message
textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send button click
document.getElementById("send-button").addEventListener("click", sendMessage);

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
