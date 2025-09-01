// ==============================
// Configuració de Firebase
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAfukNNktawfNYdPAspAfRryWs-qumSagk",
  authDomain: "calendari-marcel.firebaseapp.com",
  projectId: "calendari-marcel",
  storageBucket: "calendari-marcel.firebasestorage.app",
  messagingSenderId: "189232901291",
  appId: "1:189232901291:web:569809dfc077033dcbdbee",
  measurementId: "G-BTGTJQFCR3"
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
  const authLoader = document.getElementById("auth-loader");

  // Amaga tot al principi
  loginContainer.style.display = "none";
  mainContent.style.display = "none";
  if (authLoader) authLoader.style.display = "block";

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
    if (authLoader) authLoader.style.display = "none";
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