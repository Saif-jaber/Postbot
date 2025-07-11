const sidebar = document.querySelector('aside');
const collapseBtn = document.getElementById('collapse-btn');
const collapseIcon = document.getElementById('collapse-icon');

collapseBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');

  if (sidebar.classList.contains('collapsed')) {
    collapseIcon.src = 'images/sidebar open gray.png';  // <- image for collapsed state
  } else {
    collapseIcon.src = 'images/sidebar close gray.png'; // <- image for expanded state
  }
});
