// Configuració Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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
// Elements per Reparacions
let btnAfegirReparacio, modalAfegirReparacio, formReparacio, btnCancelarReparacio;
let taulaReparacions, bodyReparacions, noReparacions;
let modalDetallReparacio, btnTancarDetallRep;
let detallRepTitol, detallRepDescripcio, detallRepPeces, detallRepDates, detallRepImatges;
let indexReparacioEditant = null; // Variable per controlar si estem editant


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
    onAuthStateChanged(auth, (user) => {
        if (user) {
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
            
            // Referències Reparacions
            btnAfegirReparacio = document.getElementById('btn-afegir-reparacio');
            modalAfegirReparacio = document.getElementById('modal-afegir-reparacio');
            formReparacio = document.getElementById('form-reparacio');
            btnCancelarReparacio = document.getElementById('btn-cancelar-reparacio');
            taulaReparacions = document.getElementById('taula-reparacions');
            bodyReparacions = document.getElementById('body-reparacions');
            noReparacions = document.getElementById('no-reparacions');
            
            // Referències Detall Reparació
            modalDetallReparacio = document.getElementById('modal-detall-reparacio');
            btnTancarDetallRep = document.getElementById('btn-tancar-detall-rep');
            detallRepTitol = document.getElementById('detall-rep-titol');
            detallRepDescripcio = document.getElementById('detall-rep-descripcio');
            detallRepPeces = document.getElementById('detall-rep-peces');
            detallRepDates = document.getElementById('detall-rep-dates');
            detallRepImatges = document.getElementById('detall-rep-imatges');

            // Event listeners
            if (btnAfegirNota) btnAfegirNota.addEventListener('click', mostrarModalAfegirNota);
            if (btnCancelarNota) btnCancelarNota.addEventListener('click', tancarModalNota);
            if (formNota) formNota.addEventListener('submit', handleSubmitNota);
            if (modalAfegirNota) modalAfegirNota.addEventListener('click', handleClickForaModal);
            
            if (btnAfegirReparacio) btnAfegirReparacio.addEventListener('click', mostrarModalAfegirReparacio);
            if (btnCancelarReparacio) btnCancelarReparacio.addEventListener('click', tancarModalReparacio);
            if (formReparacio) formReparacio.addEventListener('submit', handleSubmitReparacio);
            
            if (btnTancarDetallRep) btnTancarDetallRep.addEventListener('click', tancarModalDetallReparacio);

            mostrarLoader();

            carregarDispositiu();
        } else {
            sessionStorage.setItem('urlDesti', window.location.href);
            window.location.href = "https://www.mcayuela.com/tmi";
        }
    });
});

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

    // Llista de col·leccions on buscar
    const col·leccions = [
        { nom: 'pcs', tipus: 'PC' },
        { nom: 'mobils', tipus: 'Mòbil' },
        { nom: 'monitors', tipus: 'Monitor' },
        { nom: 'impressores', tipus: 'Impressora' },
        { nom: 'altresDispositius', tipus: 'Altres' }
    ];

    let trobat = false;

    for (const col of col·leccions) {
        try {
            const docRef = doc(db, col.nom, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log(`Trobat a ${col.nom}:`, docSnap.data());
                dispositiuActual = { ...docSnap.data(), id: docSnap.id };
                
                // Determinem el tipus correcte
                if (col.nom === 'altresDispositius') {
                    tipusActual = dispositiuActual.tipus || 'Altres';
                } else {
                    tipusActual = col.tipus;
                }
                
                trobat = true;
                break; // Sortim del bucle si l'hem trobat
            }
        } catch (error) {
            console.error(`Error cercant a ${col.nom}:`, error);
        }
    }

    if (trobat) {
        mostrarDispositiu();
    } else {
        console.log("Dispositiu no trobat a cap col·lecció.");
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
    
    // Reparacions
    mostrarReparacions();
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
            'pc-sn': dispositiuActual.sn,
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
            'mobil-usuari': dispositiuActual.usuari,
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
            'altres-sn': dispositiuActual.sn,
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
    if (modalAfegirReparacio && e.target === modalAfegirReparacio) {
        tancarModalReparacio();
    }
    if (modalDetallReparacio && e.target === modalDetallReparacio) {
        tancarModalDetallReparacio();
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

// --- GESTIÓ DE REPARACIONS ---

function mostrarReparacions() {
    const reparacions = dispositiuActual.reparacions || [];
    
    if (bodyReparacions) bodyReparacions.innerHTML = '';
    
    if (reparacions.length === 0) {
        if (noReparacions) noReparacions.style.display = 'block';
        if (taulaReparacions) taulaReparacions.style.display = 'none';
        return;
    }
    
    if (noReparacions) noReparacions.style.display = 'none';
    if (taulaReparacions) taulaReparacions.style.display = 'table';
    
    // Ordena per data inici (més recent primer)
    reparacions.sort((a, b) => new Date(b.dataInici) - new Date(a.dataInici));
    
    reparacions.forEach((rep, index) => {
        const tr = document.createElement('tr');
        
        // Determina classe segons estat (si té data fi o no)
        if (rep.dataFi) {
            tr.classList.add('reparacio-acabada');
        } else {
            tr.classList.add('reparacio-pendent');
        }
        
        tr.innerHTML = `
            <td><strong>${rep.nom}</strong></td>
            <td>${formatarData(rep.dataInici)}</td>
            <td>${rep.dataFi ? formatarData(rep.dataFi) : 'En curs'}</td>
            <td style="text-align: center;">
                <button class="btn-editar-rep" data-index="${index}" title="Editar reparació">✎</button>
                <button class="btn-eliminar-rep" data-index="${index}" title="Eliminar reparació">×</button>
            </td>
        `;
        
        // Click a la fila per veure detalls (excepte si cliquem els botons d'acció)
        tr.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-eliminar-rep') && !e.target.classList.contains('btn-editar-rep')) {
                mostrarDetallReparacio(rep);
            }
        });

        // Event per editar
        const btnEditar = tr.querySelector('.btn-editar-rep');
        if (btnEditar) {
            btnEditar.addEventListener('click', (e) => {
                e.stopPropagation();
                editarReparacio(index);
            });
        }

        // Event per eliminar
        const btnEliminar = tr.querySelector('.btn-eliminar-rep');
        if (btnEliminar) {
            btnEliminar.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita obrir el modal
                eliminarReparacio(index);
            });
        }
        
        if (bodyReparacions) bodyReparacions.appendChild(tr);
    });
}

