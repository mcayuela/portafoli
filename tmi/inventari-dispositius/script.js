// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, arrayUnion, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

let dispositius = [];
let paginaActual = 1;
let resultatsFiltrats = [];
const RESULTATS_PER_PAGINA = 50;

// Variables per al filtre de data
let filtreDataActiu = {
    tipus: 'dataCreacio', // 'dataCreacio' o 'dataUltimaEdicio'
    inici: null,
    fi: null
};

const cercador = document.getElementById('buscador');
const selectTipus = document.querySelector('.filtreTipus');
const resultats = document.getElementById('resultats');
const contadorDispositius = document.querySelector('.contador-dispositius');
const btnModeEditorMobil = document.getElementById('btn-mode-editor-mobil');
let modeEditor = false;

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

    // Inicialitza els listeners per al modal d'accions mòbil
    inicialitzarModalAccionsEditor();
    
    carregarDades();
});

// Carrega dades de Firebase
async function carregarDades() {
    try {
        // Carrega PCs
        const queryPCs = await getDocs(collection(db, "pcs"));
        const pcs = [];
        queryPCs.forEach((doc) => {
            const data = doc.data();
            pcs.push({
                id: data.id,
                fqdn: data.FQDN || '',
                usuari: data.usuari || '',
                departament: data.departament || '', // AFEGEIX AQUESTA LÍNIA
                model: data.model || '',
                tipusDispositiu: 'PC',
                dataAdquisicio: data.dataAdquisicio || '',
                codiTeamViewer: data.codiTeamViewer || '', // NOU CAMP
                dataCreacio: data.dataCreacio || '',
                dataUltimaEdicio: data.dataUltimaEdicio || ''
            });
        });

        // Carrega mòbils
        const queryMobils = await getDocs(collection(db, "mobils"));
        const mobils = [];
        queryMobils.forEach((doc) => {
            const data = doc.data();
            mobils.push({
                id: data.id,
                fqdn: '-',
                usuari: '',
                departament: data.departament || '', // AFEGEIX AQUESTA LÍNIA
                model: data.model || '',
                tipusDispositiu: 'Mòbil',
                dataAdquisicio: data.dataAdquisicio || '',
                dataCreacio: data.dataCreacio || '',
                dataUltimaEdicio: data.dataUltimaEdicio || ''
            });
        });

        // Carrega monitors
        const queryMonitors = await getDocs(collection(db, "monitors"));
        const monitors = [];
        queryMonitors.forEach((doc) => {
            const data = doc.data();
            monitors.push({
                id: data.id,
                fqdn: '-',
                usuari: '',
                departament: data.departament || '', // AFEGEIX AQUESTA LÍNIA
                model: data.model || data.nom || '',
                tipusDispositiu: 'Monitor',
                dataAdquisicio: data.dataAdquisicio || '',
                dataCreacio: data.dataCreacio || '',
                dataUltimaEdicio: data.dataUltimaEdicio || ''
            });
        });

        // Carrega impressores
        const queryImpressores = await getDocs(collection(db, "impressores"));
        const impressores = [];
        queryImpressores.forEach((doc) => {
            const data = doc.data();
            impressores.push({
                id: data.id,
                fqdn: '-',
                usuari: '',
                departament: data.departament || '', // AFEGEIX AQUESTA LÍNIA
                model: data.model || data.nom || '',
                tipusDispositiu: 'Impressora',
                dataAdquisicio: data.dataAdquisicio || '',
                dataCreacio: data.dataCreacio || '',
                sn: data.sn || '', // NOU CAMP
                dataUltimaEdicio: data.dataUltimaEdicio || ''
            });
        });

        // Carrega altres dispositius
        const queryAltres = await getDocs(collection(db, "altresDispositius"));
        const altres = [];
        queryAltres.forEach((doc) => {
            const data = doc.data();
            altres.push({
                id: data.id,
                fqdn: '-',
                usuari: '',
                departament: data.departament || '', // AFEGEIX AQUESTA LÍNIA
                model: data.model || data.nom || '',
                tipusDispositiu: data.tipus || 'Altres',
                dataAdquisicio: data.dataAdquisicio || '',
                dataCreacio: data.dataCreacio || '',
                dataUltimaEdicio: data.dataUltimaEdicio || ''
            });
        });

        // Combina tots els dispositius
        dispositius = [...pcs, ...mobils, ...monitors, ...impressores, ...altres];
        console.log("Total dispositius carregats:", dispositius.length);
        inicialitzaFiltres();
        filtraITipus('');
    } catch (error) {
        console.error("Error carregant dades:", error);
        if (resultats) {
            resultats.innerHTML = '<div>Error carregant dades de la base de dades.</div>';
        }
    } finally {
        amagarLoader();
    }
}

// Crea mapa tipus dispositiu
let tipusMap = {};
function inicialitzaFiltres() {
    tipusMap = {};
    dispositius.forEach(d => {
        if (!d.tipusDispositiu) return;
        tipusMap[d.tipusDispositiu] = (tipusMap[d.tipusDispositiu] || 0) + 1;
    });
    
    // Omple el select amb tipus de dispositiu
    selectTipus.innerHTML = '<option value="">Tots els tipus</option>' +
        Object.keys(tipusMap).map(tipus => 
            `<option value="${tipus}">${tipus} (${tipusMap[tipus]})</option>`
        ).join('');
}

// Quan tries tipus de dispositiu
selectTipus.addEventListener('change', function() {
    const tipus = selectTipus.value;
    filtraITipus(tipus);
});

// Filtra per tipus de dispositiu i després pel text del cercador
function filtraITipus(tipus) {
    let dadesFiltrades;
    if (!tipus) {
        dadesFiltrades = dispositius;
    } else {
        dadesFiltrades = dispositius.filter(d => d.tipusDispositiu === tipus);
    }
    
    // Aplica el filtre del cercador
    const valorCercador = cercador.value.trim().toLowerCase();
    resultatsFiltrats = filtraPerText(dadesFiltrades, valorCercador);
    paginaActual = 1;

    // Aplica el filtre de data si està actiu
    if (filtreDataActiu.inici && filtreDataActiu.fi) {
        resultatsFiltrats = resultatsFiltrats.filter(d => {
            const dataDispositiuStr = d[filtreDataActiu.tipus];
            if (!dataDispositiuStr) return false;
            try {
                const dataDispositiu = new Date(dataDispositiuStr);
                // Ajustem les hores per incloure tot el dia
                const inici = new Date(filtreDataActiu.inici);
                inici.setHours(0, 0, 0, 0);
                const fi = new Date(filtreDataActiu.fi);
                fi.setHours(23, 59, 59, 999);
                return dataDispositiu >= inici && dataDispositiu <= fi;
            } catch (e) {
                return false;
            }
        });
    }

    mostrarResultats(resultatsFiltrats, paginaActual);
}

