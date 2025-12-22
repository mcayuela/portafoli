// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
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
  
  // Elements per controlar la visibilitat
  const loginContainer = document.getElementById("login-container");
  const mainContent = document.getElementById("main-content");
  const authLoader = document.getElementById("auth-loader");

  // LOGIN
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        .then(() => {
          if (msg) msg.textContent = "Sessió iniciada.";
        })
        .catch(error => {
          if (msg) msg.textContent = "Error: " + error.message;
        });
    });
  }

  // LOGOUT
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth);
    });
  }

  // ESTAT DE LA SESSIÓ
  onAuthStateChanged(auth, (user) => {
    if (authLoader) authLoader.style.display = "none";
    
    if (user) {
      if (loginContainer) loginContainer.style.display = "none";
      if (mainContent) mainContent.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "block";
    } else {
      if (loginContainer) loginContainer.style.display = "block";
      if (mainContent) mainContent.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  });
});