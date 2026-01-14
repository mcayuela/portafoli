// Imports de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Configuració Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDqsy5zE7YnUuMt80ZskvvUVFjIiVTdOB8",
    projectId: "inventari-pc-s",
    storageBucket: "inventari-pc-s.firebasestorage.app",
    messagingSenderId: "998595234302",
    appId: "1:998595234302:web:d253d36f99d82b549f18af",
    measurementId: "G-0QM2VV5NZD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Variables d'estat
let entregues = [];
let resultatsFiltrats = [];
let paginaActual = 1;
const RESULTATS_PER_PAGINA = 50;
let filtreDataActiu = {
    tipus: 'dataEntrega',
    inici: null,
    fi: null
};
let modeEditor = false;

// Elements del DOM
const resultats = document.getElementById('resultats');
const headerContainer = document.querySelector('.header-resultats');
const buscador = document.getElementById('buscador');
const filtreTipus = document.getElementById('filtre-tipus-entrega');
const loader = document.getElementById('global-loader');

// Elements del filtre de data
const btnObrirFiltreData = document.getElementById('btn-obrir-filtre-data');
const modalFiltreData = document.getElementById('modal-filtre-data');
const btnCancelarFiltre = document.getElementById('btn-cancelar-filtre-data');
const btnAplicarFiltre = document.getElementById('btn-aplicar-filtre-data');
const btnNetejarFiltre = document.getElementById('btn-netejar-filtre-data');
const btnModeEditorMobil = document.getElementById('btn-mode-editor-mobil');

// Inicialització
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            carregarDades();
            inicialitzarListeners();
            inicialitzarModalAccionsEditor();
        } else {
            window.location.href = "https://www.mcayuela.com/tmi";
        }
    });
});

function mostrarLoader() {
    if (loader) loader.classList.remove('hidden');
}

function amagarLoader() {
    if (loader) loader.classList.add('hidden');
}

function inicialitzarListeners() {
    if (buscador) buscador.addEventListener('input', filtrarResultats);
    if (filtreTipus) filtreTipus.addEventListener('change', filtrarResultats);
    
    // Listeners del filtre de data
    if (btnObrirFiltreData) btnObrirFiltreData.addEventListener('click', obrirModalFiltreData);
    if (btnCancelarFiltre) btnCancelarFiltre.addEventListener('click', () => modalFiltreData.style.display = 'none');
    if (btnAplicarFiltre) btnAplicarFiltre.addEventListener('click', aplicarFiltreData);
    if (btnNetejarFiltre) btnNetejarFiltre.addEventListener('click', netejarFiltreData);
    
    // Navegació calendari
    document.getElementById('btn-mes-anterior')?.addEventListener('click', () => {
        dataCalendari.setMonth(dataCalendari.getMonth() - 1);
        renderitzaCalendari();
    });
    document.getElementById('btn-mes-seguent')?.addEventListener('click', () => {
        dataCalendari.setMonth(dataCalendari.getMonth() + 1);
        renderitzaCalendari();
    });
}

// Càrrega de dades
async function carregarDades() {
    mostrarLoader();
    try {
        const querySnapshot = await getDocs(collection(db, "entregues"));
        entregues = [];
        querySnapshot.forEach((doc) => {
            entregues.push(doc.data());
        });
        
        // Ordenar per ID descendent (el número més alt a dalt)
        // Gestiona tant IDs tipus "1016" com "ENT-1017"
        entregues.sort((a, b) => {
            const idA = parseInt(String(a.id).replace(/^ENT-/, ''), 10) || 0;
            const idB = parseInt(String(b.id).replace(/^ENT-/, ''), 10) || 0;
            return idB - idA;
        });
        
        filtrarResultats();
    } catch (error) {
        console.error("Error carregant entregues:", error);
        resultats.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Error carregant les dades.</div>';
    } finally {
        amagarLoader();
    }
}

