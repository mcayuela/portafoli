// Configuració Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDqsy5zE7YnUuMt80ZskvvUVFjIiVTdOB8",
    authDomain: "inventari-pc-s.firebaseapp.com",
    projectId: "inventari-pc-s",
    storageBucket: "inventari-pc-s.appspot.com",
    messagingSenderId: "998595234302",
    appId: "1:998595234302:web:d253d36f99d82b549f18af",
    measurementId: "G-0QM2VV5NZD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let dispositiuActual = null;
let tipusActual = '';

// Elements del DOM
let globalLoader, loading, content, error, dispositiuTitol, llistaNotes, noNotes;
let btnAfegirNota, modalAfegirNota, formNota, btnCancelarNota, templateNota;
let btnEditarDispositiu, btnGuardarCanvis, btnCancelarEdicio;
let modalComentariEdicio, formComentari, btnCancelarComentari;

let modeEdicio = false;

// FUNCIONS DEL LOADER
function mostrarLoader() {
    if (globalLoader) {
        globalLoader.classList.remove('hidden');
    }
}

function amagarLoader() {
    if (globalLoader) {
        globalLoader.classList.add('hidden');
    }
}

// Inicialització quan el DOM està carregat
document.addEventListener('DOMContentLoaded', () => {
    // Obtenir referències dels elements DOM
    globalLoader = document.getElementById('global-loader');
    loading = document.getElementById('loading');
    content = document.getElementById('content');
    error = document.getElementById('error');
    dispositiuTitol = document.getElementById('dispositiu-titol');
    llistaNotes = document.getElementById('llista-notes');
    noNotes = document.getElementById('no-notes');
    btnAfegirNota = document.getElementById('btn-afegir-nota');
    modalAfegirNota = document.getElementById('modal-afegir-nota');
    formNota = document.getElementById('form-nota');
    btnCancelarNota = document.getElementById('btn-cancelar-nota');
    templateNota = document.getElementById('template-nota');
    btnEditarDispositiu = document.getElementById('btn-editar-dispositiu');
    btnGuardarCanvis = document.getElementById('btn-guardar-canvis');
    btnCancelarEdicio = document.getElementById('btn-cancelar-edicio');
    modalComentariEdicio = document.getElementById('modal-comentari-edicio');
    formComentari = document.getElementById('form-comentari');
    btnCancelarComentari = document.getElementById('btn-cancelar-comentari');

    // Event listeners
    if (btnAfegirNota) btnAfegirNota.addEventListener('click', mostrarModalAfegirNota);
    if (btnCancelarNota) btnCancelarNota.addEventListener('click', tancarModalNota);
    if (formNota) formNota.addEventListener('submit', handleSubmitNota);
    if (modalAfegirNota) modalAfegirNota.addEventListener('click', handleClickForaModal);
    if (btnEditarDispositiu) btnEditarDispositiu.addEventListener('click', () => activarModeEdicio(true));
    if (btnCancelarEdicio) btnCancelarEdicio.addEventListener('click', () => activarModeEdicio(false));
    if (btnGuardarCanvis) btnGuardarCanvis.addEventListener('click', demanarComentariPerGuardar);
    if (formComentari) formComentari.addEventListener('submit', handleGuardarCanvis);
    if (btnCancelarComentari) btnCancelarComentari.addEventListener('click', () => modalComentariEdicio.style.display = 'none');

    mostrarLoader();

    // Comprova autenticació
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuario autenticado:", user.email);
            carregarDispositiu();
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
            <h3>Inicia sessió per veure el dispositiu</h3>
            <input type="email" id="login-email" placeholder="Correu electrònic" />
            <input type="password" id="login-password" placeholder="Contrasenya" />
            <button id="login-btn">Entrar</button>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#login-btn').onclick = async () => {
        const email = modal.querySelector('#login-email').value;
        const password = modal.querySelector('#login-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            document.body.removeChild(modal);
            // No cal cridar a carregarDispositiu() aquí, onAuthStateChanged ho farà.
        } catch (err) {
            alert('Credencials incorrectes');
        }
    };
}

// Obté l'ID del dispositiu des de la URL
function obtenirIdDispositiu() {
    const urlParams = new URLSearchParams(window.location.search);
    return { id: urlParams.get('id'), tipus: urlParams.get('tipus') };
}

