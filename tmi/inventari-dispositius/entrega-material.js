// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, runTransaction } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Configuració Firebase (Mateixa que la resta de l'inventari)
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
let paginaActual = 1;
let resultatsFiltrats = [];
const RESULTATS_PER_PAGINA = 50;
const COLLECCIO_ENTREGUES = "entregues"; // Nom de la col·lecció a Firebase
const DOC_CONTADOR = "metadades/contador_entregues"; // Per l'ID incremental

const cercador = document.getElementById('buscador');
const filtreTipusEntrega = document.getElementById('filtre-tipus-entrega');
const resultats = document.getElementById('resultats');
const contadorDispositius = document.querySelector('.contador-dispositius'); // Canviat de .contador-contactes
let modeEditor = false;

// Funcions del Loader
function mostrarLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function amagarLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Mostrar loader quan carrega la pàgina
document.addEventListener('DOMContentLoaded', () => {
    mostrarLoader();
});

// Control d'autenticació
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuari autenticat:", user.email);
        carregarDades();
    } else {
        amagarLoader();
        window.location.href = "login.html";
    }
});

// Carrega dades de Firebase
async function carregarDades() {
    try {
        const queryentregues = await getDocs(collection(db, COLLECCIO_ENTREGUES));
        entregues = [];
        queryentregues.forEach((doc) => {
            const data = doc.data();
            entregues.push({
                id: doc.id,
                article: data.article || '',
                usuari: data.usuari || '',
                departament: data.departament || '',
                data: data.data || '', // Data en format ISO (YYYY-MM-DD)
                notes: data.notes || '',
                tipusEntrega: data.tipusEntrega || 'Normal' // NOU CAMP
            });
        });
        
        // Ordena per ID descendent per mostrar les més recents primer
        entregues.sort((a, b) => {
            const idA = parseInt(a.id, 10) || 0;
            const idB = parseInt(b.id, 10) || 0;
            return idB - idA;
        });
        
        filtraDades();
    } catch (error) {
        console.error("Error carregant entregues:", error);
        if (resultats) {
            resultats.innerHTML = '<div class="missatge-no-resultats">Error carregant dades de la base de dades.</div>';
        }
    } finally {
        amagarLoader();
    }
}

// Filtra per tipus d'entrega i després pel text del cercador
function filtraDades() {
    const tipusSeleccionat = filtreTipusEntrega.value;
    const valorCercador = cercador.value.trim().toLowerCase();

    let dadesFiltrades;
    if (!tipusSeleccionat) {
        dadesFiltrades = entregues;
    } else {
        dadesFiltrades = entregues.filter(d => d.tipusEntrega === tipusSeleccionat);
    }

    resultatsFiltrats = filtraPerText(dadesFiltrades, valorCercador);
    paginaActual = 1;
    mostrarResultats(resultatsFiltrats, paginaActual);
}
function filtraPerText(llista, text) {
    if (!text) return llista;
    return llista.filter(item =>
        (item.id && item.id.toString().toLowerCase().includes(text)) ||
        (item.article && item.article.toLowerCase().includes(text)) ||
        (item.usuari && item.usuari.toLowerCase().includes(text)) ||
        (item.departament && item.departament.toLowerCase().includes(text)) ||
        (item.notes && item.notes.toLowerCase().includes(text)) ||
        (item.data && formatarData(item.data).toLowerCase().includes(text))
    );
}

// Quan escrius al cercador, manté el filtre de tipus
if (cercador) {
    cercador.addEventListener('input', filtraDades);
}
// Quan canvies el filtre de tipus
if (filtreTipusEntrega) {
    filtreTipusEntrega.addEventListener('change', filtraDades);
}

// Funció auxiliar per formatar la data
function formatarData(dataString) {
    if (!dataString) return 'N/A';
    try {
        // Assumeix format YYYY-MM-DD
        const data = new Date(dataString);
        return data.toLocaleDateString('ca-ES');
    } catch (e) {
        return dataString;
    }
}