// Filtratge
function filtrarResultats() {
    const textCerca = buscador ? buscador.value.toLowerCase().trim() : '';
    const tipusSeleccionat = filtreTipus ? filtreTipus.value : '';

    resultatsFiltrats = entregues.filter(item => {
        // Filtre de text
        const matchText = !textCerca || 
            (item.id && item.id.toLowerCase().includes(textCerca)) ||
            (item.article && item.article.toLowerCase().includes(textCerca)) ||
            (item.usuari && item.usuari.toLowerCase().includes(textCerca)) ||
            (item.departament && item.departament.toLowerCase().includes(textCerca));

        // Filtre de tipus
        const matchTipus = !tipusSeleccionat || item.tipus === tipusSeleccionat;

        // Filtre de data
        let matchData = true;
        if (filtreDataActiu.inici && filtreDataActiu.fi) {
            const dataItem = new Date(item.dataEntrega);
            const inici = new Date(filtreDataActiu.inici);
            inici.setHours(0, 0, 0, 0);
            const fi = new Date(filtreDataActiu.fi);
            fi.setHours(23, 59, 59, 999);
            matchData = dataItem >= inici && dataItem <= fi;
        }

        return matchText && matchTipus && matchData;
    });

    paginaActual = 1;
    mostrarResultats();
}