// Carrega les dades del dispositiu
async function carregarDispositiu() {
    const { id, tipus } = obtenirIdDispositiu();
    console.log("Buscant dispositiu amb ID:", id);
    
    if (!id) {
        console.log("No s'ha trobat ID a la URL");
        mostrarError();
        amagarLoader();
        return;
    }

    try {
        const col·leccio = obtenirCol·leccio(tipus);
        console.log(`Buscant a la col·lecció: ${col·leccio} amb tipus: ${tipus}`);

        const docRef = doc(db, col·leccio, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`Trobat a ${col·leccio}:`, docSnap.data());
            dispositiuActual = { ...docSnap.data(), id: docSnap.id }; // Assegurem que l'ID està a l'objecte
            tipusActual = tipus; // Utilitzem el tipus de la URL
            mostrarDispositiu();
        } else {
            console.log("Dispositiu no trobat a la col·lecció especificada.");
            mostrarError();
        }
    } catch (error) {
        console.error('Error carregant dispositiu:', error);
        mostrarError();
        amagarLoader();
    }
}


// Mostra la informació del dispositiu
function mostrarDispositiu() {
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';
    
    // Títol
    if (dispositiuTitol) {
        dispositiuTitol.textContent = `${tipusActual} - ID: ${dispositiuActual.id}`;
    }
    
    // Camps del dispositiu
    mostrarCampsDispositiu();
    
    // Notes
    mostrarNotes();
    amagarLoader();
}

// Mostra els camps del dispositiu segons el tipus
function mostrarCampsDispositiu() {
    // Amaga tots els grups de camps
    document.querySelectorAll('.camps-tipus').forEach(el => el.style.display = 'none');

    if (tipusActual === 'PC') {
        const campsPC = document.getElementById('camps-pc');
        if (campsPC) campsPC.style.display = 'block';
        
        // Omple els camps del PC
        const camps = {
            'pc-id': dispositiuActual.id,
            'pc-fqdn': dispositiuActual.FQDN,
            'pc-usuari': dispositiuActual.usuari,
            'pc-model': dispositiuActual.model,
            'pc-processador': dispositiuActual.processador,
            'pc-targeta-grafica': dispositiuActual.targetaGrafica,
            'pc-so': dispositiuActual.sistemaOperatiu,
            'pc-ram': dispositiuActual.memoriaRAM,
            'pc-emmagatzematge': dispositiuActual.emmagatzematge, // Corregit: era dataAdquisicio
            'pc-teamviewer': dispositiuActual.codiTeamViewer, // NOU CAMP
            'pc-data': formatarData(dispositiuActual.dataAdquisicio)
        };
        
        Object.keys(camps).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = camps[id] || 'N/A';
        });
        
    } else if (tipusActual === 'Mòbil') {
        const campsMobil = document.getElementById('camps-mobil');
        if (campsMobil) campsMobil.style.display = 'block';
        
        // Omple els camps del mòbil
        const camps = {
            'mobil-id': dispositiuActual.id,
            'mobil-model': dispositiuActual.model,
            'mobil-ram': dispositiuActual.memoriaRAM,
            'mobil-interna': dispositiuActual.memoriaInterna,
            'mobil-sn': dispositiuActual.sn,
            'mobil-imei1': dispositiuActual.imei1,
            'mobil-imei2': dispositiuActual.imei2,
            'mobil-mail': dispositiuActual.mailRegistre,
            'mobil-data': formatarData(dispositiuActual.dataAdquisicio)
        };
        
        Object.keys(camps).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = camps[id] || 'N/A';
        });
        
    } else if (tipusActual === 'Impressora') {
        const campsImpressora = document.getElementById('camps-impressora');
        if (campsImpressora) campsImpressora.style.display = 'block';

        // Omple els camps de la impressora
        const camps = {
            'impressora-id': dispositiuActual.id,
            'impressora-nom': dispositiuActual.nom,
            'impressora-model': dispositiuActual.model,
            'impressora-sn': dispositiuActual.sn,
            'impressora-departament': dispositiuActual.departament,
            'impressora-data': formatarData(dispositiuActual.dataAdquisicio)
        };

        Object.keys(camps).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = camps[id] || 'N/A';
        });

    } else {
        const campsAltres = document.getElementById('camps-altres');
        if (campsAltres) campsAltres.style.display = 'block';
        
        // Omple els camps d'altres dispositius
        const camps = {
            'altres-id': dispositiuActual.id,
            'altres-nom': dispositiuActual.nom,
            'altres-model': dispositiuActual.model,
            'altres-tipus': tipusActual,
            'altres-data': formatarData(dispositiuActual.dataAdquisicio)
        };
        
        Object.keys(camps).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = camps[id] || 'N/A';
        });
    }
}

