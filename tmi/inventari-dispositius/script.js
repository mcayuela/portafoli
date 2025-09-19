// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, arrayUnion, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

// SVGs per a portàtil i sobretaula
const iconaPC = `
<svg width="38" height="38" viewBox="0 0 38 38" fill="none">
  <rect x="4" y="8" width="30" height="16" rx="3" fill="#eaf4fa" stroke="#2596be" stroke-width="2"/>
  <rect x="12" y="28" width="14" height="3" rx="1.5" fill="#2596be"/>
  <rect x="16" y="32" width="6" height="2" rx="1" fill="#217aa3"/>
</svg>
`;

const iconaPortatil = `
<svg width="38" height="38" viewBox="0 0 38 38" fill="none">
  <rect x="7" y="11" width="24" height="13" rx="2" fill="#eaf4fa" stroke="#2596be" stroke-width="2"/>
  <rect x="4" y="26" width="30" height="4" rx="2" fill="#2596be"/>
  <rect x="15" y="31" width="8" height="2" rx="1" fill="#217aa3"/>
</svg>
`;

const iconaMobil = `
<svg width="28" height="38" viewBox="0 0 28 38" fill="none">
  <rect x="4" y="4" width="20" height="30" rx="4" fill="#eaf4fa" stroke="#2596be" stroke-width="2"/>
  <circle cx="14" cy="32" r="1.5" fill="#2596be"/>
</svg>
`;

const iconaImpresora = `
<svg width="38" height="38" viewBox="0 0 38 38" fill="none">
  <rect x="7" y="15" width="24" height="10" rx="2" fill="#eaf4fa" stroke="#2596be" stroke-width="2"/>
  <rect x="11" y="7" width="16" height="8" rx="1.5" fill="#2596be"/>
  <rect x="11" y="25" width="16" height="6" rx="1.5" fill="#217aa3"/>
  <circle cx="27" cy="20" r="1" fill="#2596be"/>
</svg>
`;

const iconaMonitor = `
<svg width="38" height="38" viewBox="0 0 38 38" fill="none">
  <rect x="6" y="10" width="26" height="16" rx="2" fill="#eaf4fa" stroke="#2596be" stroke-width="2"/>
  <rect x="15" y="28" width="8" height="2" rx="1" fill="#217aa3"/>
  <rect x="13" y="31" width="12" height="2" rx="1" fill="#2596be"/>
</svg>
`;

let lastData = null;
let lastPage = 1;
let lastFiltrat = null;

