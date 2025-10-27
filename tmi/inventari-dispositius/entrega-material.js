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
const COLLECCIO_ENTREGUES = "entrega de material";
const DOC_CONTADOR = "metadades/contador_entregues"; // Per l'ID incremental

const cercador = document.getElementById('buscador');
// El filtreTipus no existeix a entrega-material.html, però el referenciem per robustesa
const selectTipus = document.querySelector('.filtreTipus'); 
const resultats = document.getElementById('resultats');
const contadorEntregues = document.querySelector('.contador-dispositius');
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

// La funció de càrrega de dades requerida i corregida
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
                notes: data.notes || ''
            });
        });
        
        // Ordena per ID descendent per mostrar les més recents primer
        entregues.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        
        console.log("Total entregues carregades:", entregues.length);
        
        // Abans cridava a mostrarTaula, ara crida al filtre per visualitzar correctament
        filtraIText(''); // <--- AQUESTA CRIDA SUBSTITUEIX LA CRIDA ERRÒNIA
    } catch (error) {
        console.error("Error carregant entregues:", error);
        if (resultats) {
            resultats.innerHTML = '<div class="missatge-no-resultats">Error carregant dades de la base de dades.</div>';
        }
    } finally {
        amagarLoader();
    }
}

// Filtra només per text (ID, Article, Usuari, Departament, Notes)
function filtraIText() {
    const valorCercador = cercador.value.trim().toLowerCase();
    resultatsFiltrats = filtraPerText(entregues, valorCercador);
    paginaActual = 1;
    mostrarResultats(resultatsFiltrats, paginaActual);
}

// Filtra per text
function filtraPerText(llista, text) {
    if (!text) return llista;
    return llista.filter(item =>
        (item.id && item.id.toString().toLowerCase().includes(text)) ||
        (item.article && item.article.toLowerCase().includes(text)) ||
        (item.usuari && item.usuari.toLowerCase().includes(text)) ||
        (item.departament && item.departament.toLowerCase().includes(text)) ||
        (item.notes && item.notes.toLowerCase().includes(text)) ||
        (item.data && item.data.toLowerCase().includes(text))
    );
}

