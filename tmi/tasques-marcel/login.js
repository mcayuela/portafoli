// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyD6E87F6-Sj7Z8-Jq9-K-L-M-N-O-P",
    authDomain: "tasques-marcel.firebaseapp.com",
    projectId: "tasques-marcel",
    storageBucket: "tasques-marcel.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const loginContainer = document.getElementById("login-container");
  const mainContent = document.getElementById("main-content");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");

  loginBtn?.addEventListener("click", () => {
    signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
      .catch(error => alert("Error de login: " + error.message));
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (loginContainer) loginContainer.style.display = "none";
      if (mainContent) mainContent.style.display = "block";
    } else {
      if (loginContainer) loginContainer.style.display = "block";
      if (mainContent) mainContent.style.display = "none";
    }
  });
});