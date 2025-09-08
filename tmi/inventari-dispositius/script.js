// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, arrayUnion, setDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
const iconaPortatil = `
    <svg width="300" height="300" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="14" width="48" height="28" rx="3" fill="#2596be" stroke="#217aa3" stroke-width="2"/>
        <rect x="4" y="50" width="56" height="4" rx="2" fill="#b3d6e6" stroke="#217aa3" stroke-width="2"/>
        <rect x="20" y="50" width="24" height="2" rx="1" fill="#217aa3"/>
    </svg>
`;
const iconaSobretaula = `
    <svg width="300" height="300" viewBox="0 0 64 64" fill="none">
        <rect x="6" y="14" width="36" height="28" rx="3" fill="#2596be" stroke="#217aa3" stroke-width="2"/>
        <rect x="12" y="46" width="24" height="4" rx="2" fill="#b3d6e6" stroke="#217aa3" stroke-width="2"/>
        <rect x="46" y="18" width="10" height="28" rx="2" fill="#b3d6e6" stroke="#217aa3" stroke-width="2"/>
        <circle cx="51" cy="24" r="1.5" fill="#2596be"/>
        <rect x="49" y="32" width="4" height="8" rx="1" fill="#2596be"/>
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

    const buscadorHtml = `
        <div id="buscador-container" class="buscador-container">
            <input type="text" id="buscador" class="buscador-input" placeholder="Cerca per ID o Nom..." autocomplete="off">
            <span class="buscador-icona">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="#2596be" stroke-width="2"/>
                    <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#2596be" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </span>
            <button id="btn-afegir-dispositiu" class="btn-afegir-dispositiu">+ Afegir dispositiu</button>
        </div>
        <div id="modal-afegir-dispositiu" class="modal-afegir-dispositiu">
            <div id="modal-content-dispositiu">
                <button id="modal-close-dispositiu" title="Tancar">&times;</button>
                <h3>Afegir nou dispositiu</h3>
                <form id="form-afegir-dispositiu">
                    <label>ID:<br><input name="id" required></label><br>
                    <label>Nom:<br><input name="nom" required></label><br>
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
    `;
    document.getElementById("content").insertAdjacentHTML('afterbegin', buscadorHtml);

    // Funció per trobar el següent ID disponible (màxim + 1)
    async function obtenirProximID() {
        const snapshot = await getDocs(collection(db, "pcs"));
        const ids = snapshot.docs.map(doc => parseInt(doc.id, 10)).filter(n => !isNaN(n));
        if (ids.length === 0) return 1;
        const maxId = Math.max(...ids);
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
    async function obtenirOpcionsConfig(nom) {
        const docRef = doc(db, "configuracio", nom);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().valors || [];
        }
        return [];
    }

    // Obrir modal
    document.getElementById('btn-afegir-dispositiu').onclick = async () => {
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
    };

    // Tancar modal amb botó
    document.getElementById('modal-close-dispositiu').onclick = () => {
        document.getElementById('modal-afegir-dispositiu').style.display = 'none';
    };

    // Tancar modal clicant fora
    document.getElementById('modal-afegir-dispositiu').onclick = (e) => {
        if (e.target.id === 'modal-afegir-dispositiu') {
            document.getElementById('modal-afegir-dispositiu').style.display = 'none';
        }
    };

    // Guardar nou dispositiu
    document.getElementById('form-afegir-dispositiu').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const nouDispositiu = {
            id: fd.get('id'),
            nom: fd.get('nom'),
            model: fd.get('model'),
            processador: fd.get('processador'),
            ram: fd.get('ram'),
            emmagatzematge: fd.get('emmagatzematge'),
            tarjetaGrafica: fd.get('tarjetaGrafica'),
            sistemaOperatiu: fd.get('sistemaOperatiu'),
            dataAdquisicio: fd.get('dataAdquisicio'),
            portatil: !!fd.get('portatil'),
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
}

function filtraData(data, valor) {
    valor = valor.trim().toLowerCase();
    if (!valor) return data;
    return data.filter(pc =>
        (pc.nom || '').toLowerCase().includes(valor) ||
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
    dataFiltrada.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'ca', { sensitivity: 'base' }));

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
                <strong>Nom:</strong> ${pc.nom || ''} -
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
                    <label>Imatges:<br>
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
                    <div class="detall-container">
                        <div class="detall-text">
                            <h2>PC ID: ${pc.id}</h2>
                            <p><strong>Nom:</strong> ${pc.nom || ''}</p>
                            <p><strong>Model:</strong> ${pc.model || ''}</p>
                            <p><strong>Processador:</strong> ${pc.processador || ''}</p>
                            <p><strong>RAM:</strong> ${pc.ram || ''}</p>
                            <p><strong>Emmagatzematge:</strong> ${pc.emmagatzematge || ''}</p>
                            <p><strong>Tarjeta Gràfica:</strong> ${pc.tarjetaGrafica || ''}</p>
                            <p><strong>Sistema Operatiu:</strong> ${pc.sistemaOperatiu || ''}</p>
                            <p><strong>Data d'Adquisició:</strong> ${pc.dataAdquisicio || ''}</p>
                            <p><strong>Portàtil:</strong> ${pc.portatil ? 'Sí' : 'No'}</p>
                            <a href="index.html">Tornar a l'inventari</a>
                            <hr>
                            ${renderReparacions(pc.reparacions, pc.id)}
                        </div>
                        <div class="detall-icona">
                            ${(pc.portatil ? iconaPortatil : iconaSobretaula)}
                        </div>
                    </div>
                `;
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

main();