// Mostra les notes del dispositiu
function mostrarNotes() {
    const notes = dispositiuActual.notes || [];
    
    // Neteja el contenidor de notes
    if (llistaNotes) {
        const notesExistents = llistaNotes.querySelectorAll('.nota-item');
        notesExistents.forEach(nota => nota.remove());
    }
    
    if (notes.length === 0) {
        if (noNotes) noNotes.style.display = 'block';
        return;
    }
    
    if (noNotes) noNotes.style.display = 'none';
    
    // Ordena les notes per data (més recent primer)
    notes.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    notes.forEach((nota, index) => {
        if (templateNota) {
            const notaElement = templateNota.content.cloneNode(true);
            
            notaElement.querySelector('.nota-titol').textContent = nota.titol;
            notaElement.querySelector('.nota-data').textContent = formatarData(nota.data);
            notaElement.querySelector('.nota-descripcio').textContent = nota.descripcio;
            notaElement.querySelector('.btn-eliminar-nota').dataset.index = index;
            
            // Event listener per eliminar nota
            notaElement.querySelector('.btn-eliminar-nota').addEventListener('click', function() {
                eliminarNota(parseInt(this.dataset.index));
            });
            
            if (llistaNotes) llistaNotes.appendChild(notaElement);
        }
    });
}

// Gestió del modal
function mostrarModalAfegirNota() {
    if (modalAfegirNota) modalAfegirNota.style.display = 'flex';
    const notaTitol = document.getElementById('nota-titol');
    const notaDescripcio = document.getElementById('nota-descripcio');
    if (notaTitol) notaTitol.value = '';
    if (notaDescripcio) notaDescripcio.value = '';
}

function tancarModalNota() {
    if (modalAfegirNota) modalAfegirNota.style.display = 'none';
}

function handleClickForaModal(e) {
    if (e.target === modalAfegirNota) {
        tancarModalNota();
    }
}

function handleSubmitNota(e) {
    e.preventDefault();
    afegirNota();
}

// Afegeix una nova nota
async function afegirNota() {
    try {
        mostrarLoader();
        
        const titol = document.getElementById('nota-titol').value;
        const descripcio = document.getElementById('nota-descripcio').value;
        
        const novaNota = {
            titol: titol,
            descripcio: descripcio,
            data: new Date().toISOString()
        };
        
        // Obté la col·lecció correcta
        const col·leccio = obtenirCol·leccio(tipusActual);
        const docRef = doc(db, col·leccio, dispositiuActual.id);
        
        // Afegeix la nota a l'array
        await updateDoc(docRef, {
            notes: arrayUnion(novaNota)
        });
        
        // Actualitza les dades locals
        if (!dispositiuActual.notes) {
            dispositiuActual.notes = [];
        }
        dispositiuActual.notes.push(novaNota);
        
        // Tanca el modal i refresca les notes
        tancarModalNota();
        mostrarNotes();
        
        amagarLoader();
        
    } catch (error) {
        console.error('Error afegint nota:', error);
        alert('Error afegint la nota');
        amagarLoader();
    }
}

// Elimina una nota
async function eliminarNota(index) {
    if (!confirm('Estàs segur que vols eliminar aquesta nota?')) {
        return;
    }
    
    try {
        mostrarLoader();
        
        const nota = dispositiuActual.notes[index];
        const col·leccio = obtenirCol·leccio(tipusActual);
        const docRef = doc(db, col·leccio, dispositiuActual.id);
        
        // Elimina la nota de l'array
        await updateDoc(docRef, {
            notes: arrayRemove(nota)
        });
        
        // Actualitza les dades locals
        dispositiuActual.notes.splice(index, 1);
        
        // Refresca les notes
        mostrarNotes();
        
        amagarLoader();
        
    } catch (error) {
        console.error('Error eliminant nota:', error);
        alert('Error eliminant la nota');
        amagarLoader();
    }
}

// --- LÒGICA D'EDICIÓ DEL DISPOSITIU ---