// Mostra resultats
function mostrarResultats(filtrats, pagina = 1) {
    resultats.innerHTML = '';

    // Header amb comptador i botons
    const headerHtml = `
        <div class="header-resultats">
            <span class="comptador-text">Entregues: ${filtrats.length}</span>
            <div class="botons-header">
                ${modeEditor ? `
                    <button id="btn-afegir-entrega" class="btn-afegir">
                        <span class="btn-afegir-text">+ Afegir entrega</span>
                    </button>
                    <button id="btn-exportar-csv" class="btn-editor">
                        <span class="btn-editor-text">Exportar a CSV</span>
                    </button>
                    <a href="index.html" class="btn-editor">
                        <span class="btn-editor-text">Inventari Dispositius</span>
                    </a>
                ` : ''}
                <button id="btn-mode-editor" class="btn-editor ${modeEditor ? 'actiu' : ''}">
                    <span class="btn-editor-text">${modeEditor ? 'Tancar Edició' : 'Mode Editor'}</span>
                </button>
            </div>
        </div>
    `;
    // Canviat per actualitzar el contenidor correcte
    if (contadorDispositius) contadorDispositius.innerHTML = headerHtml;

    // Event listeners per al header
    document.getElementById('btn-mode-editor').addEventListener('click', () => {
        modeEditor = !modeEditor;
        mostrarResultats(filtrats, pagina);
    });

    if (modeEditor) {
        document.getElementById('btn-afegir-entrega').addEventListener('click', mostrarModalAfegirEntrega);
        document.getElementById('btn-exportar-csv').addEventListener('click', () => exportarEntreguesACSV(filtrats));
    }
    
    if (!filtrats.length) {
        resultats.innerHTML = '<div style="text-align: center; margin-top: 20px;">No s\'han trobat resultats.</div>';
        return;
    }
    
    // Lògica de paginació
    const inici = (pagina - 1) * RESULTATS_PER_PAGINA;
    const final = inici + RESULTATS_PER_PAGINA;
    const paginaDades = filtrats.slice(inici, final);

    // Taula de resultats
    let taulaHtml = `<table class="taula-resultats">
        <thead>
            <tr>
                <th>ID</th>
                <th>Article</th>
                <th>Usuari</th>
                <th>Departament</th>
                <th>Data</th>
                <th>Tipus</th>
                <th>Notes</th>
                ${modeEditor ? '<th class="col-accions">Accions</th>' : ''}
            </tr>
        </thead>
        <tbody>
    `;
    
    for (const item of paginaDades) {
        const dataFormatada = formatarData(item.data);
        const classeFila = item.tipusEntrega === 'Prèstec' ? 'class="fila-prestec"' : '';

        taulaHtml += `<tr ${classeFila}>
            <td>${item.id || ''}</td>
            <td>${item.article || ''}</td>
            <td>${item.usuari || ''}</td>
            <td>${item.departament || 'N/A'}</td>
            <td>${dataFormatada}</td>
            <td>${item.tipusEntrega || 'Normal'}</td>
            <td>${(item.notes || '').substring(0, 50) + (item.notes && item.notes.length > 50 ? '...' : '')}</td>
            ${modeEditor ? `<td class="accions-cell">
                <button class="btn-editar" data-id="${item.id}" title="Editar entrega">✎</button>
                <button class="btn-borrar" data-id="${item.id}" title="Borrar entrega">×</button>
            </td>` : ''}
        </tr>`;
    }
    taulaHtml += '</tbody></table>';
    resultats.innerHTML = taulaHtml; // Canviat per evitar duplicar contingut

    // Event listeners per als botons de l'editor
    if (modeEditor) {
        resultats.querySelectorAll('.btn-borrar').forEach(btn => {
            btn.addEventListener('click', function() {
                mostrarModalConfirmacio(this.dataset.id);
            });
        });
        resultats.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function() {
                editarEntrega(this.dataset.id);
            });
        });
    }

    // Paginació al peu de pàgina
    const totalPagines = Math.ceil(filtrats.length / RESULTATS_PER_PAGINA);
    const paginacioFooter = document.getElementById('paginacio-footer'); 
    if (paginacioFooter) paginacioFooter.innerHTML = '';

    if (totalPagines > 1 && paginacioFooter) {
        let paginacioHtml = `<div class="paginacio">`;
        paginacioHtml += `<button class="paginacio-btn" data-pagina="${pagina - 1}" ${pagina === 1 ? 'disabled' : ''}>&lt;</button>`;
        paginacioHtml += `<span class="paginacio-info">Pàgina ${pagina} de ${totalPagines}</span>`;
        paginacioHtml += `<button class="paginacio-btn" data-pagina="${pagina + 1}" ${pagina === totalPagines ? 'disabled' : ''}>&gt;</button>`;
        paginacioHtml += `</div>`;
        paginacioFooter.innerHTML = paginacioHtml;

        paginacioFooter.querySelectorAll('.paginacio-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const novaPagina = parseInt(this.dataset.pagina);
                if (!isNaN(novaPagina) && novaPagina >= 1 && novaPagina <= totalPagines && novaPagina !== pagina) {
                    paginaActual = novaPagina;
                    mostrarResultats(filtrats, paginaActual);
                }
            });
        });
    }
}

