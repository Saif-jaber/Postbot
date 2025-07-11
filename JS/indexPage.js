const signUpModal = document.querySelector("#sign-up")
const loginModal = document.querySelector("#Login")

const signupForm = document.querySelector("#signup-form");

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

//
signupForm.addEventListener('submit', function(event){
    const password = this.password.value; //this gets the value for the name attribute using this
    const confirmPassword = this.confirmPassword.value;
  
    if (password !== confirmPassword) {
      event.preventDefault();  // stop form submission
      alert('Passwords do not match!');
    }

    if(password == ""){
      event.preventDefault();  // stop form submission
      alert('Please fill the Passwords field, it should not be empty!');
    }
});

