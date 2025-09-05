const signUpModal = document.querySelector("#sign-up");
const loginModal = document.querySelector("#Login");
const signupForm = document.querySelector("#signup-form");
const loginForm = document.querySelector("#Login-form");

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

function goToLogin() {
  signUpModal.close();
  loginModal.showModal();
}

function goToSignup() {
  loginModal.close();
  signUpModal.showModal();
}

signupForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const userName = this.userName.value;
  const email = this.email.value;
  const password = this.password.value;
  const confirmPassword = this.confirmPassword.value;

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

  try {
    const response = await fetch("http://localhost:8000/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName,
        email,
        password,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('userName', result.user.userName);
      alert(result.message);
      signupForm.reset();
      closeSignupPopup();
      window.location.href = "main.html";
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
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.userName);
      alert(data.message);
      window.location.href = "main.html";
    } else {
      alert(`❌ ${data.error || "Login failed"}`);
    }
  } catch (error) {
    alert("❌ Server error. Please try again later.");
    console.error("Login error:", error);
  }
});

window.onload = () => {
  if (!window.google || !window.google.accounts) {
    console.error("Google Identity Services library not loaded.");
    alert("❌ Google Sign-In is unavailable. Please try again later.");
    return;
  }

  google.accounts.id.initialize({
    client_id: "366121832585-eh7pnpbjpb1gcfrad2j1aa79r0oq7srv.apps.googleusercontent.com",
    callback: handleGoogleResponse,
  });

  const googleSignInButton = document.getElementById("googleSignInButton");
  if (googleSignInButton) {
    google.accounts.id.renderButton(googleSignInButton, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "left",
    });
  } else {
    console.error("Google Sign-In button element not found.");
  }

  const googleSignUpButton = document.getElementById("googleSignUpButton");
  if (googleSignUpButton) {
    google.accounts.id.renderButton(googleSignUpButton, {
      theme: "outline",
      size: "large",
      text: "signup_with",
      shape: "pill",
      logo_alignment: "left",
    });
  } else {
    console.error("Google Sign-Up button element not found.");
  }

  google.accounts.id.prompt();
};

async function handleGoogleResponse(response) {
  try {
    const res = await fetch("http://localhost:8000/api/users/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.userName);
      alert("✅ Google login successful!");
      window.location.href = "main.html";
    } else {
      alert(`❌ Google login failed: ${data.error || "Unknown error"}`);
    }
  } catch (err) {
    alert("❌ Network/server error.");
    console.error("Google login error:", err);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const scrollContainer = document.querySelector('.scroll-container');
  const scrollContent = document.querySelector('.scroll-content');

  if (scrollContainer && scrollContent) {
    const items = Array.from(scrollContent.children);

    while (scrollContent.scrollWidth < scrollContainer.offsetWidth * 2) {
      items.forEach(item => {
        scrollContent.appendChild(item.cloneNode(true));
      });
    }

    function adjustAnimation() {
      const contentWidth = scrollContent.scrollWidth / 2;
      const duration = contentWidth / 50;
      scrollContent.style.animationDuration = `${duration}s`;
    }

    window.addEventListener('resize', adjustAnimation);
    adjustAnimation();
  }
});