// Renderitzat
function mostrarResultats() {
    // Actualitzar comptador i botons de capçalera
    // Si headerContainer no existeix (per exemple, si l'HTML no s'ha actualitzat encara), intentem buscar-lo de nou o fallem silenciosament
    const container = headerContainer || document.querySelector('.header-resultats');
    
    const headerHtml = `
        <span class="comptador-text">Entregues: ${resultatsFiltrats.length}</span>
        <div class="botons-header">
            ${modeEditor ? `
                <button id="btn-afegir-entrega" class="btn-afegir">
                    <span class="btn-afegir-text">+ Nova Entrega</span>
                </button>
                <button id="btn-exportar-csv" class="btn-editor">
                    <span class="btn-editor-text">Exportar CSV</span>
                </button>
                <a href="index.html" class="btn-editor">
                    <span class="btn-editor-text">Inventari</span>
                </a>
            ` : ''}
            <button id="btn-mode-editor" class="btn-editor ${modeEditor ? 'actiu' : ''}">
                <span class="btn-editor-text">${modeEditor ? 'Tancar Edició' : 'Mode Editor'}</span>
            </button>
        </div>
    `;
    
    if (container) container.innerHTML = headerHtml;

    // Assignar events als botons de capçalera
    document.getElementById('btn-mode-editor')?.addEventListener('click', toggleEditMode);
    
    if (modeEditor) {
        document.getElementById('btn-afegir-entrega')?.addEventListener('click', mostrarModalAfegir);
        document.getElementById('btn-exportar-csv')?.addEventListener('click', () => exportarACSV(resultatsFiltrats));
    }

    if (resultatsFiltrats.length === 0) {
        resultats.innerHTML = '<div style="padding: 20px; text-align: center;">No s\'han trobat entregues.</div>';
        return;
    }

    // Paginació
    const inici = (paginaActual - 1) * RESULTATS_PER_PAGINA;
    const final = inici + RESULTATS_PER_PAGINA;
    const dadesPagina = resultatsFiltrats.slice(inici, final);

    // Construir taula
    let html = `
        <table class="taula-resultats">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Article</th>
                    <th>Usuari</th>
                    <th>Departament</th>
                    <th>Tipus</th>
                    <th>Data Entrega</th>
                    <th>Estat</th>
                    ${modeEditor ? '<th class="col-accions">Accions</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;

    dadesPagina.forEach(item => {
        const dataEntrega = item.dataEntrega ? new Date(item.dataEntrega).toLocaleDateString('ca-ES') : '-';
        const esPrestec = item.tipus === 'Prèstec';
        const retornat = item.dataRetorn ? true : false;
        
        // Assegurem que visualment es vegi ENT- si no ho té
        let visualId = item.id;
        if (!String(visualId).startsWith('ENT-') && !isNaN(visualId)) {
            visualId = `ENT-${visualId}`;
        }

        let estatClass = '';
        let estatText = 'Entregat';
        
        if (esPrestec) {
            if (retornat) {
                estatClass = 'fila-prestec-retornat';
                estatText = `Retornat (${new Date(item.dataRetorn).toLocaleDateString('ca-ES')})`;
            } else {
                estatClass = 'fila-prestec';
                estatText = 'En Prèstec';
            }
        }

        html += `
            <tr class="${estatClass}">
                <td><a href="entrega.html?id=${item.id}" class="link-dispositiu">${visualId}</a></td>
                <td>${item.article || ''}</td>
                <td>${item.usuari || ''}</td>
                <td>${item.departament || ''}</td>
                <td>${item.tipus || 'Normal'}</td>
                <td>${dataEntrega}</td>
                <td>${estatText}</td>
                ${modeEditor ? `<td class="accions-cell">
                    ${esPrestec && !retornat ? 
                        `<button class="btn-retornar" data-id="${item.id}" title="Marcar com a retornat">↩️</button>` : ''}
                    <button class="btn-editar" data-id="${item.id}" title="Editar">✎</button>
                    <button class="btn-borrar" data-id="${item.id}" title="Eliminar">×</button>
                </td>` : ''}
            </tr>
        `;
    });

    html += '</tbody></table>';

    // Controls de paginació
    const totalPagines = Math.ceil(resultatsFiltrats.length / RESULTATS_PER_PAGINA);
    if (totalPagines > 1) {
        html += `
            <div class="paginacio">
                <button class="paginacio-btn" ${paginaActual === 1 ? 'disabled' : ''} onclick="canviarPagina(${paginaActual - 1})">&lt;</button>
                <span class="paginacio-info">Pàgina ${paginaActual} de ${totalPagines}</span>
                <button class="paginacio-btn" ${paginaActual === totalPagines ? 'disabled' : ''} onclick="canviarPagina(${paginaActual + 1})">&gt;</button>
            </div>
        `;
    }

    resultats.innerHTML = html;

    // Assignar events als botons de la taula
    if (modeEditor) {
        document.querySelectorAll('.btn-retornar').forEach(btn => {
            btn.addEventListener('click', () => mostrarModalRetorn(btn.dataset.id));
        });
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => mostrarModalEditar(btn.dataset.id));
        });
        document.querySelectorAll('.btn-borrar').forEach(btn => {
            btn.addEventListener('click', () => mostrarModalBorrar(btn.dataset.id));
        });
    }

    // Funció global per a la paginació (necessària perquè el HTML és string)
    window.canviarPagina = (novaPagina) => {
        if (novaPagina >= 1 && novaPagina <= totalPagines) {
            paginaActual = novaPagina;
            mostrarResultats();
        }
    };
}

// Funció per activar/desactivar el mode editor
function toggleEditMode() {
    modeEditor = !modeEditor;
    if (btnModeEditorMobil) {
        btnModeEditorMobil.classList.toggle('actiu', modeEditor);
    }
    mostrarResultats();
}

// --- LÒGICA DEL MODAL D'ACCIONS DE L'EDITOR (MÒBIL) ---

function inicialitzarModalAccionsEditor() {
    const modal = document.getElementById('modal-accions-editor');
    if (!modal) return;

    const btnObrir = document.getElementById('btn-mode-editor-mobil');
    const btnTancar = document.getElementById('btn-tancar-accions');
    const btnAccioAfegir = document.getElementById('btn-accio-afegir');
    const btnAccioExportar = document.getElementById('btn-accio-exportar');
    const btnAccioEditarTaula = document.getElementById('btn-accio-editar-taula');

    if (btnObrir) {
        btnObrir.addEventListener('click', () => {
            if (btnAccioEditarTaula) {
                btnAccioEditarTaula.classList.toggle('actiu', modeEditor);
                btnAccioEditarTaula.innerHTML = `<span>✏️</span> ${modeEditor ? 'Desactivar Edició' : 'Activar Edició a la Taula'}`;
            }
            modal.style.display = 'flex';
        });
    }

    if (btnTancar) btnTancar.addEventListener('click', () => modal.style.display = 'none');
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    if (btnAccioAfegir) btnAccioAfegir.addEventListener('click', () => {
        mostrarModalAfegir();
        modal.style.display = 'none';
    });

    if (btnAccioExportar) btnAccioExportar.addEventListener('click', () => exportarACSV(resultatsFiltrats));

    if (btnAccioEditarTaula) btnAccioEditarTaula.addEventListener('click', () => {
        toggleEditMode();
        modal.style.display = 'none';
    });
}

// --- MODALS ---

function crearModalBase(id, titol, contingut) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-edicio">
            <h3 class="modal-titol-edicio">${titol}</h3>
            ${contingut}
        </div>
    `;
    document.body.appendChild(modal);
    
    // Tancar en fer clic fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) tancarModal(id);
    });
    
    return modal;
}