// Quan escrius al cercador
if (cercador) {
    cercador.addEventListener('input', filtraIText);
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
    
    // Header amb botons
    const headerHtml = `
        <div class="header-resultats">
            <span class="comptador-text">Entregues: ${filtrats.length}</span>
            <div class="botons-header">
                ${modeEditor ? `
                    <button id="btn-afegir-entrega" class="btn-afegir">
                        <span class="btn-afegir-text">+ Afegir Entrega</span>
                    </button>
                ` : ''}
                <button id="btn-mode-editor" class="btn-editor ${modeEditor ? 'actiu' : ''}">
                    <span class="btn-editor-text">${modeEditor ? 'Mode Usuari' : 'Mode Editor'}</span>
                </button>
            </div>
        </div>
    `;
    if (contadorEntregues) contadorEntregues.innerHTML = headerHtml;
    
    // Event listeners per al header
    if (modeEditor) {
        document.getElementById('btn-afegir-entrega').addEventListener('click', mostrarModalAfegirEntrega);
    }
    document.getElementById('btn-mode-editor').addEventListener('click', () => {
        modeEditor = !modeEditor;
        mostrarResultats(filtrats, pagina);
    });
    
    if (!filtrats.length) {
        resultats.innerHTML = '<div style="text-align: center; margin-top: 20px;">No s\'han trobat resultats.</div>';
        return;
    }
    
    // Lògica de paginació
    const inici = (pagina - 1) * RESULTATS_PER_PAGINA;
    const final = inici + RESULTATS_PER_PAGINA;
    const paginaDades = filtrats.slice(inici, final);

    // Taula de resultats
    let html = `<table class="taula-resultats">
        <thead>
            <tr>
                <th>ID</th>
                <th>Article</th>
                <th>Usuari</th>
                <th>Departament</th>
                <th>Data</th>
                <th>Notes</th>
                ${modeEditor ? '<th class="col-accions">Accions</th>' : ''}
            </tr>
        </thead>
        <tbody>
    `;
    
    for (const item of paginaDades) {
        const dataFormatada = formatarData(item.data);
        
        html += `<tr>
            <td>${item.id || ''}</td>
            <td>${item.article || ''}</td>
            <td>${item.usuari || 'N/A'}</td>
            <td>${item.departament || 'N/A'}</td>
            <td>${dataFormatada}</td>
            <td>${(item.notes || '').substring(0, 50) + (item.notes && item.notes.length > 50 ? '...' : '')}</td>
            ${modeEditor ? `<td class="accions-cell">
                <button class="btn-editar" data-id="${item.id}" title="Editar entrega">✎</button>
                <button class="btn-borrar" data-id="${item.id}" title="Borrar entrega">×</button>
            </td>` : ''}
        </tr>`;
    }
    html += '</tbody></table>';
    resultats.innerHTML = html;

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
    const paginacioFooter = document.getElementById('paginacio-footer');
    const totalPagines = Math.ceil(filtrats.length / RESULTATS_PER_PAGINA);
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


// Funció per generar un nou ID incremental de 4 dígits
async function generarNouIdEntrega() {
    try {
        const nouId = await runTransaction(db, async (transaction) => {
            const docRef = doc(db, DOC_CONTADOR);
            const docSnap = await transaction.get(docRef);

            let lastId = 0;
            if (docSnap.exists()) {
                lastId = docSnap.data().lastId || 0;
            }

            const newIdNum = lastId + 1;
            const newIdStr = String(newIdNum).padStart(4, '0');

            transaction.set(docRef, { lastId: newIdNum });
            return newIdStr;
        });

        return nouId;
    } catch (error) {
        console.error("Error generant nou ID:", error);
        throw new Error("No s'ha pogut generar un nou ID d'entrega. Comprova la col·lecció 'metadades' a Firebase.");
    }
}

// Mostra modal per afegir nova entrega
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

// Afegeix nova entrega a Firebase
async function afegirNouEntrega(modal) {
    try {
        mostrarLoader();
        const nouEntrega = {
            id: document.getElementById('add-id').value,
            article: document.getElementById('add-article').value,
            usuari: document.getElementById('add-usuari').value,
            departament: document.getElementById('add-departament').value,
            data: document.getElementById('add-data').value,
            notes: document.getElementById('add-notes').value
        };
        
        if (!nouEntrega.article || !nouEntrega.usuari) {
            throw new Error('Els camps Article i Usuari són obligatoris.');
        }

        // Afegeix a Firebase
        const docRef = doc(db, COLLECCIO_ENTREGUES, nouEntrega.id);
        await setDoc(docRef, nouEntrega);
        
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


// Funció per editar entrega
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
            <label for="edit-id">ID:</label>
            <input type="text" id="edit-id" value="${dades.id || ''}" readonly>
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

// Guarda els canvis de l'entrega
async function guardarCanvisEntrega(id, modal) {
    try {
        mostrarLoader();
        const dadesActualitzades = {
            id: document.getElementById('edit-id').value,
            article: document.getElementById('edit-article').value,
            usuari: document.getElementById('edit-usuari').value,
            departament: document.getElementById('edit-departament').value,
            data: document.getElementById('edit-data').value,
            notes: document.getElementById('edit-notes').value
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


// Mostra modal de confirmació per borrar
function mostrarModalConfirmacio(id) {
    const modal = document.createElement('div');
    modal.id = 'modal-confirmacio-borrar';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-confirmacio">
            <h3 class="modal-titol-borrar">Confirmar eliminació</h3>
            <p class="modal-text">Estàs segur que vols borrar l'entrega <strong>ID: ${id}</strong>?</p>
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

// Borra entrega de la base de dades
async function borrarEntrega(id) {
    try {
        mostrarLoader();
        await deleteDoc(doc(db, COLLECCIO_ENTREGUES, id.toString()));
        await carregarDades();
    } catch (error) {
        console.error('Error borrant entrega:', error);
        alert('Error borrant l\'entrega. Comprova la connexió.');
    } finally {
        amagarLoader();
    }
}