// Funció per exportar les entregues a CSV
function exportarEntreguesACSV(dades) {
    if (!dades.length) {
        alert("No hi ha dades per exportar.");
        return;
    }

    // Defineix les capçaleres del CSV
    const capcaleres = [
        "ID",
        "Article",
        "Usuari",
        "Departament",
        "Data",
        "TipusEntrega",
        "Notes"
    ];

    // Funció per escapar les dades per al CSV
    const escapa = (valor) => {
        let str = valor === null || valor === undefined ? '' : String(valor);
        // Si conté comes, cometes dobles o salts de línia, el tanquem entre cometes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = `"${str.replace(/"/g, '""')}"`; // Escapa les cometes dobles duplicant-les
        }
        return str;
    };

    // Converteix les dades a format CSV
    const filesCSV = dades.map(fila => capcaleres.map(capcalera => {
        const clau = capcalera === 'Tipus' ? 'tipusEntrega' : capcalera.toLowerCase();
        return escapa(fila[clau] || '');
    }).join(','));
    
    // Afegeix la fila de capçaleres al principi
    const contingutCSV = [capcaleres.join(',')].concat(filesCSV).join('\n');

    // Crea i descarrega l'arxiu
    const blob = new Blob([contingutCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "entregues.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funció per generar un nou ID incremental
async function generarNouIdEntrega() {
    try {
        const nouId = await runTransaction(db, async (transaction) => {
            const docRef = doc(db, DOC_CONTADOR);
            const docSnap = await transaction.get(docRef);

            let lastId = 1000; // Comença a 1001
            if (docSnap.exists() && docSnap.data().lastId) {
                lastId = docSnap.data().lastId || 1000;
            }

            const newIdNum = lastId + 1;
            const newIdStr = String(newIdNum);
            
            transaction.set(docRef, { lastId: newIdNum });
            return newIdStr;
        });

        return nouId;
    } catch (error) {
        console.error("Error generant nou ID:", error);
        throw new Error("No s'ha pogut generar un nou ID d'entrega. Comprova la col·lecció 'metadades' a Firebase.");
    }
}

// Mostra modal per afegir una nova entrega
async function mostrarModalAfegirEntrega() {
    mostrarLoader();
    let nouId;
    try {
        nouId = await generarNouIdEntrega();
    } catch (e) {
        alert(e.message);
        amagarLoader();
        return;
    }
    amagarLoader();
    
    const modal = document.createElement('div');
    modal.id = 'modal-afegir-entrega';
    modal.className = 'modal-overlay';
    
    const campsHTML = `
        <div class="camp-edicio">
            <label for="add-id">ID:</label>
            <input type="text" id="add-id" value="${nouId}" readonly>
        </div>
        <div class="camp-edicio">
            <label for="add-article">Article:</label>
            <input type="text" id="add-article" required>
        </div>
        <div class="camp-edicio">
            <label for="add-usuari">Usuari:</label>
            <input type="text" id="add-usuari" required>
        </div>
        <div class="camp-edicio">
            <label for="add-departament">Departament:</label>
            <input type="text" id="add-departament">
        </div>
        <div class="camp-edicio">
            <label for="add-data">Data (YYYY-MM-DD):</label>
            <input type="date" id="add-data" value="${new Date().toISOString().substring(0, 10)}">
        </div>
        <div class="camp-edicio">
            <label for="add-tipus-entrega">Tipus d'Entrega:</label>
            <select id="add-tipus-entrega">
                <option value="Normal" selected>Entrega</option>
                <option value="Prèstec">Prèstec</option>
            </select>
        </div>
        <div class="camp-edicio">
            <label for="add-notes">Notes:</label>
            <textarea id="add-notes" rows="4"></textarea>
        </div>
    `;
    
    modal.innerHTML = `
        <div class="modal-edicio">
            <h3 class="modal-titol-edicio">Afegir Nova Entrega</h3>
            <form id="form-afegir-entrega" class="form-edicio">
                ${campsHTML}
                <div class="modal-botons">
                    <button type="submit" class="btn-guardar">Afegir Entrega</button>
                    <button type="button" id="btn-cancelar-afegir" class="btn-cancelar">Cancel·lar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('btn-cancelar-afegir').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('form-afegir-entrega').addEventListener('submit', (e) => {
        e.preventDefault();
        afegirNouEntrega(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Afegeix la nova entrega a Firebase
async function afegirNouEntrega(modal) {
    try {
        mostrarLoader();
        const nouEntrega = {
            id: document.getElementById('add-id').value,
            article: document.getElementById('add-article').value,
            usuari: document.getElementById('add-usuari').value,
            departament: document.getElementById('add-departament').value,
            data: document.getElementById('add-data').value,
            notes: document.getElementById('add-notes').value,
            tipusEntrega: document.getElementById('add-tipus-entrega').value
        };
        
        if (!nouEntrega.article || !nouEntrega.usuari) {
            throw new Error('Els camps Article i Usuari són obligatoris.');
        }

        // Afegeix a Firebase
        const docRef = doc(db, COLLECCIO_ENTREGUES, nouEntrega.id);
        // No guardem l'ID dins del document, ja que és la clau
        const { id, ...dadesPerGuardar } = nouEntrega;
        await setDoc(docRef, dadesPerGuardar);
        
        alert(`Entrega amb ID: ${nouEntrega.id} afegida correctament!`);
        
        document.body.removeChild(modal);
        
        await carregarDades();
    } catch (error) {
        console.error('Error afegint entrega:', error);
        alert(`Error afegint l'entrega: ${error.message}`);
    } finally {
        amagarLoader();
    }
}


// Funció per carregar dades i mostrar modal d'edició
async function editarEntrega(id) {
    try {
        mostrarLoader();
        const docRef = doc(db, COLLECCIO_ENTREGUES, id.toString());
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const dades = docSnap.data();
            mostrarModalEdicio(id, dades);
        } else {
            alert('No s\'han trobat les dades de l\'entrega');
        }
    } catch (error) {
        console.error('Error obtenint dades de l\'entrega:', error);
        alert('Error carregant les dades de l\'entrega');
    } finally {
        amagarLoader();
    }
}