function tancarModal(id) {
    const modal = document.getElementById(id);
    if (modal) document.body.removeChild(modal);
}

// Funció per generar el següent ID automàticament
async function generarNouIdEntrega() {
    try {
        const querySnapshot = await getDocs(collection(db, "entregues"));
        let maxId = 1000; // Comencem a comptar des de 1000 si no hi ha res
        
        querySnapshot.forEach((doc) => {
            const id = doc.id;
            // Neteja el prefix ENT- si hi és, per obtenir només el número
            const numStr = String(id).replace(/^ENT-/, '');
            const numPart = parseInt(numStr, 10);
            
            if (!isNaN(numPart) && numPart > maxId) {
                maxId = numPart;
            }
        });
        
        // Incrementa
        const nouNum = maxId + 1;
        return `ENT-${nouNum}`;
    } catch (e) {
        console.error("Error generant ID:", e);
        return `ENT-${Date.now()}`; // Fallback
    }
}

// Modal Afegir
async function mostrarModalAfegir() {
    mostrarLoader();
    const idAutogenerat = await generarNouIdEntrega();
    amagarLoader();

    const avui = new Date().toISOString().split('T')[0];
    
    const contingut = `
        <form id="form-afegir-entrega" class="form-edicio">
            <div class="camp-edicio">
                <label>ID:</label>
                <input type="text" id="add-id" value="${idAutogenerat}" required readonly style="background-color: #e9ecef; cursor: not-allowed; color: #495057;">
            </div>
            <div class="camp-edicio">
                <label>Article:</label>
                <input type="text" id="add-article" required placeholder="Què s'entrega?">
            </div>
            <div class="camp-edicio">
                <label>Usuari:</label>
                <input type="text" id="add-usuari" required>
            </div>
            <div class="camp-edicio">
                <label>Departament:</label>
                <input type="text" id="add-departament">
            </div>
            <div class="camp-edicio">
                <label>Tipus:</label>
                <select id="add-tipus">
                    <option value="Normal">Normal</option>
                    <option value="Prèstec">Prèstec</option>
                </select>
            </div>
            <div class="camp-edicio">
                <label>Data Entrega:</label>
                <input type="date" id="add-data" value="${avui}" required>
            </div>
            <div class="camp-edicio">
                <label>Notes:</label>
                <textarea id="add-notes" rows="3" style="width:100%; padding:10px; border:2px solid #e0e7ef; border-radius:6px;"></textarea>
            </div>
            <div class="modal-botons">
                <button type="submit" class="btn-guardar">Crear Entrega</button>
                <button type="button" class="btn-cancelar" onclick="document.getElementById('modal-afegir').remove()">Cancel·lar</button>
            </div>
        </form>
    `;
    
    crearModalBase('modal-afegir', 'Nova Entrega', contingut);
    
    document.getElementById('form-afegir-entrega').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dades = {
            id: document.getElementById('add-id').value,
            article: document.getElementById('add-article').value,
            usuari: document.getElementById('add-usuari').value,
            departament: document.getElementById('add-departament').value,
            tipus: document.getElementById('add-tipus').value,
            dataEntrega: document.getElementById('add-data').value,
            notes: document.getElementById('add-notes').value,
            dataCreacio: new Date().toISOString(),
            dataUltimaEdicio: new Date().toISOString()
        };
        
        await afegirEntrega(dades);
        tancarModal('modal-afegir');
    });
}

