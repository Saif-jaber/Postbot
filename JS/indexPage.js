const signUpModal = document.querySelector("#sign-up");
const loginModal = document.querySelector("#Login");

const signupForm = document.querySelector("#signup-form");
const loginForm = document.querySelector("#Login-form");

// the functions of the signup forms popups opening and closing
function showSignupPopup() {
  signUpModal.showModal();
  document.body.classList.add("body-lock");
}

function closeSignupPopup() {
  signUpModal.close();
  document.body.classList.remove("body-lock");
}

function showLoginPopup() {
  loginModal.showModal();
  document.body.classList.add("body-lock");
}

function closeLoginPopup() {
  loginModal.close();
  document.body.classList.remove("body-lock");
}

// functions for the links for forms going over other
function goToLogin() {
  signUpModal.close();
  loginModal.showModal();
}

function goToSignup() {
  loginModal.close();
  signUpModal.showModal();
}

signupForm.addEventListener('submit', async function(event) {
  event.preventDefault();  // Prevent default form submission

  const userName = this.name.value;
  const email = this.email.value;
  const password = this.password.value;
  const confirmPassword = this.confirmPassword.value;

  // Validation
  if (password !== confirmPassword) {
    alert('❌ Passwords do not match!');
    return;
  }

  if (password.length < 8) {
    alert('❌ The password should be at least 8 characters long.');
    return;
  }

  if (!userName || !email || !password) {
    alert('❌ All fields are required!');
    return;
  }

  // Send data to backend
  try {
    const response = await fetch("http://localhost:8000/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userName,
        email,
        password
      })
    });

    const result = await response.json();

    if (response.ok) {
      alert("✅ Account created successfully! Now go to login");
      signupForm.reset();
      closeSignupPopup();
      // Optionally: window.location.href = "main.html";
    } else {
      alert(`❌ ${result.error || "Something went wrong."}`);
    }
  } catch (error) {
    console.error("Signup error:", error);
    alert("❌ Server error. Please try again later.");
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  try {
    const response = await fetch("http://localhost:8000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('userName', data.userName);
      alert(data.message);
      window.location.href = "main.html";
    } else {
      alert(data.error || "Login failed");
    }
  } catch (error) {
    alert("Server error");
    console.error(error);
  }
});

window.onload = () => {
  if (!window.google || !window.google.accounts) {
    console.error("Google Identity Services library not loaded.");
    alert("❌ Google Sign-In is unavailable. Please try again later.");
    return;
  }

  google.accounts.id.initialize({
    client_id: "23953043075-tai3f4k8rlkc8edbkc57ot26ajnb15b7.apps.googleusercontent.com", // Replace with your actual Google Client ID
    callback: handleGoogleResponse
  });

  const googleSignInButton = document.getElementById("googleSignInButton");
  if (googleSignInButton) {
    google.accounts.id.renderButton(googleSignInButton, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "left"
    });
  } else {
    console.error("Google Sign-In button element not found.");
  }

  const googleSignUpButton = document.getElementById("googleSignUpButton");
  if (googleSignUpButton) {
    google.accounts.id.renderButton(googleSignUpButton, {
      theme: "outline",
      size: "large",
      text: "signup_with", // Use "signup_with" to indicate sign-up
      shape: "pill",
      logo_alignment: "left"
    });
  } else {
    console.error("Google Sign-Up button element not found.");
  }

  google.accounts.id.prompt();
};

function handleGoogleResponse(response) {
  fetch("http://localhost:8000/api/users/google-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: response.credential })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.userName) {
        localStorage.setItem("userName", data.userName);
        alert("✅ Google login successful!");
        window.location.href = "/main.html";
      } else {
        alert("Google login failed: " + (data.error || "Unknown error"));
      }
    })
    .catch((err) => {
      alert("❌ Network/server error.");
      console.error(err);
    });
}

document.addEventListener('DOMContentLoaded', function () {
  const scrollContainer = document.querySelector('.scroll-container');
  const scrollContent = document.querySelector('.scroll-content');

  if (scrollContainer && scrollContent) {
    const items = Array.from(scrollContent.children);

    // clone until wide enough
    while (scrollContent.scrollWidth < scrollContainer.offsetWidth * 2) {
      items.forEach(item => {
        scrollContent.appendChild(item.cloneNode(true));
      });
    }

    function adjustAnimation() {
      const contentWidth = scrollContent.scrollWidth / 2;
      const duration = contentWidth / 50; // adjust speed
      scrollContent.style.animationDuration = `${duration}s`;
    }

    window.addEventListener('resize', adjustAnimation);
    adjustAnimation();
  }
});