// Mostra modal d'edició
function mostrarModalEdicio(id, dades) {
    const modal = document.createElement('div');
    modal.id = 'modal-edicio-entrega';
    modal.className = 'modal-overlay';
    
    const campsHTML = `
        <div class="camp-edicio">
            <label>ID:</label>
            <input type="text" value="${id}" readonly>
        </div>
        <div class="camp-edicio">
            <label for="edit-article">Article:</label>
            <input type="text" id="edit-article" value="${dades.article || ''}" required>
        </div>
        <div class="camp-edicio">
            <label for="edit-usuari">Usuari:</label>
            <input type="text" id="edit-usuari" value="${dades.usuari || ''}" required>
        </div>
        <div class="camp-edicio">
            <label for="edit-departament">Departament:</label>
            <input type="text" id="edit-departament" value="${dades.departament || ''}">
        </div>
        <div class="camp-edicio">
            <label for="edit-data">Data (YYYY-MM-DD):</label>
            <input type="date" id="edit-data" value="${dades.data || ''}">
        </div>
        <div class="camp-edicio">
            <label for="edit-tipus-entrega">Tipus d'Entrega:</label>
            <select id="edit-tipus-entrega">
                <option value="Normal" ${dades.tipusEntrega === 'Normal' ? 'selected' : ''}>Entrega</option>
                <option value="Prèstec" ${dades.tipusEntrega === 'Prèstec' ? 'selected' : ''}>Prèstec</option>
            </select>
        </div>
        <div class="camp-edicio">
            <label for="edit-notes">Notes:</label>
            <textarea id="edit-notes" rows="4">${dades.notes || ''}</textarea>
        </div>
    `;
    
    modal.innerHTML = `
        <div class="modal-edicio">
            <h3 class="modal-titol-edicio">Editar Entrega - ID: ${id}</h3>
            <form id="form-edicio-entrega" class="form-edicio">
                ${campsHTML}
                <div class="modal-botons">
                    <button type="submit" class="btn-guardar">Guardar canvis</button>
                    <button type="button" id="btn-cancelar-edicio" class="btn-cancelar">Cancel·lar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('btn-cancelar-edicio').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('form-edicio-entrega').addEventListener('submit', (e) => {
        e.preventDefault();
        guardarCanvisEntrega(id, modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Guarda els canvis de l'entrega a Firebase
async function guardarCanvisEntrega(id, modal) {
    try {
        mostrarLoader();
        const dadesActualitzades = {
            article: document.getElementById('edit-article').value,
            usuari: document.getElementById('edit-usuari').value,
            departament: document.getElementById('edit-departament').value,
            data: document.getElementById('edit-data').value,
            notes: document.getElementById('edit-notes').value,
            tipusEntrega: document.getElementById('edit-tipus-entrega').value
        };
        
        if (!dadesActualitzades.article || !dadesActualitzades.usuari) {
            throw new Error('Els camps Article i Usuari són obligatoris.');
        }
        
        // Actualitza a Firebase
        const docRef = doc(db, COLLECCIO_ENTREGUES, id.toString());
        await updateDoc(docRef, dadesActualitzades);
        
        alert(`Entrega amb ID: ${id} actualitzada correctament!`);
        
        document.body.removeChild(modal);
        
        await carregarDades();
    } catch (error) {
        console.error('Error actualitzant entrega:', error);
        alert(`Error actualitzant l'entrega: ${error.message}`);
    } finally {
        amagarLoader();
    }
}