// Modal Editar
function mostrarModalEditar(id) {
    const entrega = entregues.find(e => e.id === id);
    if (!entrega) return;
    
    const contingut = `
        <form id="form-editar-entrega" class="form-edicio">
            <div class="camp-edicio">
                <label>ID:</label>
                <input type="text" value="${entrega.id}" readonly style="background:#f0f0f0;">
            </div>
            <div class="camp-edicio">
                <label>Article:</label>
                <input type="text" id="edit-article" value="${entrega.article || ''}" required>
            </div>
            <div class="camp-edicio">
                <label>Usuari:</label>
                <input type="text" id="edit-usuari" value="${entrega.usuari || ''}" required>
            </div>
            <div class="camp-edicio">
                <label>Departament:</label>
                <input type="text" id="edit-departament" value="${entrega.departament || ''}">
            </div>
            <div class="camp-edicio">
                <label>Tipus:</label>
                <select id="edit-tipus">
                    <option value="Normal" ${entrega.tipus === 'Normal' ? 'selected' : ''}>Normal</option>
                    <option value="Prèstec" ${entrega.tipus === 'Prèstec' ? 'selected' : ''}>Prèstec</option>
                </select>
            </div>
            <div class="camp-edicio">
                <label>Data Entrega:</label>
                <input type="date" id="edit-data" value="${entrega.dataEntrega || ''}" required>
            </div>
            <div class="camp-edicio">
                <label>Notes:</label>
                <textarea id="edit-notes" rows="3" style="width:100%; padding:10px; border:2px solid #e0e7ef; border-radius:6px;">${entrega.notes || ''}</textarea>
            </div>
            <div class="modal-botons">
                <button type="submit" class="btn-guardar">Guardar Canvis</button>
                <button type="button" class="btn-cancelar" onclick="document.getElementById('modal-editar').remove()">Cancel·lar</button>
            </div>
        </form>
    `;
    
    crearModalBase('modal-editar', `Editar Entrega ${id}`, contingut);
    
    document.getElementById('form-editar-entrega').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dades = {
            article: document.getElementById('edit-article').value,
            usuari: document.getElementById('edit-usuari').value,
            departament: document.getElementById('edit-departament').value,
            tipus: document.getElementById('edit-tipus').value,
            dataEntrega: document.getElementById('edit-data').value,
            notes: document.getElementById('edit-notes').value,
            dataUltimaEdicio: new Date().toISOString()
        };
        
        await editarEntrega(id, dades);
        tancarModal('modal-editar');
    });
}

// Modal Retornar
function mostrarModalRetorn(id) {
    const avui = new Date().toISOString().split('T')[0];
    const contingut = `
        <p>Confirmes que el material ha estat retornat?</p>
        <div class="camp-edicio">
            <label>Data de Retorn:</label>
            <input type="date" id="retorn-data" value="${avui}" required>
        </div>
        <div class="modal-botons" style="margin-top:20px;">
            <button id="btn-confirmar-retorn" class="btn-guardar" style="background-color:#28a745;">Confirmar Retorn</button>
            <button type="button" class="btn-cancelar" onclick="document.getElementById('modal-retorn').remove()">Cancel·lar</button>
        </div>
    `;
    
    crearModalBase('modal-retorn', 'Retorn de Material', contingut);
    
    document.getElementById('btn-confirmar-retorn').addEventListener('click', async () => {
        const dataRetorn = document.getElementById('retorn-data').value;
        await retornarMaterial(id, dataRetorn);
        tancarModal('modal-retorn');
    });
}

// Modal Borrar
function mostrarModalBorrar(id) {
    const contingut = `
        <p>Estàs segur que vols eliminar l'entrega <strong>${id}</strong>?</p>
        <p style="color:red; font-size:0.9em;">Aquesta acció no es pot desfer.</p>
        <div class="modal-botons" style="margin-top:20px;">
            <button id="btn-confirmar-borrar" class="btn-guardar" style="background-color:#dc3545;">Sí, Eliminar</button>
            <button type="button" class="btn-cancelar" onclick="document.getElementById('modal-borrar').remove()">Cancel·lar</button>
        </div>
    `;
    
    crearModalBase('modal-borrar', 'Eliminar Entrega', contingut);
    
    document.getElementById('btn-confirmar-borrar').addEventListener('click', async () => {
        await eliminarEntrega(id);
        tancarModal('modal-borrar');
    });
}

// --- OPERACIONS FIREBASE ---

async function afegirEntrega(dades) {
    mostrarLoader();
    try {
        await setDoc(doc(db, "entregues", dades.id), dades);
        await carregarDades();
        alert("Entrega creada correctament!");
    } catch (e) {
        console.error(e);
        alert("Error creant l'entrega: " + e.message);
    } finally {
        amagarLoader();
    }
}

async function editarEntrega(id, dades) {
    mostrarLoader();
    try {
        await updateDoc(doc(db, "entregues", id), dades);
        await carregarDades();
        alert("Entrega actualitzada correctament!");
    } catch (e) {
        console.error(e);
        alert("Error actualitzant: " + e.message);
    } finally {
        amagarLoader();
    }
}