function renderBuscador() {
    // Neteja el buscador i modal si ja existeixen
    const oldBuscador = document.getElementById('buscador-container');
    if (oldBuscador) oldBuscador.remove();
    const oldModal = document.getElementById('modal-afegir-dispositiu');
    if (oldModal) oldModal.remove();
    const oldModalAltres = document.getElementById('modal-afegir-altredispositiu');
    if (oldModalAltres) oldModalAltres.remove();

    const buscadorHtml = `
        <div id="buscador-container" class="buscador-container">
            <input type="text" id="buscador" class="buscador-input" placeholder="Cerca per ID o FQDN..." autocomplete="off">
            <span class="buscador-icona">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="#2596be" stroke-width="2"/>
                    <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#2596be" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </span>
            <div class="botons-container">
                <button id="btn-afegir-pc" class="btn-afegir-dispositiu">+ Afegir PC</button>
                <button id="btn-afegir-dispositiu" class="btn-afegir-dispositiu">+ Afegir dispositiu</button>
            </div>
        </div>
        <div id="modal-afegir-dispositiu" class="modal-afegir-dispositiu">
            <div id="modal-content-dispositiu">
                <button id="modal-close-dispositiu" title="Tancar" class="btn-close-svg">
                    <svg width="32" height="32" viewBox="0 0 32 32">
                        <line x1="8" y1="8" x2="24" y2="24" stroke="#2596be" stroke-width="3" stroke-linecap="round"/>
                        <line x1="24" y1="8" x2="8" y2="24" stroke="#2596be" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                </button>
                <h3 style="margin-top: 0; padding-top: 2px;">Afegir nou dispositiu</h3>
                <form id="form-afegir-dispositiu">
                    <label>ID:<br><input name="id" required></label><br>
                    <label>FQDN:<br><input name="FQDN" required></label><br>
                    <label>Usuari:<br>
                        <input name="usuari" id="input-usuari" autocomplete="off">
                        <ul id="llista-usuaris" class="llista-processadors" style="display:none;"></ul>
                    </label><br>
                    <label>Departament:<br>
                        <input name="departament" id="input-departament" autocomplete="off">
                        <ul id="llista-departaments" class="llista-processadors" style="display:none;"></ul>
                    </label><br>
                    <label>Model:<br><input name="model"></label><br>
                    <label>Processador:<br>
                        <input name="processador" id="input-processador" autocomplete="off">
                        <ul id="llista-processadors" class="llista-processadors" style="display:none;"></ul>
                    </label><br>
                    <label>RAM:<br>
                        <input name="ram" id="input-ram" autocomplete="off">
                        <ul id="llista-ram" class="llista-processadors" style="display:none;"></ul>
                    </label><br>
                    <label>Emmagatzematge:<br>
                        <input name="emmagatzematge" id="input-emmagatzematge" autocomplete="off">
                        <ul id="llista-emmagatzematge" class="llista-processadors" style="display:none;"></ul>
                    </label><br>
                    <label>Tarjeta Gràfica:<br><input name="tarjetaGrafica"></label><br>
                    <label>Sistema Operatiu:<br>
                        <input name="sistemaOperatiu" id="input-sistemaoperatiu" autocomplete="off">
                        <ul id="llista-sistemaoperatiu" class="llista-processadors" style="display:none;"></ul>
                    </label><br>
                    <label>Data d'Adquisició:<br><input name="dataAdquisicio" type="date"></label><br>
                    <label class="label-portatil">
                        Portàtil:
                        <input type="checkbox" name="portatil" class="checkbox-portatil">
                    </label>
                    <button type="submit" class="btn-guardar">Guardar</button>
                </form>
            </div>
        </div>
        <div id="modal-afegir-altredispositiu" class="modal-afegir-dispositiu">
            <div id="modal-content-altredispositiu">
                <button id="modal-close-altredispositiu" title="Tancar" class="btn-close-svg">
                    <svg width="32" height="32" viewBox="0 0 32 32">
                        <line x1="8" y1="8" x2="24" y2="24" stroke="#2596be" stroke-width="3" stroke-linecap="round"/>
                        <line x1="24" y1="8" x2="8" y2="24" stroke="#2596be" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                </button>
                <h3 style="margin-top: 0; padding-top: 2px;">Afegir nou dispositiu</h3>
                <form id="form-afegir-altredispositiu">
                    <label>Model:<br><input name="model" required></label><br>
                    <label>Tamany:<br><input name="tamany"></label><br>
                    <label>Usuari:<br><input name="usuari" required></label><br>
                    <label>Departament:<br>
                        <input name="departament" id="input-departament-altre" autocomplete="off">
                        <ul id="llista-departaments-altre" class="llista-processadors" style="display:none;"></ul>
                    </label><br>
                    <label>Any d'adquisició:<br><input name="anyAdquisicio" type="number" min="1980" max="2100"></label><br>
                    <label>Tipus de dispositiu:<br>
                        <select name="tipus" id="select-tipus-dispositiu" required>
                            <option value="">-- Selecciona --</option>
                            <option value="Monitor">Monitor</option>
                            <option value="Impresora">Impresora</option>
                            <option value="Mòbil">Mòbil</option>
                        </select>
                    </label><br>
                    <button type="submit" class="btn-guardar">Guardar</button>
                </form>
            </div>
        </div>
    `;
    document.getElementById("content").insertAdjacentHTML('afterbegin', buscadorHtml);

    // Funció per trobar el següent ID disponible (màxim + 1)
    async function obtenirProximID() {
        const snapshot = await getDocs(collection(db, "pcs"));
        const ids = snapshot.docs.map(doc => parseInt(doc.id, 10)).filter(n => !isNaN(n));
        if (ids.length === 0) return 3011;
        const maxId = Math.max(...ids);
        if (maxId < 3011) return maxId + 1;
        return maxId + 1;
    }

    // --- Firebase: Obtenir processadors ---
    async function obtenirProcesadors() {
        const docRef = doc(db, "configuracio", "procesadors");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            // Combina tots els arrays en un sol array pla
            const data = docSnap.data();
            let llista = [];
            Object.values(data).forEach(arr => llista = llista.concat(arr));
            return llista;
        }
        return [];
    }

    // Obtenir opcions de RAM, Emmagatzematge i Sistema Operatiu
    async function obtenirOpcionsConfig(FQDN) {
        const docRef = doc(db, "configuracio", FQDN);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().valors || [];
        }
        return [];
    }

    // Obrir modal PC
    document.getElementById('btn-afegir-pc').onclick = async () => {
        document.getElementById('modal-afegir-dispositiu').style.display = 'flex';
        // Omple l'ID automàticament amb el màxim + 1
        const idInput = document.querySelector('#form-afegir-dispositiu input[name="id"]');
        if (idInput) {
            idInput.value = await obtenirProximID();
            idInput.select();
        }
        // Omple el datalist de processadors
        const processadors = await obtenirProcesadors();
        const inputProc = document.getElementById('input-processador');
        const llista = document.getElementById('llista-processadors');
        let filtrats = processadors;

        function mostraLlistaProcessadors(val) {
            filtrats = processadors.filter(p => p.toLowerCase().includes(val.toLowerCase()));
            if (filtrats.length === 0 || !val) {
                llista.style.display = 'none';
                return;
            }
            llista.innerHTML = filtrats.map(p => `<li>${p}</li>`).join('');
            llista.style.display = 'block';
        }

        inputProc.oninput = function() {
            mostraLlistaProcessadors(this.value);
        };
        inputProc.onfocus = function() {
            mostraLlistaProcessadors(this.value);
        };
        inputProc.onblur = function() {
            setTimeout(() => { llista.style.display = 'none'; }, 150);
        };
        llista.onclick = function(e) {
            if (e.target.tagName === 'LI') {
                inputProc.value = e.target.textContent;
                llista.style.display = 'none';
            }
        };

        // RAM
        const opcionsRam = await obtenirOpcionsConfig('ram');
        const inputRam = document.getElementById('input-ram');
        const llistaRam = document.getElementById('llista-ram');
        function mostraLlistaRam(val) {
            const filtrats = opcionsRam.filter(r => r.toLowerCase().includes(val.toLowerCase()));
            if (filtrats.length === 0 || !val) {
                llistaRam.style.display = 'none';
                return;
            }
            llistaRam.innerHTML = filtrats.map(r => `<li>${r}</li>`).join('');
            llistaRam.style.display = 'block';
        }
        inputRam.oninput = function() { mostraLlistaRam(this.value); };
        inputRam.onfocus = function() { mostraLlistaRam(this.value); };
        inputRam.onblur = function() { setTimeout(() => { llistaRam.style.display = 'none'; }, 150); };
        llistaRam.onclick = function(e) {
            if (e.target.tagName === 'LI') {
                inputRam.value = e.target.textContent;
                llistaRam.style.display = 'none';
            }
        };

        // Emmagatzematge
        const opcionsEmm = await obtenirOpcionsConfig('emmagatzematge');
        const inputEmm = document.getElementById('input-emmagatzematge');
        const llistaEmm = document.getElementById('llista-emmagatzematge');
        function mostraLlistaEmm(val) {
            const filtrats = opcionsEmm.filter(r => r.toLowerCase().includes(val.toLowerCase()));
            if (filtrats.length === 0 || !val) {
                llistaEmm.style.display = 'none';
                return;
            }
            llistaEmm.innerHTML = filtrats.map(r => `<li>${r}</li>`).join('');
            llistaEmm.style.display = 'block';
        }
        inputEmm.oninput = function() { mostraLlistaEmm(this.value); };
        inputEmm.onfocus = function() { mostraLlistaEmm(this.value); };
        inputEmm.onblur = function() { setTimeout(() => { llistaEmm.style.display = 'none'; }, 150); };
        llistaEmm.onclick = function(e) {
            if (e.target.tagName === 'LI') {
                inputEmm.value = e.target.textContent;
                llistaEmm.style.display = 'none';
            }
        };

        // Sistema Operatiu
        const opcionsSO = await obtenirOpcionsConfig('sistemaOperatiu');
        const inputSO = document.getElementById('input-sistemaoperatiu');
        const llistaSO = document.getElementById('llista-sistemaoperatiu');
        function mostraLlistaSO(val) {
            const filtrats = opcionsSO.filter(r => r.toLowerCase().includes(val.toLowerCase()));
            if (filtrats.length === 0 || !val) {
                llistaSO.style.display = 'none';
                return;
            }
            llistaSO.innerHTML = filtrats.map(r => `<li>${r}</li>`).join('');
            llistaSO.style.display = 'block';
        }
        inputSO.oninput = function() { mostraLlistaSO(this.value); };
        inputSO.onfocus = function() { mostraLlistaSO(this.value); };
        inputSO.onblur = function() { setTimeout(() => { llistaSO.style.display = 'none'; }, 150); };
        llistaSO.onclick = function(e) {
            if (e.target.tagName === 'LI') {
                inputSO.value = e.target.textContent;
                llistaSO.style.display = 'none';
            }
        };

        // Obtenir usuaris
        const opcionsUsuaris = await obtenirOpcionsConfig('usuaris');
        const inputUsuari = document.getElementById('input-usuari');
        const llistaUsuaris = document.getElementById('llista-usuaris');
        function mostraLlistaUsuaris(val) {
            const filtrats = opcionsUsuaris.filter(u => u.toLowerCase().includes(val.toLowerCase()));
            if (filtrats.length === 0 || !val) {
                llistaUsuaris.style.display = 'none';
                return;
            }
            llistaUsuaris.innerHTML = filtrats.map(u => `<li>${u}</li>`).join('');
            llistaUsuaris.style.display = 'block';
        }
        inputUsuari.oninput = function() { mostraLlistaUsuaris(this.value); };
        inputUsuari.onfocus = function() { mostraLlistaUsuaris(this.value); };
        inputUsuari.onblur = function() { setTimeout(() => { llistaUsuaris.style.display = 'none'; }, 150); };
        llistaUsuaris.onclick = function(e) {
            if (e.target.tagName === 'LI') {
                inputUsuari.value = e.target.textContent;
                llistaUsuaris.style.display = 'none';
            }
        };

        // Obtenir departaments
        const opcionsDepartaments = await obtenirOpcionsConfig('departaments');
        const inputDepartament = document.getElementById('input-departament');
        const llistaDepartaments = document.getElementById('llista-departaments');
        function mostraLlistaDepartaments(val) {
            const filtrats = opcionsDepartaments.filter(d => d.toLowerCase().includes(val.toLowerCase()));
            if (filtrats.length === 0 || !val) {
                llistaDepartaments.style.display = 'none';
                return;
            }
            llistaDepartaments.innerHTML = filtrats.map(d => `<li>${d}</li>`).join('');
            llistaDepartaments.style.display = 'block';
        }
        inputDepartament.oninput = function() { mostraLlistaDepartaments(this.value); };
        inputDepartament.onfocus = function() { mostraLlistaDepartaments(this.value); };
        inputDepartament.onblur = function() { setTimeout(() => { llistaDepartaments.style.display = 'none'; }, 150); };
        llistaDepartaments.onclick = function(e) {
            if (e.target.tagName === 'LI') {
                inputDepartament.value = e.target.textContent;
                llistaDepartaments.style.display = 'none';
            }
        };
    };

    // Tancar modal amb botó
    document.getElementById('modal-close-dispositiu').onclick = () => {
        document.getElementById('modal-afegir-dispositiu').style.display = 'none';
    };
    document.getElementById('modal-close-altredispositiu').onclick = () => {
        document.getElementById('modal-afegir-altredispositiu').style.display = 'none';
    };

    // Tancar modal clicant fora
    document.getElementById('modal-afegir-dispositiu').onclick = (e) => {
        if (e.target.id === 'modal-afegir-dispositiu') {
            document.getElementById('modal-afegir-dispositiu').style.display = 'none';
        }
    };
    document.getElementById('modal-afegir-altredispositiu').onclick = (e) => {
        if (e.target.id === 'modal-afegir-altredispositiu') {
            document.getElementById('modal-afegir-altredispositiu').style.display = 'none';
        }
    };

    // Guardar nou dispositiu
    document.getElementById('form-afegir-dispositiu').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const nouDispositiu = {
            id: fd.get('id'),
            FQDN: fd.get('FQDN'),
            model: fd.get('model'),
            processador: fd.get('processador'),
            ram: fd.get('ram'),
            emmagatzematge: fd.get('emmagatzematge'),
            tarjetaGrafica: fd.get('tarjetaGrafica'),
            sistemaOperatiu: fd.get('sistemaOperatiu'),
            dataAdquisicio: fd.get('dataAdquisicio'),
            portatil: !!fd.get('portatil'),
            usuari: fd.get('usuari'),
            departament: fd.get('departament'),
            reparacions: []
        };
        try {
            await updateDoc(doc(db, "pcs", nouDispositiu.id.toString()), nouDispositiu)
                .catch(async () => {
                    // Si no existeix, crea'l
                    await setDoc(doc(db, "pcs", nouDispositiu.id.toString()), nouDispositiu);
                });
            alert("Dispositiu afegit correctament!");
            document.getElementById('modal-afegir-dispositiu').style.display = 'none';
            main();
        } catch (err) {
            alert("Error afegint dispositiu: " + err.message);
        }
    };
    // Guardar nou dispositiu altres
    document.getElementById('form-afegir-altredispositiu').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const tipus = fd.get('tipus'); // Ara només un valor
        const nouDispositiu = {
            model: fd.get('model'),
            tamany: fd.get('tamany'),
            usuari: fd.get('usuari'),
            departament: fd.get('departament'),
            anyAdquisicio: fd.get('anyAdquisicio'),
            tipus: tipus ? [tipus] : [],
            // Pots afegir més camps si vols
        };
        try {
            await setDoc(doc(db, "altresDispositius", Date.now().toString()), nouDispositiu);
            alert("Dispositiu afegit correctament!");
            document.getElementById('modal-afegir-altredispositiu').style.display = 'none';
            main();
        } catch (err) {
            alert("Error afegint dispositiu: " + err.message);
        }
    };

    // Just després d'injectar el HTML del buscador i modals:
    document.getElementById('btn-afegir-dispositiu').onclick = async () => {
        document.getElementById('modal-afegir-altredispositiu').style.display = 'flex';

        // Omple departaments (autocompletar)
        const opcionsDepartaments = await obtenirOpcionsConfig('departaments');
        const inputDepartament = document.getElementById('input-departament-altre');
        const llistaDepartaments = document.getElementById('llista-departaments-altre');
        function mostraLlistaDepartaments(val) {
            const filtrats = opcionsDepartaments.filter(d => d.toLowerCase().includes(val.toLowerCase()));
            if (filtrats.length === 0 || !val) {
                llistaDepartaments.style.display = 'none';
                return;
            }
            llistaDepartaments.innerHTML = filtrats.map(d => `<li>${d}</li>`).join('');
            llistaDepartaments.style.display = 'block';
        }
        inputDepartament.oninput = function() { mostraLlistaDepartaments(this.value); };
        inputDepartament.onfocus = function() { mostraLlistaDepartaments(this.value); };
        inputDepartament.onblur = function() { setTimeout(() => { llistaDepartaments.style.display = 'none'; }, 150); };
        llistaDepartaments.onclick = function(e) {
            if (e.target.tagName === 'LI') {
                inputDepartament.value = e.target.textContent;
                llistaDepartaments.style.display = 'none';
            }
        };
    };
}

