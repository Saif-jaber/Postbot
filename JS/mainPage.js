const sidebar = document.querySelector('aside');
const collapseBtn = document.getElementById('collapse-btn');
const collapseIcon = document.getElementById('collapse-icon');
const textarea = document.getElementById('user-textInput');


// button divs or tabs 
const newChatDiv = document.getElementById('newchat-div');
const searchChatDiv = document.getElementById('searchchat-div');
const historyDiv = document.getElementById('history-div');

const newChatIcon = document.getElementById('newChat-img');
const searchChatIcon = document.getElementById('searchChat-img');
const historyIcon = document.getElementById('history-img');

const newChatText = document.getElementById('newChat-txt');
const searchChatText = document.getElementById('searchChat-txt');
const historyText = document.getElementById('history-txt');

// css color : #00c2db for click functions

collapseBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');

  if (sidebar.classList.contains('collapsed')) {
    collapseIcon.src = 'images/sidebar open gray.png';  // <- image for collapsed state
  } else {
    collapseIcon.src = 'images/sidebar close gray.png'; // <- image for expanded state
  }
});

// click function for changing the style of the new chat tab
newChatDiv.addEventListener('click', ()=>{
  newChatIcon.src = 'images/new chat blue.png';
  newChatText.style.color = '#00c2db';

  // other tabs resets
  searchChatIcon.src = 'images/search gray.png';
  searchChatText.style.color = '#ffffff';

  historyIcon.src = 'images/history gray.png';
  historyText.style.color = '#ffffff';

  setTimeout(() => {
    newChatIcon.src = 'images/new chat gray.png';
    newChatText.style.color = '#ffffff';
  }, 300); // 0.3 second delay


  clearInputAndAttachments();
});

// click function for changing the style of the search chats tab
searchChatDiv.addEventListener('click', ()=>{
  searchChatIcon.src = 'images/search blue.png';
  searchChatText.style.color = '#00c2db';

  // other tabs resets
  newChatIcon.src = 'images/new chat gray.png';
  newChatText.style.color = '#ffffff';

  historyIcon.src = 'images/history gray.png';
  historyText.style.color = '#ffffff';
});

// click function for changing the style of the history tab
historyDiv.addEventListener('click', ()=>{
  historyIcon.src = 'images/history blue.png';
  historyText.style.color = '#00c2db';

  // other tabs resets
  newChatIcon.src = 'images/new chat gray.png';
  newChatText.style.color = '#ffffff';

  searchChatIcon.src = 'images/search gray.png';
  searchChatText.style.color = '#ffffff';
});


// function for making the text input div to adjust the height
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto'; // reset height
  textarea.style.height = textarea.scrollHeight + 'px'; // set height to content height
});

// attached files preview function
const fileInput = document.getElementById("attach-button");
const previewContainer = document.getElementById("attachment-preview-container");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Create widget
  const widget = document.createElement("div");
  widget.classList.add("attachment-widget");

  // Add filename
  const fileName = document.createElement("span");
  fileName.textContent = file.name;
  widget.appendChild(fileName);

  // Remove button
  const removeBtn = document.createElement("button");
  removeBtn.classList.add("remove-btn");
  removeBtn.textContent = "✕"; // U+2715 Multiplication X
  removeBtn.addEventListener("click", () => {
    widget.remove();
    fileInput.value = ""; // reset input
  });

  widget.appendChild(removeBtn);
  previewContainer.appendChild(widget);
});

function clearInputAndAttachments() {
  // Clear text input
  const textInput = document.getElementById("user-textInput");
  textInput.value = "";
  textInput.style.height = "auto"; // reset height if auto-resizing

  // Clear attachment previews
  const previewContainer = document.getElementById("attachment-preview-container");
  previewContainer.innerHTML = "";

  // Clear file input value
  const fileInput = document.getElementById("attach-button");
  fileInput.value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const userName = localStorage.getItem("userName") || "User";

  // Change the welcome header text
  const headerText = document.getElementById("header-text");
  if (headerText) headerText.textContent = `Hello ${userName}`;

  // Change the profile section name
  const profileName = document.querySelector(".profile-section h1");
  if (profileName) profileName.textContent = userName;
});