async function retornarMaterial(id, dataRetorn) {
    mostrarLoader();
    try {
        await updateDoc(doc(db, "entregues", id), {
            dataRetorn: dataRetorn,
            dataUltimaEdicio: new Date().toISOString()
        });
        await carregarDades();
        alert("Material marcat com a retornat!");
    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
    } finally {
        amagarLoader();
    }
}

async function eliminarEntrega(id) {
    mostrarLoader();
    try {
        await deleteDoc(doc(db, "entregues", id));
        await carregarDades();
        alert("Entrega eliminada.");
    } catch (e) {
        console.error(e);
        alert("Error eliminant: " + e.message);
    } finally {
        amagarLoader();
    }
}

// --- EXPORTAR CSV ---

function exportarACSV(dades) {
    if (!dades.length) {
        alert("No hi ha dades per exportar.");
        return;
    }

    const capcaleres = ["ID", "Article", "Usuari", "Departament", "Tipus", "DataEntrega", "DataRetorn", "Notes"];
    
    const escapa = (text) => {
        if (!text) return '';
        const str = String(text);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const files = dades.map(d => [
        escapa(d.id),
        escapa(d.article),
        escapa(d.usuari),
        escapa(d.departament),
        escapa(d.tipus),
        escapa(d.dataEntrega),
        escapa(d.dataRetorn),
        escapa(d.notes)
    ].join(','));

    const csvContent = [capcaleres.join(',')].concat(files).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Entregues_TMI_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- LÒGICA DEL FILTRE DE DATA (CALENDARI) ---

let dataCalendari = new Date();
let dataIniciSeleccionada = null;
let dataFiSeleccionada = null;
let seleccionantInici = true;

function obrirModalFiltreData() {
    modalFiltreData.style.display = 'flex';
    dataIniciSeleccionada = filtreDataActiu.inici;
    dataFiSeleccionada = filtreDataActiu.fi;
    seleccionantInici = !(dataIniciSeleccionada && dataFiSeleccionada);
    dataCalendari = dataIniciSeleccionada ? new Date(dataIniciSeleccionada) : new Date();
    renderitzaCalendari();
}

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
        
        if (dataIniciSeleccionada && dataActual.getTime() === dataIniciSeleccionada.getTime()) {
            diaDiv.classList.add('dia-inici');
        }
        if (dataFiSeleccionada && dataActual.getTime() === dataFiSeleccionada.getTime()) {
            diaDiv.classList.add('dia-fi');
        }
        if (dataIniciSeleccionada && dataFiSeleccionada && dataActual > dataIniciSeleccionada && dataActual < dataFiSeleccionada) {
            diaDiv.classList.add('dia-rang');
        }

        diaDiv.addEventListener('click', () => seleccionarData(dataActual));
        diesContainer.appendChild(diaDiv);
    }
    
    document.getElementById('data-inici-seleccionada').textContent = dataIniciSeleccionada ? dataIniciSeleccionada.toLocaleDateString('ca-ES') : '--';
    document.getElementById('data-fi-seleccionada').textContent = dataFiSeleccionada ? dataFiSeleccionada.toLocaleDateString('ca-ES') : '--';
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

function aplicarFiltreData() {
    if (dataIniciSeleccionada && !dataFiSeleccionada) dataFiSeleccionada = dataIniciSeleccionada;

    if (dataIniciSeleccionada && dataFiSeleccionada) {
        filtreDataActiu.inici = dataIniciSeleccionada;
        filtreDataActiu.fi = dataFiSeleccionada;
        btnObrirFiltreData.style.borderColor = '#007bff';
        btnObrirFiltreData.style.fontWeight = 'bold';
    } else {
        netejarFiltreData();
        return;
    }
    
    filtrarResultats();
    modalFiltreData.style.display = 'none';
}

function netejarFiltreData() {
    filtreDataActiu.inici = null;
    filtreDataActiu.fi = null;
    dataIniciSeleccionada = null;
    dataFiSeleccionada = null;
    
    btnObrirFiltreData.style.borderColor = '';
    btnObrirFiltreData.style.fontWeight = '';
    
    renderitzaCalendari();
    filtrarResultats();
}