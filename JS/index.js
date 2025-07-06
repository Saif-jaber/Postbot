const signUpModal = document.querySelector("#sign-up")
const loginModal = document.querySelector("#Login")
// the functions of the signup forms popups opening and closing
function showSignupPopup(){
    signUpModal.showModal();
}

function closeSignupPopup(){
    signUpModal.close();
}

function showLoginPopup(){
    loginModal.showModal();
}

function closeLoginPopup(){
    loginModal.close();
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