// Filtra per text (ID, FQDN, model, tipus, usuari, departament)
function filtraPerText(llista, text) {
    if (!text) return llista;
    text = text.trim().toLowerCase();
    return llista.filter(item =>
        (item.id && item.id.toString().toLowerCase().includes(text)) ||
        (item.fqdn && item.fqdn.toLowerCase().includes(text)) ||
        (item.model && item.model.toLowerCase().includes(text)) ||
        (item.tipusDispositiu && item.tipusDispositiu.toLowerCase().includes(text)) ||
        (item.usuari && item.usuari.toLowerCase().includes(text)) ||
        (item.departament && item.departament.toLowerCase().includes(text)) // AFEGEIX AQUESTA LÍNIA
        || (item.codiTeamViewer && item.codiTeamViewer.toLowerCase().includes(text)) // NOU CAMP
    );
}

// Quan escrius al cercador, manté el filtre de tipus
cercador.addEventListener('input', function() {
    const tipus = selectTipus.value;
    filtraITipus(tipus);
});

// Funció per activar/desactivar el mode editor
function toggleEditMode() {
    modeEditor = !modeEditor;
    if (btnModeEditorMobil) {
        btnModeEditorMobil.classList.toggle('actiu', modeEditor);
    }
    mostrarResultats(resultatsFiltrats, paginaActual); // Refresca la vista
}

