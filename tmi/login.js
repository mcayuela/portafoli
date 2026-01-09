import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

// Si l'usuari ja està loguejat, el redirigim directament
onAuthStateChanged(auth, (user) => {
    if (user) {
        redirigir();
    }
});

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // L'observador onAuthStateChanged s'encarregarà de redirigir
                console.log("Login correcte");
            })
            .catch((error) => {
                console.error("Error de login:", error);
                alert("Error d'inici de sessió: " + error.message);
            });
    });
}

function redirigir() {
    const urlDesti = sessionStorage.getItem('urlDesti');
    if (urlDesti) {
        sessionStorage.removeItem('urlDesti');
        window.location.href = urlDesti;
    } else {
        // Opcional: Si no hi ha URL de destí (login directe), pots redirigir a l'inventari per defecte
        // window.location.href = "inventari-dispositius/entrega.html";
    }
}