const signUpModal = document.querySelector("#sign-up")
const loginModal = document.querySelector("#Login")

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
function goToLogin(){
    signUpModal.close();
    loginModal.showModal();
}

function goToSignup(){
    loginModal.close();
    signUpModal.showModal();
}

signupForm.addEventListener('submit', async function(event){
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

// 🔽 Add login handler below it:
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
      localStorage.setItem('userName', data.userName);  // <-- save it here
      alert(data.message);
      window.location.href = "main.html";  // Redirect to main page
    } else {
      alert(data.error || "Login failed");
    }
  } catch (error) {
    alert("Server error");
    console.error(error);
  }
});