// Mostra resultats
function mostrarResultats(filtrats, pagina = 1) {
    resultats.innerHTML = '';
    
    // Afegeix els botons al costat del comptador
    const headerHtml = `
        <div class="header-resultats">
            <span class="comptador-text">Dispositius: ${filtrats.length}</span>
            <div class="botons-header">
                ${modeEditor ? ` 
                    <button id="btn-afegir-dispositiu" class="btn-afegir">
                        <span class="btn-afegir-text">+ Afegir dispositiu</span>
                    </button>
                    <button id="btn-exportar-csv" class="btn-editor">
                        <span class="btn-editor-text">Exportar a CSV</span>
                    </button>
                    <a href="entrega-material.html" class="btn-editor">
                        <span class="btn-editor-text">Entregues Material</span>
                    </a>
                ` : ''}
                <button id="btn-mode-editor" class="btn-editor ${modeEditor ? 'actiu' : ''}">
                    <span class="btn-editor-text">${modeEditor ? 'Tancar Edició' : 'Mode Editor'}</span>
                </button>
            </div>
        </div>
    `;
    contadorDispositius.innerHTML = headerHtml;
    
    // Assignem events als botons que acabem de crear
    const btnModeEditor = document.getElementById('btn-mode-editor');
    if (btnModeEditor) {
        btnModeEditor.addEventListener('click', toggleEditMode);
    }

    if (modeEditor) {
        const btnAfegir = document.getElementById('btn-afegir-dispositiu');
        if (btnAfegir) {
            btnAfegir.addEventListener('click', mostrarModalSeleccioDispositiu);
        }

        const btnExportar = document.getElementById('btn-exportar-csv');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => exportarACSV(filtrats));
        }
    }

    if (!filtrats.length) {
        resultats.innerHTML = '<div>No s\'han trobat resultats.</div>';
        return;
    }
    
    const inici = (pagina - 1) * RESULTATS_PER_PAGINA;
    const final = inici + RESULTATS_PER_PAGINA;
    const paginaDades = filtrats.slice(inici, final);

    // Taula de resultats amb la nova columna Departament
    let html = `<table class="taula-resultats">
        <thead>
            <tr>
                <th>ID</th>
                <th>FQDN</th>
                <th>Usuari</th>
                <th>Departament</th>
                <th>Model</th>
                <th>Tipus</th>
                <th>Data Adquisició</th>
                <th>Data Creació</th>
                <th>Última Edició</th>
                ${modeEditor ? '<th class="col-accions">Accions</th>' : ''}
            </tr>
        </thead>
        <tbody>
    `;
    
    const formataDataHora = (dataString) => {
        if (!dataString) return '';
        try {
            const data = new Date(dataString);
            return data.toLocaleString('ca-ES');
        } catch (e) {
            return dataString;
        }
    };

    for (const item of paginaDades) {
        // Formata la data si existeix
        let dataFormatada = '';
        if (item.dataAdquisicio) {
            try {
                const data = new Date(item.dataAdquisicio);
                dataFormatada = data.toLocaleDateString('ca-ES');
            } catch (e) {
                dataFormatada = item.dataAdquisicio;
            }
        }
        
        html += `<tr>
            <td><a href="dispositiu.html?id=${item.id}&tipus=${item.tipusDispositiu}" class="link-dispositiu">${item.id || ''}</a></td>
            <td><a href="dispositiu.html?id=${item.id}" class="link-dispositiu">${item.fqdn || ''}</a></td>
            <td>${item.usuari || 'N/A'}</td>
            <td>${item.departament || 'N/A'}</td>
            <td>${item.model || ''}</td>
            <td>${item.tipusDispositiu || ''}</td>
            <td>${dataFormatada}</td>
            <td>${formataDataHora(item.dataCreacio)}</td>
            <td>${formataDataHora(item.dataUltimaEdicio)}</td>
            ${modeEditor ? `<td class="accions-cell">
                <button class="btn-editar" data-id="${item.id}" data-tipus="${item.tipusDispositiu}" title="Editar dispositiu">✎</button>
                <button class="btn-imprimir" data-id="${item.id}" data-tipus="${item.tipusDispositiu}" data-model="${item.model || ''}" data-data="${item.dataAdquisicio || ''}" title="Imprimir etiqueta">🖨️</button>
                <button class="btn-borrar" data-id="${item.id}" data-tipus="${item.tipusDispositiu}" title="Borrar dispositiu">×</button>
            </td>` : ''}
        </tr>`;
    }
    html += '</tbody></table>';
    resultats.innerHTML = html;

    // Event listeners per als botons de l'editor
    if (modeEditor) {
        resultats.querySelectorAll('.btn-borrar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const tipus = this.dataset.tipus;
                mostrarModalConfirmacio(id, tipus);
            });
        });

        resultats.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const tipus = this.dataset.tipus;
                editarDispositiu(id, tipus);
            });
        });

        // EVENT LISTENER PER AL BOTÓ D'IMPRESSIÓ - AFEGEIX AIXÒ:
        resultats.querySelectorAll('.btn-imprimir').forEach(btn => {
            btn.addEventListener('click', function() {
                const dispositiu = {
                    id: this.dataset.id,
                    tipusDispositiu: this.dataset.tipus,
                    model: this.dataset.model,
                    dataAdquisicio: this.dataset.data
                };
                
                obreQRAPestanya(dispositiu);
            });
        });
    }

    // Paginació (el mateix codi que tenies)
    const totalPagines = Math.ceil(filtrats.length / RESULTATS_PER_PAGINA);
    if (totalPagines > 1) {
        let paginacioHtml = `<div class="paginacio">`;
        paginacioHtml += `<button class="paginacio-btn" data-pagina="${pagina - 1}" ${pagina === 1 ? 'disabled' : ''}>&lt;</button>`;
        paginacioHtml += `<span class="paginacio-info">Pàgina ${pagina} de ${totalPagines}</span>`;
        paginacioHtml += `<button class="paginacio-btn" data-pagina="${pagina + 1}" ${pagina === totalPagines ? 'disabled' : ''}>&gt;</button>`;
        paginacioHtml += `</div>`;
        resultats.innerHTML += paginacioHtml;

        // Event listeners per als botons de paginació
        resultats.querySelectorAll('.paginacio-btn').forEach(btn => {
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

// --- LÒGICA DEL MODAL D'ACCIONS DE L'EDITOR (MÒBIL) ---

function inicialitzarModalAccionsEditor() {
    const modal = document.getElementById('modal-accions-editor');
    if (!modal) return;

    const btnObrir = document.getElementById('btn-mode-editor-mobil');
    const btnTancar = document.getElementById('btn-tancar-accions');
    const btnAccioAfegir = document.getElementById('btn-accio-afegir');
    const btnAccioExportar = document.getElementById('btn-accio-exportar');
    const btnAccioEntregues = document.getElementById('btn-accio-entregues');
    const btnAccioEditarTaula = document.getElementById('btn-accio-editar-taula');

    btnObrir.addEventListener('click', () => {
        // Actualitza l'estat del botó abans de mostrar el modal
        btnAccioEditarTaula.classList.toggle('actiu', modeEditor);
        btnAccioEditarTaula.innerHTML = `<span>✏️</span> ${modeEditor ? 'Desactivar Edició' : 'Activar Edició a la Taula'}`;
        modal.style.display = 'flex';
    });

    btnTancar.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    btnAccioAfegir.addEventListener('click', () => {
        mostrarModalSeleccioDispositiu();
        modal.style.display = 'none';
    });

    btnAccioExportar.addEventListener('click', () => exportarACSV(resultatsFiltrats));
    btnAccioEntregues.addEventListener('click', () => window.location.href = 'entrega-material.html');

    // Afegeix el listener per al botó d'editar taula
    if (btnAccioEditarTaula) {
        btnAccioEditarTaula.addEventListener('click', toggleEditMode);
    }
}

// --- LÒGICA DEL FILTRE DE DATA I CALENDARI ---

const btnObrirFiltreData = document.getElementById('btn-obrir-filtre-data');
const modalFiltreData = document.getElementById('modal-filtre-data');
const btnCancelarFiltre = document.getElementById('btn-cancelar-filtre-data');
const btnAplicarFiltre = document.getElementById('btn-aplicar-filtre-data');
const btnNetejarFiltre = document.getElementById('btn-netejar-filtre-data');
const btnFiltreTipusCreacio = document.getElementById('btn-filtre-tipus-creacio');
const btnFiltreTipusEdicio = document.getElementById('btn-filtre-tipus-edicio');


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

    const primerDiaMes = (dataCalendari.getDay() + 6) % 7; // Dll=0, Dm=1...
    const diesEnMes = new Date(any, mes + 1, 0).getDate();

    diesContainer.innerHTML = '';

    for (let i = 0; i < primerDiaMes; i++) {
        diesContainer.innerHTML += `<div class="dia-buit"></div>`;
    }

    for (let i = 1; i <= diesEnMes; i++) {
        const diaDiv = document.createElement('div');
        diaDiv.textContent = i;
        const dataActual = new Date(any, mes, i);

        // Classes per estils
        if (dataActual.toDateString() === new Date().toDateString()) {
            diaDiv.classList.add('dia-avui');
        }
        if (dataIniciSeleccionada && dataActual.getTime() === dataIniciSeleccionada.getTime()) {
            diaDiv.classList.add('dia-inici');
        }
        if (dataFiSeleccionada && dataActual.getTime() === dataFiSeleccionada.getTime()) {
            diaDiv.classList.add('dia-fi');
        }
        if (dataIniciSeleccionada && dataFiSeleccionada && dataActual > dataIniciSeleccionada && dataActual < dataFiSeleccionada) {
            diaDiv.classList.add('dia-rang');
        }

        diaDiv.addEventListener('click', () => {
            seleccionarData(dataActual);
        });
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
    // Restaura l'estat del modal a l'estat del filtre actiu
    dataIniciSeleccionada = filtreDataActiu.inici;
    dataFiSeleccionada = filtreDataActiu.fi;
    
    // Actualitza l'estat dels botons de selecció de tipus de data
    btnFiltreTipusCreacio.classList.toggle('seleccionat', filtreDataActiu.tipus === 'dataCreacio');
    btnFiltreTipusEdicio.classList.toggle('seleccionat', filtreDataActiu.tipus === 'dataUltimaEdicio');
    if (!btnFiltreTipusCreacio.classList.contains('seleccionat') && !btnFiltreTipusEdicio.classList.contains('seleccionat')) {
        btnFiltreTipusCreacio.classList.add('seleccionat'); // Selecciona creació per defecte
    }

    seleccionantInici = !(dataIniciSeleccionada && dataFiSeleccionada);
    dataCalendari = dataIniciSeleccionada ? new Date(dataIniciSeleccionada) : new Date();
    renderitzaCalendari();
});

btnCancelarFiltre.addEventListener('click', () => {
    modalFiltreData.style.display = 'none';
});

btnAplicarFiltre.addEventListener('click', () => {
    if (dataIniciSeleccionada && !dataFiSeleccionada) {
        dataFiSeleccionada = dataIniciSeleccionada; // Si només hi ha una data, el rang és d'un dia
    }

    if (dataIniciSeleccionada && dataFiSeleccionada) {
        filtreDataActiu.inici = dataIniciSeleccionada;
        filtreDataActiu.fi = dataFiSeleccionada;
        filtreDataActiu.tipus = document.querySelector('.opcions-data-btn-group .seleccionat').dataset.tipus;
        btnObrirFiltreData.style.borderColor = '#007bff'; // Indica que el filtre està actiu
        btnObrirFiltreData.style.fontWeight = 'bold';
    } else {
        // Si no hi ha dates seleccionades, neteja el filtre
        filtreDataActiu.inici = null;
        filtreDataActiu.fi = null;
        btnObrirFiltreData.style.borderColor = '';
        btnObrirFiltreData.style.fontWeight = '';
    }
    
    filtraITipus(selectTipus.value);
    modalFiltreData.style.display = 'none';
});

btnNetejarFiltre.addEventListener('click', () => {
    dataIniciSeleccionada = null;
    dataFiSeleccionada = null;
    seleccionantInici = true;
    
    // Neteja també el filtre actiu
    filtreDataActiu.inici = null;
    filtreDataActiu.fi = null;
    btnObrirFiltreData.style.borderColor = '';
    btnObrirFiltreData.style.fontWeight = '';

    renderitzaCalendari();
    filtraITipus(selectTipus.value); // Re-filtra sense data
});

btnFiltreTipusCreacio.addEventListener('click', () => {
    btnFiltreTipusCreacio.classList.add('seleccionat');
    btnFiltreTipusEdicio.classList.remove('seleccionat');
});

btnFiltreTipusEdicio.addEventListener('click', () => {
    btnFiltreTipusEdicio.classList.add('seleccionat');
    btnFiltreTipusCreacio.classList.remove('seleccionat');
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


// Mostra modal de confirmació per borrar
function mostrarModalConfirmacio(id, tipus) {
    // Crea el modal de confirmació
    const modal = document.createElement('div');
    modal.id = 'modal-confirmacio-borrar';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-confirmacio">
            <h3 class="modal-titol-borrar">Confirmar eliminació</h3>
            <p class="modal-text">Estàs segur que vols borrar el dispositiu <strong>${tipus} - ID: ${id}</strong>?</p>
            <p class="modal-warning">Aquesta acció no es pot desfer.</p>
            <div class="modal-botons">
                <button id="btn-confirmar-borrar" class="btn-confirmar">Sí, borrar</button>
                <button id="btn-cancelar-borrar" class="btn-cancelar">Cancel·lar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners per als botons del modal
    document.getElementById('btn-confirmar-borrar').addEventListener('click', () => {
        borrarDispositiu(id, tipus);
        document.body.removeChild(modal);
    });
    
    document.getElementById('btn-cancelar-borrar').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Tancar modal clicant fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Borra dispositiu de la base de dades
async function borrarDispositiu(id, tipus) {
    try {
        let col·leccio;
        
        // Determina la col·lecció segons el tipus
        switch (tipus) {
            case 'PC':
                col·leccio = 'pcs';
                break;
            case 'Mòbil':
                col·leccio = 'mobils';  // Canviat
                break;
            case 'Monitor':
                col·leccio = 'monitors';  // Afegit
                break;
            case 'Impressora':
                col·leccio = 'impressores';  // Afegit
                break;
            default:
                col·leccio = 'altresDispositius';
                break;
        }
        
        // Borra de Firebase
        await deleteDoc(doc(db, col·leccio, id.toString()));
    
        // Recarrega les dades
        await carregarDades();
        
    } catch (error) {
        console.error('Error borrant dispositiu:', error);
        alert('Error borrant el dispositiu. Comprova la connexió.');
    }
}

// Funció per exportar a CSV
function exportarACSV(dades) {
    if (!dades.length) {
        alert("No hi ha dades per exportar.");
        return;
    }

    // Defineix les capçaleres del CSV
    const capcaleres = [
        "ID",
        "FQDN",
        "Usuari",
        "Departament",
        "Model",
        "TipusDispositiu",
        "DataAdquisicio"
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
    const filesCSV = dades.map(fila => {
        // Mapeja manualment per assegurar que les claus són correctes
        const filaCSV = [
            escapa(fila.id), escapa(fila.fqdn), escapa(fila.usuari),
            escapa(fila.departament), escapa(fila.model), escapa(fila.tipusDispositiu),
            escapa(fila.dataAdquisicio)
        ].join(',');
        return filaCSV;
    });
    
    // Afegeix la fila de capçaleres al principi
    const contingutCSV = [capcaleres.join(',')].concat(filesCSV).join('\n');

    // Crea i descarrega l'arxiu
    const blob = new Blob([contingutCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    // Genera el nom de l'arxiu dinàmicament
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const any = now.getFullYear();
    const hores = String(now.getHours()).padStart(2, '0');
    const minuts = String(now.getMinutes()).padStart(2, '0');
    const nomFitxer = `Inventari_${dia}-${mes}-${any}_${hores}h${minuts}.csv`;

    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", nomFitxer);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funció per editar dispositiu
async function editarDispositiu(id, tipus) {
    try {
        let col·leccio;
        
        // Determina la col·lecció segons el tipus
        switch (tipus) {
            case 'PC':
                col·leccio = 'pcs';
                break;
            case 'Mòbil':
                col·leccio = 'mobils';  // Canviat
                break;
            case 'Monitor':
                col·leccio = 'monitors';  // Afegit
                break;
            case 'Impressora':
                col·leccio = 'impressores';  // Afegit
                break;
            default:
                col·leccio = 'altresDispositius';
                break;
        }
        
        // Obtén les dades actuals del dispositiu
        const docRef = doc(db, col·leccio, id.toString());
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const dades = docSnap.data();
            mostrarModalEdicio(id, tipus, dades, col·leccio);
        } else {
            alert('No s\'han trobat les dades del dispositiu');
        }
    } catch (error) {
        console.error('Error obtenint dades del dispositiu:', error);
        alert('Error carregant les dades del dispositiu');
    }
}

// Mostra modal d'edició
function mostrarModalEdicio(id, tipus, dades, col·leccio) {
    const modal = document.createElement('div');
    modal.id = 'modal-edicio-dispositiu';
    modal.className = 'modal-overlay';
    
    // Genera els camps segons el tipus de dispositiu
    let campsHTML = '';
    
    if (tipus === 'PC') {
        campsHTML = `
            <div class="camp-edicio">
                <label for="edit-id">ID:</label>
                <input type="text" id="edit-id" value="${dades.id || ''}" readonly>
            </div>
            <div class="camp-edicio">
                <label for="edit-fqdn">FQDN:</label>
                <input type="text" id="edit-fqdn" value="${dades.FQDN || ''}" required>
            </div>
            <div class="camp-edicio">
                <label for="edit-usuari">Usuari:</label>
                <input type="text" id="edit-usuari" value="${dades.usuari || ''}">
            </div>
            <div class="camp-edicio"> <!-- NOU CAMP -->
                <label for="edit-teamviewer">Codi TeamViewer:</label>
                <input type="text" id="edit-teamviewer" value="${dades.codiTeamViewer || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-departament">Departament:</label>
                <input type="text" id="edit-departament" value="${dades.departament || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-model">Model:</label>
                <input type="text" id="edit-model" value="${dades.model || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-processador">Processador:</label>
                <input type="text" id="edit-processador" value="${dades.processador || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-targeta-grafica">Targeta Gràfica:</label>
                <input type="text" id="edit-targeta-grafica" value="${dades.targetaGrafica || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-so">Sistema Operatiu:</label>
                <input type="text" id="edit-so" value="${dades.sistemaOperatiu || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-ram">Memòria RAM:</label>
                <input type="text" id="edit-ram" value="${dades.memoriaRAM || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-emmagatzematge">Emmagatzematge:</label>
                <input type="text" id="edit-emmagatzematge" value="${dades.dataAdquisicio || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-data">Data d'Adquisició:</label>
                <input type="date" id="edit-data" value="${dades.dataAdquisicio || ''}">
            </div>
        `;
    } else if (tipus === 'Mòbil') {
        campsHTML = `
            <div class="camp-edicio">
                <label for="edit-id">ID:</label>
                <input type="text" id="edit-id" value="${dades.id || ''}" readonly>
            </div>
            <div class="camp-edicio">
                <label for="edit-departament">Departament:</label>
                <input type="text" id="edit-departament" value="${dades.departament || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-model">Model:</label>
                <input type="text" id="edit-model" value="${dades.model || ''}" required>
            </div>
            <div class="camp-edicio">
                <label for="edit-ram">Memòria RAM:</label>
                <input type="text" id="edit-ram" value="${dades.memoriaRAM || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-interna">Memòria Interna:</label>
                <input type="text" id="edit-interna" value="${dades.memoriaInterna || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-sn">SN:</label>
                <input type="text" id="edit-sn" value="${dades.sn || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-imei1">IMEI 1:</label>
                <input type="text" id="edit-imei1" value="${dades.imei1 || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-imei2">IMEI 2:</label>
                <input type="text" id="edit-imei2" value="${dades.imei2 || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-mail">Mail registre:</label>
                <input type="email" id="edit-mail" value="${dades.mailRegistre || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-data">Data d'Adquisició:</label>
                <input type="date" id="edit-data" value="${dades.dataAdquisicio || ''}">
            </div>
        `;
    } else if (tipus === 'Impressora') {
        campsHTML = `
            <div class="camp-edicio">
                <label for="edit-id">ID:</label>
                <input type="text" id="edit-id" value="${dades.id || ''}" readonly>
            </div>
            <div class="camp-edicio">
                <label for="edit-nom">Nom:</label>
                <input type="text" id="edit-nom" value="${dades.nom || ''}" required>
            </div>
            <div class="camp-edicio">
                <label for="edit-departament">Departament:</label>
                <input type="text" id="edit-departament" value="${dades.departament || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-model">Model:</label>
                <input type="text" id="edit-model" value="${dades.model || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-sn">SN:</label>
                <input type="text" id="edit-sn" value="${dades.sn || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-data">Data d'Adquisició:</label>
                <input type="date" id="edit-data" value="${dades.dataAdquisicio || ''}">
            </div>
        `;
    } else {
        campsHTML = `
            <div class="camp-edicio">
                <label for="edit-id">ID:</label>
                <input type="text" id="edit-id" value="${dades.id || ''}" readonly>
            </div>
            <div class="camp-edicio">
                <label for="edit-nom">Nom:</label>
                <input type="text" id="edit-nom" value="${dades.nom || ''}" required>
            </div>
            <div class="camp-edicio">
                <label for="edit-departament">Departament:</label>
                <input type="text" id="edit-departament" value="${dades.departament || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-model">Model:</label>
                <input type="text" id="edit-model" value="${dades.model || ''}">
            </div>
            <div class="camp-edicio">
                <label for="edit-tipus">Tipus:</label>
                <select id="edit-tipus">
                    <option value="Monitor" ${dades.tipus === 'Monitor' ? 'selected' : ''}>Monitor</option>
                    <option value="Impressora" ${dades.tipus === 'Impressora' ? 'selected' : ''}>Impressora</option>
                    <option value="Altres" ${dades.tipus === 'Altres' ? 'selected' : ''}>Altres</option>
                </select>
            </div>
            <div class="camp-edicio">
                <label for="edit-data">Data d'Adquisició:</label>
                <input type="date" id="edit-data" value="${dades.dataAdquisicio || ''}">
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-edicio">
            <h3 class="modal-titol-edicio">Editar ${tipus} - ID: ${id}</h3>
            <form id="form-edicio-dispositiu" class="form-edicio">
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
    
    document.getElementById('form-edicio-dispositiu').addEventListener('submit', (e) => {
        e.preventDefault();
        guardarCanvisDispositiu(id, tipus, col·leccio, modal);
    });
    
    // Tancar modal clicant fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Guarda els canvis del dispositiu
async function guardarCanvisDispositiu(id, tipus, col·leccio, modal) {
    try {
        let dadesActualitzades = {};
        
        if (tipus === 'PC') {
            dadesActualitzades = {
                id: document.getElementById('edit-id').value,
                FQDN: document.getElementById('edit-fqdn').value,
                usuari: document.getElementById('edit-usuari').value,
                departament: document.getElementById('edit-departament').value, // AFEGEIX AQUESTA LÍNIA
                model: document.getElementById('edit-model').value,
                processador: document.getElementById('edit-processador').value,
                targetaGrafica: document.getElementById('edit-targeta-grafica').value,
                sistemaOperatiu: document.getElementById('edit-so').value,
                memoriaRAM: document.getElementById('edit-ram').value,
                emmagatzematge: document.getElementById('edit-emmagatzematge').value, // Corregit: era dataAdquisicio
                codiTeamViewer: document.getElementById('edit-teamviewer').value, // NOU CAMP
                dataAdquisicio: document.getElementById('edit-data').value,
                dataUltimaEdicio: new Date().toISOString()
            };
        } else if (tipus === 'Mòbil') {
            dadesActualitzades = {
                id: document.getElementById('edit-id').value,
                departament: document.getElementById('edit-departament').value, // AFEGEIX AQUESTA LÍNIA
                model: document.getElementById('edit-model').value,
                memoriaRAM: document.getElementById('edit-ram').value,
                memoriaInterna: document.getElementById('edit-interna').value,
                sn: document.getElementById('edit-sn').value,
                imei1: document.getElementById('edit-imei1').value,
                imei2: document.getElementById('edit-imei2').value,
                mailRegistre: document.getElementById('edit-mail').value,
                dataAdquisicio: document.getElementById('edit-data').value,
                dataUltimaEdicio: new Date().toISOString()
            };
        } else if (tipus === 'Impressora') {
            dadesActualitzades = {
                id: document.getElementById('edit-id').value,
                nom: document.getElementById('edit-nom').value,
                departament: document.getElementById('edit-departament').value,
                model: document.getElementById('edit-model').value,
                sn: document.getElementById('edit-sn').value, // NOU CAMP
                tipus: 'Impressora',
                dataAdquisicio: document.getElementById('edit-data').value,
                dataUltimaEdicio: new Date().toISOString()
            };
            col·leccio = 'impressores'; // Assegurem la col·lecció correcta
        } else {
            dadesActualitzades = {
                id: document.getElementById('edit-id').value,
                nom: document.getElementById('edit-nom').value,
                departament: document.getElementById('edit-departament').value, // AFEGEIX AQUESTA LÍNIA
                model: document.getElementById('edit-model').value,
                tipus: document.getElementById('edit-tipus').value,
                dataAdquisicio: document.getElementById('edit-data').value,
                dataUltimaEdicio: new Date().toISOString()
            };
        }
        
        // Actualitza a Firebase
        const docRef = doc(db, col·leccio, id.toString());
        await updateDoc(docRef, dadesActualitzades);
        
        // Mostra missatge d'èxit
        alert(`${tipus} amb ID: ${id} actualitzat correctament!`);
        
        // Tanca el modal
        document.body.removeChild(modal);
        
        // Recarrega les dades
        await carregarDades();
        
    } catch (error) {
        console.error('Error actualitzant dispositiu:', error);
        alert(`Error actualitzant el dispositiu: ${error.message}`);
    }
}

// Mostra modal de selecció de tipus de dispositiu
function mostrarModalSeleccioDispositiu() {
    const modal = document.createElement('div');
    modal.id = 'modal-seleccio-dispositiu';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-seleccio">
            <h3 class="modal-titol-seleccio">Selecciona el tipus de dispositiu</h3>
            <div class="botons-seleccio">
                <button class="btn-tipus-dispositiu" data-tipus="PC">
                    <span class="icono-dispositiu">💻</span>
                    <span class="nom-dispositiu">PC</span>
                </button>
                <button class="btn-tipus-dispositiu" data-tipus="Mòbil">
                    <span class="icono-dispositiu">📱</span>
                    <span class="nom-dispositiu">Mòbil</span>
                </button>
                <button class="btn-tipus-dispositiu" data-tipus="Monitor">
                    <span class="icono-dispositiu">🖥️</span>
                    <span class="nom-dispositiu">Monitor</span>
                </button>
                <button class="btn-tipus-dispositiu" data-tipus="Impressora">
                    <span class="icono-dispositiu">🖨️</span>
                    <span class="nom-dispositiu">Impressora</span>
                </button>
                <button class="btn-tipus-dispositiu" data-tipus="Altres">
                    <span class="icono-dispositiu">⚙️</span>
                    <span class="nom-dispositiu">Altres</span>
                </button>
            </div>
            <div class="modal-botons">
                <button id="btn-cancelar-seleccio" class="btn-cancelar">Cancel·lar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners per als botons de tipus
    modal.querySelectorAll('.btn-tipus-dispositiu').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipus = this.dataset.tipus;
            document.body.removeChild(modal);
            mostrarModalAfegirDispositiu(tipus);
        });
    });
    
    // Event listener per al botó de cancel·lar
    document.getElementById('btn-cancelar-seleccio').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Tancar modal clicant fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Mostra modal per afegir dispositiu segons el tipus
function mostrarModalAfegirDispositiu(tipus) {
    const modal = document.createElement('div');
    modal.id = 'modal-afegir-dispositiu';
    modal.className = 'modal-overlay';
    
    // Genera els camps segons el tipus de dispositiu
    let campsHTML = '';
    
    if (tipus === 'PC') {
        campsHTML = `
            <div class="camp-edicio">
                <label for="add-id">ID:</label>
                <input type="text" id="add-id" required>
            </div>
            <div class="camp-edicio">
                <label for="add-fqdn">FQDN:</label>
                <input type="text" id="add-fqdn" required>
            </div>
            <div class="camp-edicio">
                <label for="add-usuari">Usuari:</label>
                <input type="text" id="add-usuari">
            </div>
            <div class="camp-edicio"> <!-- NOU CAMP -->
                <label for="add-teamviewer">Codi TeamViewer:</label>
                <input type="text" id="add-teamviewer">
            </div>
            <div class="camp-edicio">
                <label for="add-departament">Departament:</label>
                <input type="text" id="add-departament">
            </div>
            <div class="camp-edicio">
                <label for="add-model">Model:</label>
                <input type="text" id="add-model">
            </div>
            <div class="camp-edicio">
                <label for="add-processador">Processador:</label>
                <input type="text" id="add-processador">
            </div>
            <div class="camp-edicio">
                <label for="add-targeta-grafica">Targeta Gràfica:</label>
                <input type="text" id="add-targeta-grafica">
            </div>
            <div class="camp-edicio">
                <label for="add-so">Sistema Operatiu:</label>
                <input type="text" id="add-so">
            </div>
            <div class="camp-edicio">
                <label for="add-ram">Memòria RAM:</label>
                <input type="text" id="add-ram">
            </div>
            <div class="camp-edicio">
                <label for="add-emmagatzematge">Emmagatzematge:</label>
                <input type="text" id="add-emmagatzematge">
            </div>
            <div class="camp-edicio">
                <label for="add-data">Data d'Adquisició:</label>
                <input type="date" id="add-data">
            </div>
        `;
    } else if (tipus === 'Mòbil') {
        campsHTML = `
            <div class="camp-edicio">
                <label for="add-id">ID:</label>
                <input type="text" id="add-id" required>
            </div>
            <div class="camp-edicio">
                <label for="add-departament">Departament:</label>
                <input type="text" id="add-departament">
            </div>
            <div class="camp-edicio">
                <label for="add-model">Model:</label>
                <input type="text" id="add-model" required>
            </div>
            <div class="camp-edicio">
                <label for="add-ram">Memòria RAM:</label>
                <input type="text" id="add-ram">
            </div>
            <div class="camp-edicio">
                <label for="add-interna">Memòria Interna:</label>
                <input type="text" id="add-interna">
            </div>
            <div class="camp-edicio">
                <label for="add-sn">SN:</label>
                <input type="text" id="add-sn">
            </div>
            <div class="camp-edicio">
                <label for="add-imei1">IMEI 1:</label>
                <input type="text" id="add-imei1">
            </div>
            <div class="camp-edicio">
                <label for="add-imei2">IMEI 2:</label>
                <input type="text" id="add-imei2">
            </div>
            <div class="camp-edicio">
                <label for="add-mail">Mail registre:</label>
                <input type="email" id="add-mail">
            </div>
            <div class="camp-edicio">
                <label for="add-data">Data d'Adquisició:</label>
                <input type="date" id="add-data">
            </div>
        `;
    } else if (tipus === 'Monitor') {
        campsHTML = `
            <div class="camp-edicio">
                <label for="add-id">ID:</label>
                <input type="text" id="add-id" required>
            </div>
            <div class="camp-edicio">
                <label for="add-nom">Nom:</label>
                <input type="text" id="add-nom" required>
            </div>
            <div class="camp-edicio">
                <label for="add-departament">Departament:</label>
                <input type="text" id="add-departament">
            </div>
            <div class="camp-edicio">
                <label for="add-model">Model:</label>
                <input type="text" id="add-model">
            </div>
            <div class="camp-edicio">
                <label for="add-sn">SN:</label>
                <input type="text" id="add-sn">
            </div>
            <div class="camp-edicio">
                <label for="add-data">Data d'Adquisició:</label>
                <input type="date" id="add-data">
            </div>
        `;
    } else if (tipus === 'Impressora') {
        campsHTML = `
            <div class="camp-edicio">
                <label for="add-id">ID:</label>
                <input type="text" id="add-id" required>
            </div>
            <div class="camp-edicio">
                <label for="add-nom">Nom:</label>
                <input type="text" id="add-nom" required>
            </div>
            <div class="camp-edicio">
                <label for="add-departament">Departament:</label>
                <input type="text" id="add-departament">
            </div>
            <div class="camp-edicio">
                <label for="add-model">Model:</label>
                <input type="text" id="add-model">
            </div>
            <div class="camp-edicio">
                <label for="add-sn">SN:</label>
                <input type="text" id="add-sn">
            </div>
            <div class="camp-edicio">
                <label for="add-data">Data d'Adquisició:</label>
                <input type="date" id="add-data">
            </div>
        `;
    } else {
        campsHTML = `
            <div class="camp-edicio">
                <label for="add-id">ID:</label>
                <input type="text" id="add-id" required>
            </div>
            <div class="camp-edicio">
                <label for="add-nom">Nom:</label>
                <input type="text" id="add-nom" required>
            </div>
            <div class="camp-edicio">
                <label for="add-departament">Departament:</label>
                <input type="text" id="add-departament">
            </div>
            <div class="camp-edicio">
                <label for="add-model">Model:</label>
                <input type="text" id="add-model">
            </div>
            <div class="camp-edicio">
                <label for="add-tipus">Tipus:</label>
                <select id="add-tipus">
                    <option value="Monitor" ${tipus === 'Monitor' ? 'selected' : ''}>Monitor</option>
                    <option value="Impressora" ${tipus === 'Impressora' ? 'selected' : ''}>Impressora</option>
                    <option value="Altres" ${tipus === 'Altres' ? 'selected' : ''}>Altres</option>
                </select>
            </div>
            <div class="camp-edicio">
                <label for="add-data">Data d'Adquisició:</label>
                <input type="date" id="add-data">
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-edicio">
            <h3 class="modal-titol-edicio">Afegir ${tipus}</h3>
            <form id="form-afegir-dispositiu" class="form-edicio">
                ${campsHTML}
                <div class="modal-botons">
                    <button type="submit" class="btn-guardar">Afegir dispositiu</button>
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
    
    document.getElementById('form-afegir-dispositiu').addEventListener('submit', (e) => {
        e.preventDefault();
        afegirNouDispositiu(tipus, modal);
    });
    
    // Tancar modal clicant fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Afegeix nou dispositiu a Firebase
async function afegirNouDispositiu(tipus, modal) {
    try {
        let nouDispositiu = {};
        let col·leccio = '';
        
        const dataActual = new Date().toISOString();

        if (tipus === 'PC') {
            col·leccio = 'pcs';
            nouDispositiu = {
                id: document.getElementById('add-id').value,
                FQDN: document.getElementById('add-fqdn').value,
                usuari: document.getElementById('add-usuari').value,
                departament: document.getElementById('add-departament').value, // AFEGEIX
                model: document.getElementById('add-model').value,
                processador: document.getElementById('add-processador').value,
                targetaGrafica: document.getElementById('add-targeta-grafica').value,
                sistemaOperatiu: document.getElementById('add-so').value,
                memoriaRAM: document.getElementById('add-ram').value,
                emmagatzematge: document.getElementById('add-emmagatzematge').value, // Corregit: era dataAdquisicio
                codiTeamViewer: document.getElementById('add-teamviewer').value, // NOU CAMP
                dataAdquisicio: document.getElementById('add-data').value,
                dataCreacio: dataActual,
                dataUltimaEdicio: dataActual
            };
        } else if (tipus === 'Mòbil') {
            col·leccio = 'mobils';
            nouDispositiu = {
                id: document.getElementById('add-id').value,
                departament: document.getElementById('add-departament').value, // AFEGEIX
                model: document.getElementById('add-model').value,
                memoriaRAM: document.getElementById('add-ram').value,
                memoriaInterna: document.getElementById('add-interna').value,
                sn: document.getElementById('add-sn').value,
                imei1: document.getElementById('add-imei1').value,
                imei2: document.getElementById('add-imei2').value,
                mailRegistre: document.getElementById('add-mail').value,
                dataAdquisicio: document.getElementById('add-data').value,
                dataCreacio: dataActual,
                dataUltimaEdicio: dataActual
            };
        } else if (tipus === 'Monitor') {
            col·leccio = 'monitors';
            nouDispositiu = {
                id: document.getElementById('add-id').value,
                nom: document.getElementById('add-nom').value,
                departament: document.getElementById('add-departament').value, // AFEGEIX
                model: document.getElementById('add-model').value,
                tipus: 'Monitor',
                dataAdquisicio: document.getElementById('add-data').value,
                dataCreacio: dataActual,
                dataUltimaEdicio: dataActual
            };
        } else if (tipus === 'Impressora') {
            col·leccio = 'impressores';
            nouDispositiu = {
                id: document.getElementById('add-id').value,
                nom: document.getElementById('add-nom').value,
                departament: document.getElementById('add-departament').value, // AFEGEIX
                model: document.getElementById('add-model').value,
                sn: document.getElementById('add-sn').value, // NOU CAMP
                tipus: 'Impressora',
                dataAdquisicio: document.getElementById('add-data').value,
                dataCreacio: dataActual,
                dataUltimaEdicio: dataActual
            };
        } else {
            col·leccio = 'altresDispositius';
            nouDispositiu = {
                id: document.getElementById('add-id').value,
                nom: document.getElementById('add-nom').value,
                departament: document.getElementById('add-departament').value, // AFEGEIX
                model: document.getElementById('add-model').value,
                tipus: document.getElementById('add-tipus').value,
                dataAdquisicio: document.getElementById('add-data').value,
                dataCreacio: dataActual,
                dataUltimaEdicio: dataActual
            };
        }
        
        // Afegeix a Firebase
        const docRef = doc(db, col·leccio, nouDispositiu.id);
        await setDoc(docRef, nouDispositiu);
        
        // Mostra missatge d'èxit
        alert(`${tipus} amb ID: ${nouDispositiu.id} afegit correctament!`);
        
        // Tanca el modal
        document.body.removeChild(modal);
        
        // Recarrega les dades
        await carregarDades();
    } catch (error) {
        console.error('Error afegint dispositiu:', error);
        alert(`Error afegint el dispositiu: ${error.message}`);
    }
}

// Funcions per a la impressió d'etiquetes QR
function formatDataAdqMMYY(dataString) {
    if (!dataString) return 'N/A';
    try {
        const data = new Date(dataString);
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const any = String(data.getFullYear()).slice(-2);
        return `${mes}${any}`;
    } catch (e) {
        return 'N/A';
    }
}

function generaQRDispositiu(pc, destEl) {
    destEl.innerHTML = '';
    const id = pc.id;
    const mmYY = formatDataAdqMMYY(pc.dataAdquisicio);
    const textVisual = `${id}/${mmYY}`;
    // Torna a la URL original:
    const url = `https://mcayuela.com/tmi/inventari-dispositius/dispositiu?id=${pc.id}`;

    const tmpDiv = document.createElement('div');
    new QRCode(tmpDiv, {
        text: url,
        width: 240,
        height: 240,
        correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
        const qrImg = tmpDiv.querySelector('img') || tmpDiv.querySelector('canvas');
        const qrSize = 240;
        const pad = 20;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Logo dimensions
        let logoWidth = qrSize;
        let logoHeight = 60;

        // Text metrics
        const font = 'bold 32px Arial';
        ctx.font = font;
        const tw = ctx.measureText(textVisual).width;
        const th = 40;

        const totalW = qrSize + pad * 2;
        const totalH = (qrSize + pad * 2) + th + logoHeight + pad;
        canvas.width = totalW;
        canvas.height = totalH;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, totalW, totalH);

        // Draw QR
        if (qrImg.tagName === 'IMG') {
            ctx.drawImage(qrImg, pad, pad, qrSize, qrSize);
        } else {
            ctx.drawImage(qrImg, pad, pad);
        }

        // Draw text
        ctx.font = font;
        ctx.fillStyle = '#000';
        const tx = (totalW - tw) / 2;
        const ty = pad + qrSize + pad + th;
        ctx.fillText(textVisual, tx, ty);

        // Logo rectangle (simulat)
        const ly = ty + th;
        ctx.fillStyle = '#2596be';
        ctx.fillRect(pad, ly, logoWidth, logoHeight);

        const wrapper = document.createElement('div');
        wrapper.className = 'qr-dispositiu-wrapper';
        wrapper.appendChild(canvas);

        destEl.appendChild(wrapper);
    }, 50);
}

function obreQRAPestanya(pc) {
    const mmYY = formatDataAdqMMYY(pc.dataAdquisicio);
    const url = `https://mcayuela.com/tmi/inventari-dispositius/dispositiu.html?id=${encodeURIComponent(pc.id)}`;

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>QR ${pc.id}</title>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>
<style>
    html, body {
        height: 100%;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow: hidden;
    }
    body {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
    }
    .qr-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #fff;
        padding: 20px;
    }
    #qr-code {
        margin-bottom: 10px;
        margin-top: 20px;
    }
    .qr-id {
        font-size: 2em;
        font-weight: 700;
        color: #217aa3;
        margin-bottom: 10px;
        letter-spacing: 1px;
        text-align: center;
    }
    .qr-logo {
        margin-bottom: 20px;
        max-width: 120px;
        height: auto;
    }
    .print-btn {
        margin-top: 18px;
        padding: 12px 32px;
        font-size: 1.1em;
        background: #2596be;
        color: #fff;
        border: none;
        border-radius: 7px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
    }
    .print-btn:hover {
        background: #217aa3;
    }
    @media print {
        @page { size: landscape; margin: 0; }
        .print-btn { display: none !important; }
        .qr-container { transform: rotate(-90deg) scale(0.8); transform-origin: center center; }
        .qr-logo { max-width: 200px !important; }
    }
</style>
</head>
<body>
    <div class="qr-container">
        <div id="qr-code"></div>
        <div class="qr-id">${pc.id}/${mmYY}</div>
        <img class="qr-logo" src="images/logotmi-horitzontal.png" alt="Logo TMI" />
        <button class="print-btn" onclick="window.print()">Imprimir</button>
    </div>
    <script>
        (function() {
            try {
                var qr = qrcode(0, 'L');
                qr.addData('${url}');
                qr.make();
                document.getElementById('qr-code').innerHTML = qr.createImgTag(6, 0);
            } catch (err) {
                try {
                    var qr2 = qrcode(0, 'L');
                    qr2.addData('${url}');
                    qr2.make();
                    document.getElementById('qr-code').innerHTML = qr2.createImgTag(6, 0);
                } catch (err) {
                    // As a last resort, show the URL
                    document.getElementById('qr-code').textContent = '${url}';
                }
            }
        })();
    </script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
        alert('No s\'ha pogut obrir la finestra d\'impressió.');
        return;
    }
    
    win.document.open();
    win.document.write(html);
    win.document.close();
}