// Mostra modal de confirmació per esborrar
function mostrarModalConfirmacio(id) {
    const modal = document.createElement('div');
    modal.id = 'modal-confirmacio-borrar';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-confirmacio">
            <h3 class="modal-titol-borrar">Confirmar eliminació</h3>
            <p class="modal-text">Estàs segur que vols esborrar l'entrega <strong>ID: ${id}</strong>?</p>
            <p class="modal-warning">Aquesta acció no es pot desfer.</p>
            <div class="modal-botons">
                <button id="btn-confirmar-borrar" class="btn-confirmar">Sí, borrar</button>
                <button id="btn-cancelar-borrar" class="btn-cancelar">Cancel·lar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('btn-confirmar-borrar').addEventListener('click', () => {
        borrarEntrega(id);
        document.body.removeChild(modal);
    });
    
    document.getElementById('btn-cancelar-borrar').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Esborra l'entrega de la base de dades
async function borrarEntrega(id) {
    try {
        mostrarLoader();
        await deleteDoc(doc(db, COLLECCIO_ENTREGUES, id.toString()));
        alert(`Entrega amb ID: ${id} esborrada correctament.`);
        await carregarDades();
    } catch (error) {
        console.error('Error borrant entrega:', error);
        alert('Error esborrant l\'entrega. Comprova la connexió.');
    } finally {
        amagarLoader();
    }
}