// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
// Configuració Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDqsy5zE7YnUuMt80ZskvvUVFjIiVTdOB8",
    authDomain: "inventari-pc-s.firebaseapp.com",
    projectId: "inventari-pc-s",
    storageBucket: "inventari-pc-s.firebasestorage.app",
    messagingSenderId: "998595234302",
    appId: "1:998595234302:web:d253d36f99d82b549f18af",
    measurementId: "G-0QM2VV5NZD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const msg = document.getElementById("msg");
const loginContainer = document.getElementById("login-container");
const mainContent = document.getElementById("main-content");

// LOGIN
loginBtn.addEventListener("click", () => {
signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(userCredential => {
        msg.textContent = "Sessió iniciada com " + userCredential.user.email;
    })
    .catch(error => {
        msg.textContent = "Error: " + error.message;
    });
});

// LOGOUT
logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
    msg.textContent = "Sessió tancada";
    });
});

// CONTROL D'ESTAT DE SESSIÓ
onAuthStateChanged(auth, (user) => {
    if (user) {
        msg.textContent = "Connectat com: " + user.email;
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        loginContainer.style.display = "none";
        mainContent.style.display = "";
    } else {
        msg.textContent = "No hi ha cap sessió activa";
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        loginContainer.style.display = "";
        mainContent.style.display = "none";
    }
});
    emailInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") loginBtn.click();
    });
    passwordInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") loginBtn.click();
    });
});