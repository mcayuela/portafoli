// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

let entregues = [];
let resultatsFiltrats = [];
let modeEditor = false;

// Variables per al filtre de data
let filtreDataActiu = {
    tipus: 'data',
    inici: null,
    fi: null
};

const cercador = document.getElementById('buscador');
const selectTipus = document.getElementById('filtre-tipus-entrega');
const resultatsDiv = document.getElementById('resultats');
const contadorDispositius = document.querySelector('.contador-dispositius');


function mostrarLoader() {
    document.getElementById('global-loader')?.classList.remove('hidden');
}

function amagarLoader() {
    document.getElementById('global-loader')?.classList.add('hidden');
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        carregarDades();
    } else {
        // CANVI: Redirigim a index.html perquè login.html no existeix
        window.location.href = 'index.html';
    }
});

async function carregarDades() {
    mostrarLoader();
    try {
        const querySnapshot = await getDocs(collection(db, "entregues"));
        entregues = [];
        querySnapshot.forEach((doc) => {
            entregues.push({ id: doc.id, ...doc.data() });
        });
        
        entregues.sort((a, b) => new Date(b.data) - new Date(a.data));

        aplicarFiltres();
    } catch (error) {
        console.error("Error carregant les entregues: ", error);
        resultatsDiv.innerHTML = '<div>Error carregant les dades.</div>';
    } finally {
        amagarLoader();
    }
}

function aplicarFiltres() {
    const tipusFiltre = selectTipus.value;
    const textFiltre = cercador.value.trim().toLowerCase();

    resultatsFiltrats = entregues.filter(entrega => {
        const filtreTipusOk = !tipusFiltre || entrega.tipus === tipusFiltre;

        const filtreTextOk = !textFiltre ||
            (entrega.id?.toLowerCase().includes(textFiltre)) ||
            (entrega.article?.toLowerCase().includes(textFiltre)) ||
            (entrega.usuari?.toLowerCase().includes(textFiltre));

        let filtreDataOk = true;
        if (filtreDataActiu.inici && filtreDataActiu.fi) {
            try {
                const dataEntrega = new Date(entrega.data);
                const inici = new Date(filtreDataActiu.inici);
                inici.setHours(0, 0, 0, 0);
                const fi = new Date(filtreDataActiu.fi);
                fi.setHours(23, 59, 59, 999);
                filtreDataOk = dataEntrega >= inici && dataEntrega <= fi;
            } catch(e) { filtreDataOk = false; }
        }

        return filtreTipusOk && filtreTextOk && filtreDataOk;
    });

    mostrarResultats(resultatsFiltrats);
}

function mostrarResultats(dades) {
    const headerHtml = `
        <div class="header-resultats">
            <span class="comptador-text">Entregues: ${dades.length}</span>
            <div class="botons-header">
                ${modeEditor ? `
                    <button id="btn-afegir-entrega" class="btn-afegir">
                        <span class="btn-afegir-text">+ Afegir entrega</span>
                    </button>
                    <button id="btn-exportar-csv" class="btn-editor">
                        <span class="btn-editor-text">Exportar a CSV</span>
                    </button>
                    <a href="index.html" class="btn-editor">
                        <span class="btn-editor-text">Tornar a l'Inventari</span>
                    </a>
                ` : ''}
                <button id="btn-mode-editor" class="btn-editor ${modeEditor ? 'actiu' : ''}">
                    <span class="btn-editor-text">${modeEditor ? 'Tancar Edició' : 'Mode Editor'}</span>
                </button>
            </div>
        </div>
    `;
    contadorDispositius.innerHTML = headerHtml;

    if (modeEditor) {
        document.getElementById('btn-afegir-entrega').addEventListener('click', () => mostrarModalAfegirEntrega());
        document.getElementById('btn-exportar-csv').addEventListener('click', () => exportarEntreguesACSV(dades));
    }

    document.getElementById('btn-mode-editor').addEventListener('click', () => {
        modeEditor = !modeEditor;
        mostrarResultats(dades);
    });

    if (dades.length === 0) {
        resultatsDiv.innerHTML = '<p>No s\'han trobat resultats.</p>';
        return;
    }

    const formataData = (dataString) => {
        if (!dataString) return '';
        try {
            return new Date(dataString).toLocaleDateString('ca-ES');
        } catch(e) {
            return 'Data invàlida';
        }
    };

    const taula = `
        <table class="taula-resultats">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Article</th>
                    <th>Usuari</th>
                    <th>Departament</th>
                    <th>Tipus</th>
                    <th>Data Entrega</th>
                    ${modeEditor ? '<th class="col-accions">Accions</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${dades.map(entrega => `
                    <tr class="${(entrega.tipus === 'Prèstec' && entrega.estat !== 'Tornat') ? 'fila-prestec' : ''}">
                        <td><a href="entrega.html?id=${entrega.id}" class="link-dispositiu">${entrega.id}</a></td>
                        <td>${entrega.article || ''}</td>
                        <td>${entrega.usuari || ''}</td>
                        <td>${entrega.departament || ''}</td>
                        <td>${entrega.tipus || ''}</td>
                        <td>${formataData(entrega.data)}</td>
                        ${modeEditor ? `<td class="accions-cell">
                            ${entrega.tipus === 'Prèstec' && entrega.estat !== 'Tornat' ? `
                                <button class="btn-editar" data-id="${entrega.id}" title="Marcar com a tornat">✔️</button>
                            ` : ''}
                            <button class="btn-editar" data-id="${entrega.id}" title="Editar entrega">✎</button>
                            <button class="btn-borrar" data-id="${entrega.id}" title="Borrar entrega">×</button>
                        </td>` : ''}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    resultatsDiv.innerHTML = taula;

    if (modeEditor) {
        resultatsDiv.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                if (this.title === 'Marcar com a tornat') {
                    marcarComTornat(id);
                } else {
                    const entrega = entregues.find(e => e.id === id);
                    if (entrega) mostrarModalEdicioEntrega(entrega);
                }
            });
        });

        resultatsDiv.querySelectorAll('.btn-borrar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                mostrarModalConfirmacio(id);
            });
        });
    }
}

cercador.addEventListener('input', aplicarFiltres);
selectTipus.addEventListener('change', aplicarFiltres);

document.addEventListener('DOMContentLoaded', mostrarLoader);