function activarModeEdicio(activar) {
    modeEdicio = activar;
    const contenidorCamps = document.querySelector('.dispositiu-info');
    const campsSpan = contenidorCamps.querySelectorAll('span[id]');

    campsSpan.forEach(span => {
        const esCampId = span.id.endsWith('-id');
        if (esCampId) return; // No fem editable el camp ID

        if (activar) {
            const valorActual = span.textContent === 'N/A' ? '' : span.textContent;
            let input;

            if (span.id.endsWith('-data')) {
                input = document.createElement('input');
                input.type = 'date';
                // Convertim format dd/mm/yyyy a yyyy-mm-dd per l'input
                if (valorActual) {
                    const parts = valorActual.split('/');
                    if (parts.length === 3) {
                        input.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = valorActual;
            }
            
            input.id = span.id; // Mantenim el mateix ID
            input.className = 'input-edicio';
            span.replaceWith(input);
        } else {
            // Tornar a span (cancelar)
            const input = document.getElementById(span.id);
            const nouSpan = document.createElement('span');
            nouSpan.id = span.id;
            // Busquem el valor original a l'objecte dispositiuActual
            const clau = span.id.split('-').slice(1).join('-');
            const clauCamelCase = clau.replace(/-([a-z])/g, g => g[1].toUpperCase());
            nouSpan.textContent = dispositiuActual[clauCamelCase] || dispositiuActual[span.id.split('-')[1]] || 'N/A';
            if (span.id.endsWith('-data')) {
                nouSpan.textContent = formatarData(dispositiuActual.dataAdquisicio);
            }
            input.replaceWith(nouSpan);
        }
    });

    // Canvia la visibilitat dels botons
    btnEditarDispositiu.classList.toggle('hidden', activar);
    btnGuardarCanvis.classList.toggle('hidden', !activar);
    btnCancelarEdicio.classList.toggle('hidden', !activar);
}

function demanarComentariPerGuardar() {
    // Comprovem si hi ha hagut canvis reals
    const inputs = document.querySelectorAll('.input-edicio');
    let canvisDetectats = false;
    inputs.forEach(input => {
        const clau = input.id.split('-').slice(1).join('-');
        const clauCamelCase = clau.replace(/-([a-z])/g, g => g[1].toUpperCase());
        let valorOriginal = dispositiuActual[clauCamelCase] || dispositiuActual[input.id.split('-')[1]] || '';
        let valorActual = input.value;

        if (input.type === 'date') {
            valorOriginal = formatarData(valorOriginal, 'yyyy-mm-dd');
        }

        if (String(valorOriginal) !== valorActual) {
            canvisDetectats = true;
        }
    });

    if (!canvisDetectats) {
        alert("No s'han detectat canvis per guardar.");
        activarModeEdicio(false); // Surt del mode edició
        return;
    }

    // Si hi ha canvis, mostra el modal per al comentari
    modalComentariEdicio.style.display = 'flex';
    document.getElementById('comentari-descripcio').value = ''; // Neteja el camp
}

async function handleGuardarCanvis(e) {
    e.preventDefault();
    const comentari = document.getElementById('comentari-descripcio').value.trim();

    if (!comentari) {
        alert("El comentari és obligatori per desar els canvis.");
        return;
    }

    mostrarLoader();
    modalComentariEdicio.style.display = 'none';

    try {
        const dadesActualitzades = {};
        const inputs = document.querySelectorAll('.input-edicio');

        inputs.forEach(input => {
            const clau = input.id.split('-').slice(1).join('-');
            const clauCamelCase = clau.replace(/-([a-z])/g, g => g[1].toUpperCase());
            dadesActualitzades[clauCamelCase] = input.value;
        });

        // Canviem el nom de la clau FQDN si existeix
        if (dadesActualitzades.hasOwnProperty('fqdn')) {
            dadesActualitzades.FQDN = dadesActualitzades.fqdn;
            delete dadesActualitzades.fqdn;
        }

        // Afegim la data d'última edició
        dadesActualitzades.dataUltimaEdicio = new Date().toISOString();

        // Creem la nota amb el comentari
        const novaNota = {
            titol: "Edició de Dispositiu",
            descripcio: comentari,
            data: new Date().toISOString(),
            usuari: auth.currentUser.email
        };

        // Afegim la nota a l'array de notes per actualitzar
        dadesActualitzades.notes = arrayUnion(novaNota);

        const col·leccio = obtenirCol·leccio(tipusActual);
        const docRef = doc(db, col·leccio, dispositiuActual.id);

        await updateDoc(docRef, dadesActualitzades);

        // Recarreguem les dades per mostrar la informació actualitzada
        await carregarDispositiu();
        
        // Sortim del mode edició
        activarModeEdicio(false);

    } catch (error) {
        console.error("Error guardant els canvis:", error);
        alert("S'ha produït un error en desar els canvis.");
        amagarLoader();
    }
}


// Funcions auxiliars
function obtenirCol·leccio(tipus) {
    switch (tipus) {
        case 'PC': return 'pcs';
        case 'Mòbil': return 'mobils';
        case 'Monitor': return 'monitors';
        case 'Impressora': return 'impressores';
        default: return 'altresDispositius';
    }
}

function formatarData(dataString, format = 'dd/mm/yyyy') {
    if (!dataString) return 'N/A';
    try {
        const data = new Date(dataString);
        if (format === 'dd/mm/yyyy') {
            return data.toLocaleDateString('ca-ES');
        } else if (format === 'yyyy-mm-dd') {
            return data.toISOString().split('T')[0];
        }
        return data.toLocaleDateString('ca-ES');
    } catch (e) {
        console.warn(`Error formatant data: ${dataString}`, e);
        return dataString;
    }
}

function mostrarError() {
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'block';
}