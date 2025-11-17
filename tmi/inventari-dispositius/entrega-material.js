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
        window.location.href = 'login.html';
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

// --- LÒGICA DEL FILTRE DE DATA I CALENDARI ---

const btnObrirFiltreData = document.getElementById('btn-obrir-filtre-data');
const modalFiltreData = document.getElementById('modal-filtre-data');
const btnCancelarFiltre = document.getElementById('btn-cancelar-filtre-data');
const btnAplicarFiltre = document.getElementById('btn-aplicar-filtre-data');
const btnNetejarFiltre = document.getElementById('btn-netejar-filtre-data');

let dataCalendari = new Date();
let dataIniciSeleccionada = filtreDataActiu.inici;
let dataFiSeleccionada = filtreDataActiu.fi;
let seleccionantInici = true;

function renderitzaCalendari() {
    const diesContainer = document.getElementById('calendari-dies');
    const mesAnyText = document.getElementById('calendari-mes-any');
    dataCalendari.setDate(1);
    const mes = dataCalendari.getMonth();
    const any = dataCalendari.getFullYear();
    mesAnyText.textContent = `${dataCalendari.toLocaleString('ca-ES', { month: 'long' })} ${any}`;
    const primerDiaMes = (dataCalendari.getDay() + 6) % 7;
    const diesEnMes = new Date(any, mes + 1, 0).getDate();
    diesContainer.innerHTML = '';
    for (let i = 0; i < primerDiaMes; i++) {
        diesContainer.innerHTML += `<div class="dia-buit"></div>`;
    }
    for (let i = 1; i <= diesEnMes; i++) {
        const diaDiv = document.createElement('div');
        diaDiv.textContent = i;
        const dataActual = new Date(any, mes, i);
        if (dataActual.toDateString() === new Date().toDateString()) diaDiv.classList.add('dia-avui');
        if (dataIniciSeleccionada && dataActual.getTime() === dataIniciSeleccionada.getTime()) diaDiv.classList.add('dia-inici');
        if (dataFiSeleccionada && dataActual.getTime() === dataFiSeleccionada.getTime()) diaDiv.classList.add('dia-fi');
        if (dataIniciSeleccionada && dataFiSeleccionada && dataActual > dataIniciSeleccionada && dataActual < dataFiSeleccionada) {
            diaDiv.classList.add('dia-rang');
        }
        diaDiv.addEventListener('click', () => seleccionarData(dataActual));
        diesContainer.appendChild(diaDiv);
    }
    actualitzarTextDatesSeleccionades();
}

function seleccionarData(data) {
    if (seleccionantInici || data < dataIniciSeleccionada) {
        dataIniciSeleccionada = data;
        dataFiSeleccionada = null;
        seleccionantInici = false;
    } else {
        dataFiSeleccionada = data;
        seleccionantInici = true;
    }
    renderitzaCalendari();
}

function actualitzarTextDatesSeleccionades() {
    document.getElementById('data-inici-seleccionada').textContent = dataIniciSeleccionada ? dataIniciSeleccionada.toLocaleDateString('ca-ES') : '--';
    document.getElementById('data-fi-seleccionada').textContent = dataFiSeleccionada ? dataFiSeleccionada.toLocaleDateString('ca-ES') : '--';
}

btnObrirFiltreData.addEventListener('click', () => {
    modalFiltreData.style.display = 'flex';
    dataIniciSeleccionada = filtreDataActiu.inici;
    dataFiSeleccionada = filtreDataActiu.fi;
    seleccionantInici = !(dataIniciSeleccionada && dataFiSeleccionada);
    dataCalendari = dataIniciSeleccionada ? new Date(dataIniciSeleccionada) : new Date();
    renderitzaCalendari();
});

btnCancelarFiltre.addEventListener('click', () => {
    modalFiltreData.style.display = 'none';
});