function filtraData(data, valor) {
    valor = valor.trim().toLowerCase();
    if (!valor) return data;
    return data.filter(pc =>
        (pc.FQDN || '').toLowerCase().includes(valor) ||
        String(pc.id).includes(valor)
    );
}

function renderLlistat(data, paginaActual) {
    renderBuscador();
    const buscadorInput = document.getElementById('buscador');
    const buscadorValor = buscadorInput?.value || '';
    const valor = buscadorValor;
    const dataFiltrada = filtraData(data, valor);

    lastFiltrat = dataFiltrada;
    dataFiltrada.sort((a, b) => (a.FQDN || '').localeCompare(b.FQDN || '', 'ca', { sensitivity: 'base' }));

    const PCS_PER_PAGINA = 40;
    const totalPagines = Math.max(1, Math.ceil(dataFiltrada.length / PCS_PER_PAGINA));
    paginaActual = Math.min(paginaActual, totalPagines);
    const start = (paginaActual - 1) * PCS_PER_PAGINA;
    const end = start + PCS_PER_PAGINA;
    const pcsPagina = dataFiltrada.slice(start, end);

    let html = `<div class="llistat-grid">`;
    pcsPagina.forEach(pc => {
        html += `
            <div style="margin-bottom: 10px;word-break:break-word;">
                <strong>ID:</strong> ${pc.id} -
                <strong>FQDN:</strong> ${pc.FQDN || ''} -
                <a href="?id=${pc.id}">Més detalls</a>
            </div>
        `;
    });
    html += `</div>`;

    html += `
        <div class="paginacio-controls">
            <button id="prevPag" class="paginacio-btn" ${paginaActual === 1 ? 'disabled' : ''}>&lt;</button>
            <span>Pàgina ${paginaActual} de ${totalPagines}</span>
            <button id="nextPag" class="paginacio-btn" ${paginaActual === totalPagines ? 'disabled' : ''}>&gt;</button>
        </div>
    `;

    document.getElementById("content").innerHTML = '';
    renderBuscador();

    if (buscadorInput) {
        buscadorInput.value = buscadorValor;
        buscadorInput.focus();
        buscadorInput.setSelectionRange(buscadorValor.length, buscadorValor.length);
        buscadorInput.oninput = () => {
            renderLlistat(data, 1);
        };
    }

    document.getElementById("content").insertAdjacentHTML('beforeend', html);

    document.getElementById("prevPag").onclick = () => {
        if (paginaActual > 1) renderLlistat(data, paginaActual - 1);
    };
    document.getElementById("nextPag").onclick = () => {
        if (paginaActual < totalPagines) renderLlistat(data, paginaActual + 1);
    };
}

