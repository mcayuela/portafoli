// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

const COLLECCIO_ENTREGUES = "entregues";

let entregaActual = null;

// Elements del DOM
let globalLoader, loading, content, error, entregaTitol;

// FUNCIONS DEL LOADER
function mostrarLoader() {
    if (globalLoader) globalLoader.classList.remove('hidden');
}

function amagarLoader() {
    if (globalLoader) globalLoader.classList.add('hidden');
}

// Inicialització quan el DOM està carregat
document.addEventListener('DOMContentLoaded', () => {
    globalLoader = document.getElementById('global-loader');
    loading = document.getElementById('loading');
    content = document.getElementById('content');
    error = document.getElementById('error');
    entregaTitol = document.getElementById('entrega-titol');

    mostrarLoader();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuari autenticat:", user.email);
            carregarEntrega();
        } else {
            amagarLoader();
            mostrarModalLogin();
        }
    });
});

function mostrarModalLogin() {
    const modal = document.createElement('div');
    modal.className = 'modal-login';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Inicia sessió per veure l'entrega</h3>
            <input type="email" id="login-email" placeholder="Correu electrònic" />
            <input type="password" id="login-password" placeholder="Contrasenya" />
            <button id="login-btn">Entrar</button>
            <p id="login-error-msg" style="color: red; display: none;"></p>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#login-btn').onclick = async () => {
        const email = modal.querySelector('#login-email').value;
        const password = modal.querySelector('#login-password').value;
        const errorMsg = modal.querySelector('#login-error-msg');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            document.body.removeChild(modal);
        } catch (err) {
            errorMsg.textContent = 'Credencials incorrectes.';
            errorMsg.style.display = 'block';
        }
    };
}

function obtenirIdEntrega() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function carregarEntrega() {
    const id = obtenirIdEntrega();
    if (!id) {
        mostrarError();
        amagarLoader();
        return;
    }

    try {
        const docRef = doc(db, COLLECCIO_ENTREGUES, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            entregaActual = { id, ...docSnap.data() };
            mostrarDadesEntrega(id, docSnap.data());
        } else {
            mostrarError();
        }
    } catch (err) {
        console.error("Error carregant l'entrega:", err);
        mostrarError();
    } finally {
        amagarLoader();
    }
}

function mostrarDadesEntrega(id, data) {
    loading.style.display = 'none';
    content.style.display = 'block';

    entregaTitol.textContent = `Detall de l'Entrega - ID: ${id}`;

    const camps = {
        'entrega-id': id,
        'entrega-article': data.article,
        'entrega-usuari': data.usuari,
        'entrega-departament': data.departament,
        'entrega-tipus': data.tipus, // Corregit de tipusEntrega a tipus
        'entrega-notes': data.notes,
        'entrega-data': formatarData(data.data),
        'entrega-data-creacio': formatarDataHora(data.dataCreacio),
        'entrega-data-edicio': formatarDataHora(data.dataUltimaEdicio)
    };

    for (const [elementId, valor] of Object.entries(camps)) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = valor || 'N/A';
        }
    }
}

function mostrarError() {
    loading.style.display = 'none';
    error.style.display = 'block';
}

function formatarData(dataString) {
    if (!dataString) return 'N/A';
    try {
        // Si la data ja és en format YYYY-MM-DD, no cal processar-la
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
            const [any, mes, dia] = dataString.split('-');
            return `${dia}/${mes}/${any}`;
        }
        return new Date(dataString).toLocaleDateString('ca-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    } catch (e) {
        return 'Data invàlida';
    }
}

function formatarDataHora(dataString) {
    if (!dataString) return 'N/A';
    try {
        return new Date(dataString).toLocaleString('ca-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(',', '');
    } catch (e) {
        return 'Data invàlida';
    }
}