btnAplicarFiltre.addEventListener('click', () => {
    if (dataIniciSeleccionada && !dataFiSeleccionada) dataFiSeleccionada = dataIniciSeleccionada;
    if (dataIniciSeleccionada && dataFiSeleccionada) {
        filtreDataActiu.inici = dataIniciSeleccionada;
        filtreDataActiu.fi = dataFiSeleccionada;
        btnObrirFiltreData.style.borderColor = '#007bff';
        btnObrirFiltreData.style.fontWeight = 'bold';
    } else {
        filtreDataActiu.inici = null;
        filtreDataActiu.fi = null;
        btnObrirFiltreData.style.borderColor = '';
        btnObrirFiltreData.style.fontWeight = '';
    }
    aplicarFiltres();
    modalFiltreData.style.display = 'none';
});

btnNetejarFiltre.addEventListener('click', () => {
    dataIniciSeleccionada = null;
    dataFiSeleccionada = null;
    seleccionantInici = true;
    filtreDataActiu.inici = null;
    filtreDataActiu.fi = null;
    btnObrirFiltreData.style.borderColor = '';
    btnObrirFiltreData.style.fontWeight = '';
    renderitzaCalendari();
    aplicarFiltres();
});

document.getElementById('btn-mes-anterior').addEventListener('click', () => {
    dataCalendari.setMonth(dataCalendari.getMonth() - 1);
    renderitzaCalendari();
});

document.getElementById('btn-mes-seguent').addEventListener('click', () => {
    dataCalendari.setMonth(dataCalendari.getMonth() + 1);
    renderitzaCalendari();
});

modalFiltreData.addEventListener('click', (e) => {
    if (e.target === modalFiltreData) {
        modalFiltreData.style.display = 'none';
    }
});

// --- LÒGICA CRUD I EXPORTACIÓ ---