function responsiveRerender() {
    if (lastData) renderLlistat(lastData, 1);
}
window.addEventListener('resize', responsiveRerender);

// --- Firebase: Carrega dades ---
async function obtenirPCs() {
    const querySnapshot = await getDocs(collection(db, "pcs"));
    const pcs = [];
    querySnapshot.forEach((doc) => {
        pcs.push(doc.data());
    });
    return pcs;
}

async function obtenirPC(id) {
    const pcRef = doc(db, "pcs", id.toString());
    const pcSnap = await getDoc(pcRef);
    return pcSnap.exists() ? pcSnap.data() : null;
}

// --- Reparacions: Afegir ---
async function afegirReparacio(pcId, reparacio) {
    const pcRef = doc(db, "pcs", pcId.toString());
    await updateDoc(pcRef, {
        reparacions: arrayUnion(reparacio)
    });
}

// --- Render detall PC amb reparacions ---
function renderReparacions(reparacions = [], pcId) {
    let html = `<div class="reparacions-container"><h3>Reparacions / Canvis</h3>`;
    if (reparacions && reparacions.length > 0) {
        html += reparacions.map((r, idx) => `
            <div class="reparacio-card">
                <div class="reparacio-header">
                    <span class="reparacio-data">${r.data}</span>
                    <div class="reparacio-actions">
                        <button class="btn-editar" data-idx="${idx}" title="Editar">&#9998;</button>
                        <button class="btn-eliminar" data-idx="${idx}" title="Eliminar">&#128465;</button>
                    </div>
                </div>
                <div class="reparacio-body">
                <strong>${r.descripcio}</strong>
                ${r.imatges && r.imatges.length > 0 ? `
                    <div class="reparacio-imgs" style="margin-top:10px;">
                        ${r.imatges.map((img, imgIdx) => `<img src="${img}" alt="Imatge reparació" class="reparacio-img" data-img="${img}" data-idx="${imgIdx}" style="cursor:pointer;">`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
} else {
    html += `<p>No hi ha reparacions/canvis registrats.</p>`;
}
html += `<button id="btn-afegir-reparacio" class="btn-afegir">+ Afegir reparació/canvi</button></div>`;

html += `
        <div id="modal-reparacio" class="modal-reparacio" style="display:none;">
            <div class="modal-content">
                <span class="modal-close" id="modal-close">&times;</span>
                <form id="form-reparacio">
                    <h4>Nova reparació/canvi</h4>
                    <label>Descripció:<br>
                        <textarea name="descripcio" required></textarea>
                    </label><br>
                    <label style:"display: none;">Imatges:<br>
                        <input type="file" name="imatges" id="imatges-input" multiple accept="image/*" style="display:none;">
                        <button type="button" id="btn-upload-img" class="btn-upload-img">Adjuntar imatges</button>
                        <div id="imatges-preview" class="imatges-preview"></div>
                    </label><br>
                    <button type="submit" class="btn-guardar">Guardar</button>
                </form>
            </div>
        </div>
        <div id="modal-img-gran" class="modal-img-gran" style="display:none;">
            <span class="modal-img-close" id="modal-img-close">&times;</span>
            <img id="img-gran" src="" alt="Imatge gran" />
        </div>
    `;
    return html;
}

// Funcions per mostrar/amagar loader
function mostrarLoader() {
    const loader = document.querySelector('.contenidor-loader');
    if (loader) loader.style.display = 'flex';
}
function amagarLoader() {
    const loader = document.querySelector('.contenidor-loader');
    if (loader) loader.style.display = 'none';
}

// --- Render principal ---
async function main() {
    const content = document.getElementById("content");
    const loader = document.querySelector('.contenidor-loader');
    // Amaga contingut, mostra loader
    if (content) content.style.display = 'none';
    if (loader) loader.style.display = 'flex';

    let timeoutId;
    let trobat = false;

    // Timeout de 60 segons
    timeoutId = setTimeout(() => {
        if (!trobat) {
            if (loader) loader.style.display = 'none';
            if (content) {
                content.style.display = '';
                content.innerHTML = "<p>No s'ha trobat cap PC.</p>";
            }
        }
    }, 60000);

    try {
        if (id) {
            const pc = await obtenirPC(id);
            trobat = true;
            clearTimeout(timeoutId);
            if (loader) loader.style.display = 'none';
            if (content) content.style.display = '';
            if (pc) {
                content.innerHTML = `
<div class="pc-detall-grid">
  <!-- Info PC (esquerra) -->
  <div class="pc-info">
    <div class="pc-icona-titol">
      <span class="pc-titol">ID: ${pc.id}</span>
      ${getIconaDispositiu(pc.tipus || [])}
    </div>
    <p><strong>FQDN:</strong> ${pc.FQDN || ''}</p>
    <p><strong>Model:</strong> ${pc.model || ''}</p>
    <p><strong>Processador:</strong> ${pc.processador || ''}</p>
    <p><strong>RAM:</strong> ${pc.ram || ''}</p>
    <p><strong>Emmagatzematge:</strong> ${pc.emmagatzematge || ''}</p>
    <p><strong>Tarjeta Gràfica:</strong> ${pc.tarjetaGrafica || ''}</p>
    <p><strong>Sistema Operatiu:</strong> ${pc.sistemaOperatiu || ''}</p>
    <p><strong>Data d'Adquisició:</strong> ${pc.dataAdquisicio || ''}</p>
    <p><strong>Portàtil:</strong> ${pc.portatil ? 'Sí' : 'No'}</p>
    <p><strong>Usuari:</strong> ${pc.usuari || ''}</p>
    <p><strong>Departament:</strong> ${pc.departament || ''}</p>
  </div>
  <!-- Columna dreta: Botons a dalt, reparacions a sota -->
  <div class="pc-dreta">
    <div class="pc-actions">
      <button id="btn-eliminar-pc" class="btn-eliminar-pc">🗑️ Eliminar</button>
      <button id="btn-generar-qr" class="btn-guardar">Genera QR</button>
      <button id="btn-tornar" class="btn-tornar">Tornar a l'inventari</button>
    </div>
    <div class="pc-reparacions">
      ${renderReparacions(pc.reparacions, pc.id)}
    </div>
  </div>
</div>
<div id="qr-pc-container"></div>
<!-- Modal confirmació eliminar -->
<div id="modal-eliminar-pc" class="modal-eliminar-pc" style="display:none;">
  <div class="modal-eliminar-content">
    <h3>Segur que vols eliminar aquest PC?</h3>
    <p>Aquesta acció no es pot desfer.</p>
    <button id="confirmar-eliminar-pc" class="btn-eliminar-pc">Sí, eliminar</button>
    <button id="cancelar-eliminar-pc" class="btn-tornar">Cancel·lar</button>
  </div>
</div>
                `;
                const btnEliminar = document.getElementById('btn-eliminar-pc');
                if (btnEliminar) {
                btnEliminar.onclick = () => {
                    document.getElementById('modal-eliminar-pc').style.display = 'flex';
                    const btnConfirma = document.getElementById('confirmar-eliminar-pc');
                    const btnCancela = document.getElementById('cancelar-eliminar-pc');
                    if (btnCancela) btnCancela.onclick = () => {
                    document.getElementById('modal-eliminar-pc').style.display = 'none';
                    };
                    if (btnConfirma) btnConfirma.onclick = async () => {
                    await deleteDoc(doc(db, "pcs", pc.id.toString()));
                    window.location.href = "index.html";
                    };
                };
                }

                const btnQR = document.getElementById('btn-generar-qr');
                if (btnQR) {
                btnQR.onclick = () => obreQRAPestanya(pc);
                }

                const btnTornar = document.getElementById('btn-tornar');
                if (btnTornar) {
                btnTornar.onclick = () => {
                    window.location.href = "index.html";
                };
                }

                // --- Afegir reparació (modal) ---
                document.getElementById('btn-afegir-reparacio').onclick = () => {
                    document.getElementById('modal-reparacio').style.display = 'flex';
                };
                document.getElementById('modal-close').onclick = () => {
                    document.getElementById('modal-reparacio').style.display = 'none';
                };
                // --- Imatges input preview ---
                let filesArray = [];
                document.getElementById('btn-upload-img').onclick = () => {
                    document.getElementById('imatges-input').click();
                };
                document.getElementById('imatges-input').onchange = (e) => {
                    filesArray = Array.from(e.target.files);
                    const preview = document.getElementById('imatges-preview');
                    preview.innerHTML = '';
                    filesArray.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = function(ev) {
                            const img = document.createElement('img');
                            img.src = ev.target.result;
                            img.className = 'reparacio-img';
                            img.style.maxWidth = '40px';
                            img.style.maxHeight = '40px';
                            img.style.margin = '2px';
                            preview.appendChild(img);
                            img.onclick = () => {
                                document.getElementById('img-gran').src = ev.target.result;
                                document.getElementById('modal-img-gran').style.display = 'flex';
                            };
                        };
                        reader.readAsDataURL(file);
                    });
                };
                // --- Modal imatge gran ---
                document.getElementById('modal-img-close').onclick = () => {
                    document.getElementById('modal-img-gran').style.display = 'none';
                };
                // --- Afegir reparació amb imatges ---
                document.getElementById('form-reparacio').onsubmit = async (e) => {
                    e.preventDefault();
                    mostrarLoader();
                    const descripcio = e.target.descripcio.value;
                    let imatges = [];
                    if (filesArray.length > 0) {
                        imatges = await Promise.all(filesArray.map(async file => {
                            return new Promise(resolve => {
                                const reader = new FileReader();
                                reader.onload = ev => resolve(ev.target.result);
                                reader.readAsDataURL(file);
                            });
                        }));
                    }
                    const novaReparacio = {
                        data: new Date().toISOString().slice(0, 10),
                        descripcio,
                        imatges
                    };
                    await afegirReparacio(pc.id, novaReparacio);
                    document.getElementById('modal-reparacio').style.display = 'none';
                    alert('Reparació afegida!');
                    amagarLoader();
                    main();
                };
                // --- Eliminar reparació ---
                document.querySelectorAll('.btn-eliminar').forEach(btn => {
                    btn.onclick = async () => {
                        mostrarLoader();
                        const idx = parseInt(btn.getAttribute('data-idx'));
                        const reparacions = pc.reparacions || [];
                        reparacions.splice(idx, 1);
                        await updateDoc(doc(db, "pcs", pc.id.toString()), { reparacions });
                        amagarLoader();
                        main();
                    };
                });
                // --- Editar reparació ---
                document.querySelectorAll('.btn-editar').forEach(btn => {
                    btn.onclick = () => {
                        const idx = parseInt(btn.getAttribute('data-idx'));
                        const reparacio = pc.reparacions[idx];
                        document.getElementById('modal-reparacio').style.display = 'flex';
                        document.getElementById('form-reparacio').descripcio.value = reparacio.descripcio;
                        document.getElementById('imatges-preview').innerHTML = '';
                        if (reparacio.imatges && reparacio.imatges.length > 0) {
                            reparacio.imatges.forEach(img => {
                                const imgEl = document.createElement('img');
                                imgEl.src = img;
                                imgEl.className = 'reparacio-img';
                                imgEl.style.maxWidth = '40px';
                                imgEl.style.maxHeight = '40px';
                                imgEl.style.margin = '2px';
                                document.getElementById('imatges-preview').appendChild(imgEl);
                                imgEl.onclick = () => {
                                    document.getElementById('img-gran').src = img;
                                    document.getElementById('modal-img-gran').style.display = 'flex';
                                };
                            });
                        }
                        // Guardar edició
                        document.getElementById('form-reparacio').onsubmit = async (e) => {
                            e.preventDefault();
                            mostrarLoader();
                            reparacio.descripcio = e.target.descripcio.value;
                            reparacio.data = reparacio.data || new Date().toISOString().slice(0, 10);
                            pc.reparacions[idx] = reparacio;
                            await updateDoc(doc(db, "pcs", pc.id.toString()), { reparacions: pc.reparacions });
                            document.getElementById('modal-reparacio').style.display = 'none';
                            alert('Reparació actualitzada!');
                            amagarLoader();
                            main();
                        };
                    };
                });
                // --- Imatge gran des de targeta ---
                document.querySelectorAll('.reparacio-img').forEach(img => {
                    img.onclick = () => {
                        document.getElementById('img-gran').src = img.src;
                        document.getElementById('modal-img-gran').style.display = 'flex';
                    };
                });
            } else {
                content.innerHTML = "<p>No s'ha trobat cap PC.</p>";
            }
        } else {
            const data = await obtenirPCs();
            trobat = true;
            clearTimeout(timeoutId);
            if (loader) loader.style.display = 'none';
            if (content) content.style.display = '';
            lastData = data;
            renderLlistat(data, 1);
        }
    } catch (err) {
        trobat = true;
        clearTimeout(timeoutId);
        if (loader) loader.style.display = 'none';
        if (content) {
            content.style.display = '';
            content.innerHTML = "<p>Error carregant l'inventari.</p>";
        }
    }
}

function getIconaDispositiu(tipusArray) {
    if (!tipusArray || tipusArray.length === 0) return iconaPC;
    if (tipusArray.includes('Portàtil')) return iconaPortatil;
    if (tipusArray.includes('Mòbil')) return iconaMobil;
    if (tipusArray.includes('Impresora')) return iconaImpresora;
    if (tipusArray.includes('Monitor')) return iconaMonitor;
    return iconaPC;
}

// --- QR: utilitats ---
function formatDataAdqMMYY(iso) {
    if (!iso) return '0000';
    const d = new Date(iso);
    if (isNaN(d)) return '0000';
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = String(d.getFullYear()).slice(-2);
    return mm + yy;
}

const qrLogoImg = new Image();
qrLogoImg.src = 'logotmi-horitzontal.jpg'; // ajusta ruta si cal

function generaQRDispositiu(pc, destEl) {
    destEl.innerHTML = '';
    const id = pc.id;
    const mmYY = formatDataAdqMMYY(pc.dataAdquisicio);
    const textVisual = `${id}/${mmYY}`;
    const url = `https://mcayuela.com/tmi/inventari-dispositius/?id=${id}`;

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
        if (qrLogoImg.complete && qrLogoImg.naturalWidth) {
            logoHeight = Math.round(logoWidth * (qrLogoImg.naturalHeight / qrLogoImg.naturalWidth));
        }

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
        ctx.fillRect(0,0,totalW,totalH);

        // Draw QR
        if (qrImg.tagName === 'IMG') {
            ctx.drawImage(qrImg, pad, pad, qrSize, qrSize);
        } else {
            ctx.drawImage(qrImg, pad, pad);
        }

        // Text
        ctx.font = font;
        ctx.fillStyle = '#000';
        const tx = (totalW - tw)/2;
        const ty = qrSize + pad;
        ctx.fillText(textVisual, tx, ty);

        // Logo
        const ly = ty + th;
        if (qrLogoImg.complete && qrLogoImg.naturalWidth) {
            ctx.drawImage(qrLogoImg, pad, ly, logoWidth, logoHeight);
        } else {
            ctx.fillStyle = '#2596be';
            ctx.fillRect(pad, ly, logoWidth, logoHeight);
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'qr-dispositiu-wrapper';
        wrapper.appendChild(canvas);

        destEl.appendChild(wrapper);
    },50);
}