function mostrarModalAfegirReparacio() {
    if (modalAfegirReparacio) modalAfegirReparacio.style.display = 'flex';
    
    // Resetegem estat d'edició
    indexReparacioEditant = null;
    const titolModal = document.getElementById('titol-modal-reparacio');
    if (titolModal) titolModal.textContent = 'Nova Reparació';

    // Neteja camps
    document.getElementById('rep-nom').value = '';
    document.getElementById('rep-descripcio').value = '';
    document.getElementById('rep-peces').value = '';
    document.getElementById('rep-imatges').value = '';
    document.getElementById('rep-data-inici').value = new Date().toISOString().split('T')[0];
    document.getElementById('rep-data-fi').value = '';
}

function editarReparacio(index) {
    const reparacio = dispositiuActual.reparacions[index];
    if (!reparacio) return;

    indexReparacioEditant = index;
    if (modalAfegirReparacio) modalAfegirReparacio.style.display = 'flex';
    
    const titolModal = document.getElementById('titol-modal-reparacio');
    if (titolModal) titolModal.textContent = 'Editar Reparació';

    document.getElementById('rep-nom').value = reparacio.nom || '';
    document.getElementById('rep-descripcio').value = reparacio.descripcio || '';
    document.getElementById('rep-peces').value = reparacio.peces || '';
    document.getElementById('rep-imatges').value = ''; // No podem pre-omplir input file
    document.getElementById('rep-data-inici').value = reparacio.dataInici || '';
    document.getElementById('rep-data-fi').value = reparacio.dataFi || '';
}

function tancarModalReparacio() {
    if (modalAfegirReparacio) modalAfegirReparacio.style.display = 'none';
}

function mostrarDetallReparacio(rep) {
    if (modalDetallReparacio) {
        detallRepTitol.textContent = rep.nom;
        detallRepDescripcio.textContent = rep.descripcio || '-';
        detallRepPeces.textContent = rep.peces || '-';
        
        const inici = formatarData(rep.dataInici);
        const fi = rep.dataFi ? formatarData(rep.dataFi) : 'En curs';
        detallRepDates.textContent = `${inici} - ${fi}`;
        
        detallRepImatges.innerHTML = '';
        if (rep.imatges && Array.isArray(rep.imatges)) {
            rep.imatges.forEach(imgSrc => {
                const img = document.createElement('img');
                img.src = imgSrc;
                detallRepImatges.appendChild(img);
            });
        } else if (rep.imatgesStr) {
            // Compatibilitat amb versions anteriors si n'hi hagués
            const imgs = rep.imatgesStr.split('|');
            imgs.forEach(imgSrc => {
                if(imgSrc) {
                    const img = document.createElement('img');
                    img.src = imgSrc;
                    detallRepImatges.appendChild(img);
                }
            });
        }
        
        modalDetallReparacio.style.display = 'flex';
    }
}

function tancarModalDetallReparacio() {
    if (modalDetallReparacio) modalDetallReparacio.style.display = 'none';
}

