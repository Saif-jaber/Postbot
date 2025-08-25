document.addEventListener('DOMContentLoaded', () => {
  const editPfpBtn = document.getElementById('edit-pfp');
  const imageInput = document.getElementById('imageInput');
  const profilePic = document.querySelector('#profilePic-section img');

  // When the "Edit profile picture" button is clicked, open the file picker
  editPfpBtn.addEventListener('click', () => {
    imageInput.click();
  });

  // When a file is selected, update the profile picture
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profilePic.src = e.target.result;  // Change img src to the selected image
      };
      reader.readAsDataURL(file);
    }
  });
});