function exportarEntreguesACSV(dades) {
    if (!dades.length) return alert("No hi ha dades per exportar.");
    const capcaleres = ["ID", "Article", "Usuari", "Departament", "Tipus", "Data"];
    const escapa = (v) => (v === null || v === undefined) ? '' : `"${String(v).replace(/"/g, '""')}"`;
    const filesCSV = dades.map(fila => [
        escapa(fila.id), escapa(fila.article), escapa(fila.usuari),
        escapa(fila.departament), escapa(fila.tipus), escapa(fila.data)
    ].join(','));
    const contingutCSV = [capcaleres.join(',')].concat(filesCSV).join('\n');
    const blob = new Blob([contingutCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const any = now.getFullYear();
    const hores = String(now.getHours()).padStart(2, '0');
    const minuts = String(now.getMinutes()).padStart(2, '0');
    const segons = String(now.getSeconds()).padStart(2, '0');
    const nomFitxer = `entregues_${dia}-${mes}-${any}_${hores}-${minuts}-${segons}.csv`;
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", nomFitxer);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function mostrarModalConfirmacio(id) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-confirmacio">
            <h3 class="modal-titol-borrar">Confirmar eliminació</h3>
            <p class="modal-text">Estàs segur que vols borrar l'entrega amb ID: <strong>${id}</strong>?</p>
            <div class="modal-botons">
                <button id="btn-confirmar-borrar" class="btn-confirmar">Sí, borrar</button>
                <button id="btn-cancelar-borrar" class="btn-cancelar">Cancel·lar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-confirmar-borrar').onclick = () => {
        borrarEntrega(id);
        document.body.removeChild(modal);
    };
    document.getElementById('btn-cancelar-borrar').onclick = () => document.body.removeChild(modal);
    modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
}

async function borrarEntrega(id) {
    try {
        await deleteDoc(doc(db, "entregues", id));
        await carregarDades();
    } catch (error) {
        console.error('Error borrant entrega:', error);
        alert('Error borrant l\'entrega.');
    }
}

async function marcarComTornat(id) {
    if (!confirm(`Estàs segur que vols marcar el préstec amb ID ${id} com a tornat?`)) return;
    try {
        const docRef = doc(db, "entregues", id);
        await updateDoc(docRef, { estat: "Tornat" });
        await carregarDades();
    } catch (error) {
        console.error("Error marcant com a tornat:", error);
        alert("S'ha produït un error en actualitzar l'estat del préstec.");
    }
}

function mostrarModalAfegirEntrega() {
    // Calculem el següent ID disponible
    const maxId = entregues.reduce((max, e) => {
        const currentId = parseInt(e.id, 10);
        return !isNaN(currentId) && currentId > max ? currentId : max;
    }, 1000); // Inicialitzem amb 1000 per assegurar que el primer ID sigui 1001
    const nouId = (maxId + 1).toString();

    // Cridem el modal d'edició amb un objecte parcial que conté el nou ID
    mostrarModalEdicioEntrega({ id: nouId }, true);
}

function mostrarModalEdicioEntrega(entrega = {}, esNou = false) {
    // Si no es passa 'esNou', es determina si és una edició o no basant-se en si l'entrega té dades
    if (esNou === undefined) esNou = Object.keys(entrega).length === 0;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-edicio">
            <h3 class="modal-titol-edicio">${esNou ? 'Afegir Nova Entrega' : `Editar Entrega - ID: ${entrega.id}`}</h3>
            <form id="form-edicio-entrega" class="form-edicio">
                <div class="camp-edicio">
                    <label for="edit-id">ID:</label>
                    <input type="text" id="edit-id" value="${entrega.id || ''}" readonly required>
                </div>
                <div class="camp-edicio">
                    <label for="edit-article">Article:</label>
                    <input type="text" id="edit-article" value="${entrega.article || ''}" required>
                </div>
                <div class="camp-edicio">
                    <label for="edit-usuari">Usuari:</label>
                    <input type="text" id="edit-usuari" value="${entrega.usuari || ''}" required>
                </div>
                <div class="camp-edicio">
                    <label for="edit-departament">Departament:</label>
                    <input type="text" id="edit-departament" value="${entrega.departament || ''}">
                </div>
                <div class="camp-edicio">
                    <label for="edit-tipus">Tipus:</label>
                    <select id="edit-tipus" required>
                        <option value="Normal" ${entrega.tipus === 'Normal' ? 'selected' : ''}>Normal</option>
                        <option value="Prèstec" ${entrega.tipus === 'Prèstec' ? 'selected' : ''}>Prèstec</option>
                    </select>
                </div>
                <div class="camp-edicio">
                    <label for="edit-data">Data d'Entrega:</label>
                    <input type="date" id="edit-data" value="${entrega.data || new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="camp-edicio">
                    <label for="edit-notes">Notes:</label>
                    <textarea id="edit-notes" rows="3">${entrega.notes || ''}</textarea>
                </div>
                <div class="modal-botons">
                    <button type="submit" class="btn-guardar">${esNou ? 'Afegir' : 'Guardar Canvis'}</button>
                    <button type="button" id="btn-cancelar-edicio" class="btn-cancelar">Cancel·lar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('form-edicio-entrega').onsubmit = (e) => {
        e.preventDefault();
        guardarCanvisEntrega(entrega, modal);
    };
    document.getElementById('btn-cancelar-edicio').onclick = () => document.body.removeChild(modal);
    modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
}

async function guardarCanvisEntrega(entregaOriginal, modal) {
    const id = document.getElementById('edit-id').value;
    const article = document.getElementById('edit-article').value;
    const usuari = document.getElementById('edit-usuari').value; 
    const tipus = document.getElementById('edit-tipus').value;

    if (!id || !article || !usuari || !tipus) {
        return alert("Els camps ID, Article, Usuari i Tipus són obligatoris.");
    }

    const dataActualISO = new Date().toISOString();

    const dades = {
        id: id,
        article: article,
        usuari: usuari,
        departament: document.getElementById('edit-departament').value,
        tipus: tipus,
        data: document.getElementById('edit-data').value,
        notes: document.getElementById('edit-notes').value,
        estat: entregaOriginal.estat || 'Pendent',
        dataUltimaEdicio: dataActualISO
    };

    try {
        const docRef = doc(db, "entregues", id);
        if (entregaOriginal.article) { // Si l'entrega original té 'article', és una edició
            await updateDoc(docRef, dades);
        } else { // Creació
            dades.dataCreacio = dataActualISO; // Afegeix data de creació només en crear
            await setDoc(docRef, dades);
        }
        document.body.removeChild(modal);
        await carregarDades();
    } catch (error) {
        console.error("Error guardant l'entrega:", error);
        alert("Error guardant l'entrega: " + error.message);
    }
}