async function handleSubmitReparacio(e) {
    e.preventDefault();
    
    try {
        mostrarLoader();
        
        if (!dispositiuActual || !dispositiuActual.id) {
            throw new Error("No s'ha carregat el dispositiu correctament.");
        }

        // 1. Recollida de valors i validació bàsica
        const nom = (document.getElementById('rep-nom').value || '').trim();
        const descripcio = (document.getElementById('rep-descripcio').value || '').trim();
        const peces = (document.getElementById('rep-peces').value || '').trim();
        const dataInici = document.getElementById('rep-data-inici').value; // Input date ja retorna string buit o data
        const dataFi = document.getElementById('rep-data-fi').value;
        const inputImatges = document.getElementById('rep-imatges');
        
        // 2. Processar imatges a Base64
        const imatgesBase64 = [];
        if (inputImatges && inputImatges.files && inputImatges.files.length > 0) {
            for (const file of inputImatges.files) {
                // Limitem a 2-3 fotos màxim per no superar el límit d'1MB de Firestore
                if (imatgesBase64.length < 3) {
                    const base64 = await llegirFitxerComBase64(file);
                    imatgesBase64.push(base64);
                }
            }
        }
        
        // 3. Construir l'objecte reparació
        let reparacioObjecte = {
            nom: nom,
            descripcio: descripcio,
            peces: peces,
            dataInici: dataInici || new Date().toISOString().split('T')[0],
            dataFi: dataFi ? dataFi : null, // Si és string buit, posem null
            dataRegistre: new Date().toISOString() // Per defecte nova data
        };

        // Gestió d'imatges en edició
        if (indexReparacioEditant !== null) {
            // Estem editant
            const reparacioAntiga = dispositiuActual.reparacions[indexReparacioEditant];
            
            // Si no s'han pujat noves imatges, mantenim les antigues
            if (imatgesBase64.length === 0 && reparacioAntiga.imatges) {
                reparacioObjecte.imatges = reparacioAntiga.imatges;
            } else {
                reparacioObjecte.imatges = imatgesBase64;
            }
            // Mantenim la data de registre original
            reparacioObjecte.dataRegistre = reparacioAntiga.dataRegistre || new Date().toISOString();
        } else {
            // Nova reparació
            reparacioObjecte.imatges = imatgesBase64;
        }
        
        const col·leccio = obtenirCol·leccio(tipusActual);
        const docRef = doc(db, col·leccio, String(dispositiuActual.id));
        
        // 4. Obtenir dades actuals per fer el push manual
        // Això evita problemes amb arrayUnion i objectes complexos
        const docSnap = await getDoc(docRef);
        let llistaReparacions = [];
        
        if (docSnap.exists()) {
            const dadesDoc = docSnap.data();
            // Copiem l'array per no mutar l'original directament si fos reactiu
            if (Array.isArray(dadesDoc.reparacions)) {
                llistaReparacions = [...dadesDoc.reparacions];
            }
        }
        
        if (indexReparacioEditant !== null) {
            // Actualitzem la reparació existent
            llistaReparacions[indexReparacioEditant] = reparacioObjecte;
        } else {
            // Afegim la nova reparació al final
            llistaReparacions.push(reparacioObjecte);
        }
        
        // 5. Actualització
        // Utilitzem JSON.parse/stringify com a mesura de seguretat extra per netejar l'objecte
        // i assegurar que és un "Plain Old JavaScript Object" sense prototips estranys
        const llistaNeta = JSON.parse(JSON.stringify(llistaReparacions));

        await updateDoc(docRef, { reparacions: llistaNeta });

        // Actualitzem l'estat local
        dispositiuActual.reparacions = llistaNeta;
        
        tancarModalReparacio();
        mostrarReparacions();
        amagarLoader();
        alert('Reparació i fotos guardades correctament a la base de dades.');
        
    } catch (error) {
        console.error('Error Firebase:', error);
        amagarLoader();
        if (error.message.includes('too large')) {
            alert('Error: Les fotos ocupen massa espai. Prova amb imatges més petites.');
        } else {
            alert('Error guardant la reparació: ' + error.message);
        }
    }
}

function llegirFitxerComBase64(fitxer) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fitxer);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function eliminarReparacio(index) {
    if (!confirm('Estàs segur que vols eliminar aquesta reparació?')) return;

    try {
        mostrarLoader();
        
        const col·leccio = obtenirCol·leccio(tipusActual);
        const docRef = doc(db, col·leccio, String(dispositiuActual.id));
        
        // Llegim de nou per seguretat
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const dades = docSnap.data();
            let llista = Array.isArray(dades.reparacions) ? [...dades.reparacions] : [];
            
            // Eliminem l'element a l'índex
            llista.splice(index, 1);
            
            // Guardem
            await updateDoc(docRef, { reparacions: llista });
            
            // Actualitzem local
            dispositiuActual.reparacions = llista;
            mostrarReparacions();
        }
        amagarLoader();
    } catch (error) {
        console.error('Error eliminant reparació:', error);
        alert('Error eliminant: ' + error.message);
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