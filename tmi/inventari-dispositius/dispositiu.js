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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let dispositiuActual = null;
let tipusActual = '';

// Elements del DOM
const loading = document.getElementById('loading');
const content = document.getElementById('content');
const error = document.getElementById('error');
const dispositiuTitol = document.getElementById('dispositiu-titol');
const llistaNotes = document.getElementById('llista-notes');
const noNotes = document.getElementById('no-notes');
const btnAfegirNota = document.getElementById('btn-afegir-nota');
const modalAfegirNota = document.getElementById('modal-afegir-nota');
const formNota = document.getElementById('form-nota');
const btnCancelarNota = document.getElementById('btn-cancelar-nota');
const templateNota = document.getElementById('template-nota');

// Comprova autenticació
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Usuario autenticado:", user.email);
        carregarDispositiu();
    } else {
        window.location.href = "login.html";
    }
});

// Event listeners
btnAfegirNota.addEventListener('click', mostrarModalAfegirNota);
btnCancelarNota.addEventListener('click', tancarModalNota);
formNota.addEventListener('submit', handleSubmitNota);
modalAfegirNota.addEventListener('click', handleClickForaModal);

// Obté l'ID del dispositiu des de la URL
function obtenirIdDispositiu() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Carrega les dades del dispositiu
async function carregarDispositiu() {
    const id = obtenirIdDispositiu();
    if (!id) {
        mostrarError();
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
            const docRef = db.collection(col.nom).doc(id);
            const docSnap = await docRef.get();
            
            if (docSnap.exists()) {
                dispositiuActual = docSnap.data();
                tipusActual = col.tipus === 'Altres' ? dispositiuActual.tipus : col.tipus;
                mostrarDispositiu();
                return;
            }
        }

        mostrarError();
    } catch (error) {
        console.error('Error carregant dispositiu:', error);
        mostrarError();
    }
}

// Mostra la informació del dispositiu
function mostrarDispositiu() {
    loading.style.display = 'none';
    content.style.display = 'block';
    
    // Títol
    dispositiuTitol.textContent = `${tipusActual} - ID: ${dispositiuActual.id}`;
    
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
        document.getElementById('camps-pc').style.display = 'block';
        document.getElementById('pc-id').textContent = dispositiuActual.id || 'N/A';
        document.getElementById('pc-fqdn').textContent = dispositiuActual.FQDN || 'N/A';
        document.getElementById('pc-model').textContent = dispositiuActual.model || 'N/A';
        document.getElementById('pc-so').textContent = dispositiuActual.sistemaOperatiu || 'N/A';
        document.getElementById('pc-ram').textContent = dispositiuActual.memoriaRAM || 'N/A';
        document.getElementById('pc-emmagatzematge').textContent = dispositiuActual.emmagatzematge || 'N/A';
        document.getElementById('pc-data').textContent = formatarData(dispositiuActual.dataAdquisicio);
    } else if (tipusActual === 'Mòbil') {
        document.getElementById('camps-mobil').style.display = 'block';
        document.getElementById('mobil-id').textContent = dispositiuActual.id || 'N/A';
        document.getElementById('mobil-model').textContent = dispositiuActual.model || 'N/A';
        document.getElementById('mobil-ram').textContent = dispositiuActual.memoriaRAM || 'N/A';
        document.getElementById('mobil-interna').textContent = dispositiuActual.memoriaInterna || 'N/A';
        document.getElementById('mobil-sn').textContent = dispositiuActual.sn || 'N/A';
        document.getElementById('mobil-imei1').textContent = dispositiuActual.imei1 || 'N/A';
        document.getElementById('mobil-imei2').textContent = dispositiuActual.imei2 || 'N/A';
        document.getElementById('mobil-mail').textContent = dispositiuActual.mailRegistre || 'N/A';
        document.getElementById('mobil-data').textContent = formatarData(dispositiuActual.dataAdquisicio);
    } else {
        document.getElementById('camps-altres').style.display = 'block';
        document.getElementById('altres-id').textContent = dispositiuActual.id || 'N/A';
        document.getElementById('altres-nom').textContent = dispositiuActual.nom || 'N/A';
        document.getElementById('altres-model').textContent = dispositiuActual.model || 'N/A';
        document.getElementById('altres-tipus').textContent = dispositiuActual.tipus || tipusActual;
        document.getElementById('altres-data').textContent = formatarData(dispositiuActual.dataAdquisicio);
    }
}

// Mostra les notes del dispositiu
function mostrarNotes() {
    const notes = dispositiuActual.notes || [];
    
    // Neteja el contenidor de notes
    const notesExistents = llistaNotes.querySelectorAll('.nota-item');
    notesExistents.forEach(nota => nota.remove());
    
    if (notes.length === 0) {
        noNotes.style.display = 'block';
        return;
    }
    
    noNotes.style.display = 'none';
    
    // Ordena les notes per data (més recent primer)
    notes.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    notes.forEach((nota, index) => {
        const notaElement = templateNota.content.cloneNode(true);
        
        notaElement.querySelector('.nota-titol').textContent = nota.titol;
        notaElement.querySelector('.nota-data').textContent = formatarData(nota.data);
        notaElement.querySelector('.nota-descripcio').textContent = nota.descripcio;
        notaElement.querySelector('.btn-eliminar-nota').dataset.index = index;
        
        // Event listener per eliminar nota
        notaElement.querySelector('.btn-eliminar-nota').addEventListener('click', function() {
            eliminarNota(parseInt(this.dataset.index));
        });
        
        llistaNotes.appendChild(notaElement);
    });
}

// Gestió del modal
function mostrarModalAfegirNota() {
    modalAfegirNota.style.display = 'flex';
    document.getElementById('nota-titol').value = '';
    document.getElementById('nota-descripcio').value = '';
}

function tancarModalNota() {
    modalAfegirNota.style.display = 'none';
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
        const titol = document.getElementById('nota-titol').value;
        const descripcio = document.getElementById('nota-descripcio').value;
        
        const novaNota = {
            titol: titol,
            descripcio: descripcio,
            data: new Date().toISOString()
        };
        
        // Obté la col·lecció correcta
        const col·leccio = obtenirCol·leccio(tipusActual);
        const docRef = db.collection(col·leccio).doc(dispositiuActual.id);
        
        // Afegeix la nota a l'array
        await docRef.update({
            notes: firebase.firestore.FieldValue.arrayUnion(novaNota)
        });
        
        // Actualitza les dades locals
        if (!dispositiuActual.notes) {
            dispositiuActual.notes = [];
        }
        dispositiuActual.notes.push(novaNota);
        
        // Tanca el modal i refresca les notes
        tancarModalNota();
        mostrarNotes();
        
    } catch (error) {
        console.error('Error afegint nota:', error);
        alert('Error afegint la nota');
    }
}

// Elimina una nota
async function eliminarNota(index) {
    if (!confirm('Estàs segur que vols eliminar aquesta nota?')) {
        return;
    }
    
    try {
        const nota = dispositiuActual.notes[index];
        const col·leccio = obtenirCol·leccio(tipusActual);
        const docRef = db.collection(col·leccio).doc(dispositiuActual.id);
        
        // Elimina la nota de l'array
        await docRef.update({
            notes: firebase.firestore.FieldValue.arrayRemove(nota)
        });
        
        // Actualitza les dades locals
        dispositiuActual.notes.splice(index, 1);
        
        // Refresca les notes
        mostrarNotes();
        
    } catch (error) {
        console.error('Error eliminant nota:', error);
        alert('Error eliminant la nota');
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
    loading.style.display = 'none';
    error.style.display = 'block';
}