function obreQRAPestanya(pc) {
    const tmpDiv = document.createElement('div');
    new QRCode(tmpDiv, {
        text: `https://mcayuela.com/tmi/inventari-dispositius/?id=${pc.id}`,
        width: 240,
        height: 240,
        correctLevel: QRCode.CorrectLevel.H
    });
    setTimeout(() => {
        const qrImg = tmpDiv.querySelector('img') || tmpDiv.querySelector('canvas');
        const mmYY = formatDataAdqMMYY(pc.dataAdquisicio);
        let qrDataUrl = "";
        if (qrImg.tagName === "IMG") qrDataUrl = qrImg.src;
        else qrDataUrl = qrImg.toDataURL();

        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>QR PC ${pc.id}</title>
                <style>
                    html, body {
                        height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }
                    body {
                        width: 100vw;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .qr-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        width: 100vw;
                        box-sizing: border-box;
                    }
                    .qr-img {
                        margin-bottom: 15px;
                        background: #eaf4fa;
                        display: block;
                    }
                    .qr-id {
                        font-size: 2.2em;
                        font-weight: 700;
                        color: #217aa3;
                        margin-bottom: 12px;
                        letter-spacing: 1px;
                        text-align: center;
                        display: block;
                    }
                    .qr-logo {
                        margin: 0;
                        display: block;
                        max-width: 240px;
                        width: 100%;
                        height: auto;
                    }
                    .print-btn {
                        display: inline-block;
                        margin-top: 22px;
                        padding: 12px 32px;
                        font-size: 1.1em;
                        background: #2596be;
                        color: #fff;
                        border: none;
                        border-radius: 7px;
                        cursor: pointer;
                        font-weight: 600;
                        box-shadow: 0 2px 8px rgba(37,150,190,0.06);
                        transition: background 0.2s;
                    }
                    .print-btn:hover {
                        background: #217aa3;
                    }
                    @media print {
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #fff !important;
                            width: 100vw !important;
                            height: 100vh !important;
                        }
                        .qr-container {
                            box-shadow: none !important;
                            background: #fff !important;
                            width: 100vw !important;
                            min-height: 100vh !important;
                            justify-content: center !important;
                            align-items: center !important;
                            page-break-inside: avoid !important;
                            /* Escala tot el contingut per assegurar que capiga a una sola pàgina */
                            transform: scale(0.75);
                            transform-origin: top center;
                            max-width: 100vw !important;
                            max-height: 100vh !important;
                        }
                        .qr-img {
                            max-width: 160px !important;
                            max-height: 160px !important;
                        }
                        .qr-logo {
                            max-width: 120px !important;
                        }
                        .qr-id {
                            font-size: 1.1em !important;
                        }
                        .print-btn { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <img class="qr-img" src="${qrDataUrl}" width="240" height="240" alt="QR PC ${pc.id}">
                    <span class="qr-id">PC ${pc.id}/${mmYY}</span>
                    <img class="qr-logo" src="images/logotmi-horitzontal.png" alt="Logo" />
                    <button class="print-btn" onclick="window.print()">Imprimir</button>
                </div>
            </body>
            </html>
        `);
        win.document.close();
    }, 100);
}
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.float-input').forEach(inp => {
        const toggle = () => {
            inp.classList.toggle('filled', inp.value.trim() !== '');
        };
        inp.addEventListener('input', toggle);
        inp.addEventListener('blur', toggle);
        // Inicial (autofill)
        toggle();
    });
});

main();
