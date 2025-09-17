// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Configuració Firebase LOGIN (posa aquí la teva config real)
const firebaseConfig = {
  apiKey: "AIzaSyDqsy5zE7YnUuMt80ZskvvUVFjIiVTdOB8",
  authDomain: "inventari-pc-s.firebaseapp.com",
  projectId: "inventari-pc-s",
  storageBucket: "inventari-pc-s.firebasestorage.app",
  messagingSenderId: "998595234302",
  appId: "1:998595234302:web:d253d36f99d82b549f18af",
  measurementId: "G-0QM2VV5NZD"
};

const loginApp = initializeApp(firebaseConfig, "loginApp");
const auth = getAuth(loginApp);

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const msg = document.getElementById("msg");
  const loginOverlay = document.getElementById("login-overlay");
  const mainContent = document.getElementById("main-content");
  const authLoader = document.getElementById("auth-loader");

  // LOGIN
  loginBtn.onclick = async () => {
    msg.textContent = "";
    authLoader.style.display = "block";
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      msg.textContent = "Sessió iniciada!";
      msg.className = "success";
    } catch (error) {
      msg.textContent = "Error: " + error.message;
      msg.className = "error";
    }
    authLoader.style.display = "none";
  };

  // LOGOUT
  logoutBtn.onclick = async () => {
    await signOut(auth);
    msg.textContent = "Sessió tancada";
    msg.className = "";
  };

  // CONTROL D'ESTAT DE SESSIÓ
  onAuthStateChanged(auth, (user) => {
    if (authLoader) authLoader.style.display = "none";
    if (user) {
      loginOverlay.style.display = "none";
      mainContent.style.display = "";
      document.body.classList.remove("login-mode");
    } else {
      loginOverlay.style.display = "flex";
      mainContent.style.display = "none";
      document.body.classList.add("login-mode");
    }
  });

  // Placeholder flotant robust
  document.querySelectorAll('.float-input').forEach(inp => {
    const toggle = () => {
      inp.classList.toggle('filled', inp.value.trim() !== '');
    };
    inp.addEventListener('input', toggle);
    inp.addEventListener('blur', toggle);
    toggle();
  });

  // Enter per fer login
  emailInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") loginBtn.click();
  });
  passwordInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") loginBtn.click();
  });
});