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

    // Event listeners
    if (btnAfegirNota) btnAfegirNota.addEventListener('click', mostrarModalAfegirNota);
    if (btnCancelarNota) btnCancelarNota.addEventListener('click', tancarModalNota);
    if (formNota) formNota.addEventListener('submit', handleSubmitNota);
    if (modalAfegirNota) modalAfegirNota.addEventListener('click', handleClickForaModal);

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
    return urlParams.get('id');
}

// Carrega les dades del dispositiu
async function carregarDispositiu() {
    const id = obtenirIdDispositiu();
    console.log("Buscant dispositiu amb ID:", id);
    
    if (!id) {
        console.log("No s'ha trobat ID a la URL");
        mostrarError();
        amagarLoader();
        return;
    }

    try {
        // Cerca a totes les col·leccions
        const col·leccions = [
            { nom: 'pcs', tipus: 'PC' },
            { nom: 'mobils', tipus: 'Mòbil' },
            { nom: 'monitors', tipus: 'Monitor' },
            { nom: 'impressores', tipus: 'Impressora' },
            { nom: 'altresDispositius', tipus: 'Altres' }
        ];

        for (const col of col·leccions) {
            console.log(`Buscant a la col·lecció: ${col.nom}`);
            
            const docRef = doc(db, col.nom, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists) {
                console.log(`Trobat a ${col.nom}:`, docSnap.data());
                dispositiuActual = docSnap.data();
                tipusActual = col.tipus === 'Altres' ? dispositiuActual.tipus : col.tipus;
                mostrarDispositiu();
                amagarLoader();
                return;
            }
        }

        console.log("Dispositiu no trobat a cap col·lecció");
        mostrarError();
        amagarLoader();
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
        
    } else {
        const campsAltres = document.getElementById('camps-altres');
        if (campsAltres) campsAltres.style.display = 'block';
        
        // Omple els camps d'altres dispositius
        const camps = {
            'altres-id': dispositiuActual.id,
            'altres-nom': dispositiuActual.nom,
            'altres-model': dispositiuActual.model,
            'altres-tipus': dispositiuActual.tipus || tipusActual,
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

function formatarData(dataString) {
    if (!dataString) return 'N/A';
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('ca-ES');
    } catch (e) {
        return dataString;
    }
}

function mostrarError() {
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'block';
}

// Dins de guardarCanvisDispositiu per PC:
if (tipus === 'PC') {
    dadesActualitzades = {
        id: document.getElementById('edit-id').value,
        FQDN: document.getElementById('edit-fqdn').value,
        usuari: document.getElementById('edit-usuari').value,
        departament: document.getElementById('edit-departament').value, // AFEGEIX
        model: document.getElementById('edit-model').value,
        processador: document.getElementById('edit-processador').value,
        targetaGrafica: document.getElementById('edit-targeta-grafica').value,
        sistemaOperatiu: document.getElementById('edit-so').value,
        memoriaRAM: document.getElementById('edit-ram').value,
        emmagatzematge: document.getElementById('edit-emmagatzematge').value,
        dataAdquisicio: document.getElementById('edit-data').value
    };
} else if (tipus === 'Mòbil') {
    dadesActualitzades = {
        id: document.getElementById('edit-id').value,
        departament: document.getElementById('edit-departament').value, // AFEGEIX
        model: document.getElementById('edit-model').value,
        memoriaRAM: document.getElementById('edit-ram').value,
        memoriaInterna: document.getElementById('edit-interna').value,
        sn: document.getElementById('edit-sn').value,
        imei1: document.getElementById('edit-imei1').value,
        imei2: document.getElementById('edit-imei2').value,
        mailRegistre: document.getElementById('edit-mail').value,
        dataAdquisicio: document.getElementById('edit-data').value
    };
} else {
    dadesActualitzades = {
        id: document.getElementById('edit-id').value,
        nom: document.getElementById('edit-nom').value,
        departament: document.getElementById('edit-departament').value, // AFEGEIX
        model: document.getElementById('edit-model').value,
        tipus: document.getElementById('edit-tipus').value,
        dataAdquisicio: document.getElementById('edit-data').value
    };
}

// També cal afegir departament als modals d'edició dins del dispositiu.js
// Copia les mateixes funcions mostrarModalEdicio i guardarCanvisDispositiu del script.js

// Per exemple, dins de mostrarModalEdicio per PC:
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
        <div class="camp-edicio">
            <label for="edit-departament">Departament:</label>
            <input type="text" id="edit-departament" value="${dades.departament || ''}">
        </div>
        <!-- Rest dels camps igual -->
    `;
}