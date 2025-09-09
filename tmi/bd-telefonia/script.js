let extensions = [];
let paginaActual = 1;
let resultatsFiltrats = [];
const RESULTATS_PER_PAGINA = 50;

const cercador = document.getElementById('buscador');
const selectDepartament = document.querySelector('.filtreDepartament');
const contenidorSubfiltre = document.getElementById('contenidor-subfiltre');
const resultats = document.getElementById('resultats');

// Carrega dades del JSON
fetch('arxiu_telefonia.json')
    .then(res => res.json())
    .then(data => {
        extensions = data;
        inicialitzaFiltres();
        filtraIDepSub('', '');
    });

// Crea mapa departament -> subdepartaments
let departamentMap = {};
function inicialitzaFiltres() {
    departamentMap = {};
    extensions.forEach(e => {
        if (!e.departament) return;
        const [dep, subdep] = e.departament.split('/');
        if (!departamentMap[dep]) departamentMap[dep] = new Set();
        if (subdep) departamentMap[dep].add(subdep);
    });
    // Omple el select només amb departaments principals
    selectDepartament.innerHTML = '<option value="">Tots els departaments</option>' +
        Object.keys(departamentMap).map(dep => `<option value="${dep}">${dep}</option>`).join('');
}

// Quan tries departament
selectDepartament.addEventListener('change', function() {
    const dep = selectDepartament.value;
    // Si no hi ha departament, elimina subfiltre i mostra tot
    if (!dep) {
        contenidorSubfiltre.innerHTML = '';
        filtraIDepSub('', '');
        return;
    }
    // Si té subdepartaments, mostra el segon filtre
    const subdeps = Array.from(departamentMap[dep] || []);
    if (subdeps.length > 0) {
        contenidorSubfiltre.innerHTML = `
            <select class="filtreSubdepartament">
                <option value="">Tots els subdepartaments</option>
                ${subdeps.map(sd => `<option value="${sd}">${sd}</option>`).join('')}
            </select>
        `;
        filtraIDepSub(dep, ''); // Mostra només el departament principal i subdeps
        const selectSub = contenidorSubfiltre.querySelector('.filtreSubdepartament');
        selectSub.addEventListener('change', function() {
            filtraIDepSub(dep, selectSub.value);
        });
    } else {
        contenidorSubfiltre.innerHTML = '';
        filtraIDepSub(dep, '');
    }
});

// Filtra per departament i subdepartament, i després pel text del cercador
function filtraIDepSub(dep, subdep) {
    let dadesFiltrades;
    if (!dep) {
        dadesFiltrades = extensions;
    } else if (!subdep) {
        // Mostra tot el departament (amb o sense subdepartament)
        dadesFiltrades = extensions.filter(pc => pc.departament && pc.departament.startsWith(dep));
    } else {
        // Mostra només el departament + subdepartament exacte
        dadesFiltrades = extensions.filter(pc => pc.departament === `${dep}/${subdep}`);
    }
    // Aplica el filtre del cercador
    const valorCercador = cercador.value.trim().toLowerCase();
    resultatsFiltrats = filtraPerText(dadesFiltrades, valorCercador);
    paginaActual = 1;
    mostrarResultats(resultatsFiltrats, paginaActual);
}

// Filtra per text (nom, extensió, número)
function filtraPerText(llista, text) {
    if (!text) return llista;
    text = text.trim().toLowerCase();
    return llista.filter(item =>
        (item.nom && item.nom.toLowerCase().includes(text)) ||
        (item.extensio && item.extensio.toLowerCase().includes(text)) ||
        (item.numero && item.numero.toLowerCase().includes(text))
    );
}

// Quan escrius al cercador, manté el filtre de departament/subdepartament
cercador.addEventListener('input', function() {
    const dep = selectDepartament.value;
    const selectSub = document.querySelector('.filtreSubdepartament');
    const subdep = selectSub ? selectSub.value : '';
    filtraIDepSub(dep, subdep);
});

// Mostra resultats (exemple bàsic, adapta-ho al teu HTML)
function mostrarResultats(filtrats, pagina = 1) {
    resultats.innerHTML = '';
    if (!filtrats.length) {
        resultats.innerHTML = '<div>No s\'han trobat resultats.</div>';
        return;
    }
    const inici = (pagina - 1) * RESULTATS_PER_PAGINA;
    const final = inici + RESULTATS_PER_PAGINA;
    const paginaDades = filtrats.slice(inici, final);

    // Exemple de taula
    let html = `<table class="taula-resultats">
        <thead>
            <tr>
                <th>Nom</th>
                <th>Extensió</th>
                <th>Telèfon</th>
                <th>Departament</th>
            </tr>
        </thead>
        <tbody>
    `;
    for (const item of paginaDades) {
        html += `<tr>
            <td>${item.nom || ''}</td>
            <td>${item.extensio || ''}</td>
            <td>${item.numero || ''}</td>
            <td>${(item.departament || '').replace(/\//g, ' ')}</td>
        </tr>`;
    }
    html += '</tbody></table>';
    resultats.innerHTML = html;

    // --- Paginació ---
    const totalPagines = Math.ceil(filtrats.length / RESULTATS_PER_PAGINA);
    if (totalPagines > 1) {
        let paginacioHtml = `<div class="paginacio">`;
        if (pagina > 1) {
            paginacioHtml += `<button class="paginacio-btn" data-pagina="${pagina - 1}">&laquo; Anterior</button>`;
        }
        paginacioHtml += `<span class="paginacio-info">Pàgina ${pagina} de ${totalPagines}</span>`;
        if (pagina < totalPagines) {
            paginacioHtml += `<button class="paginacio-btn" data-pagina="${pagina + 1}">Següent &raquo;</button>`;
        }
        paginacioHtml += `</div>`;
        resultats.innerHTML += paginacioHtml;

        // Event listeners per als botons de paginació
        resultats.querySelectorAll('.paginacio-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                paginaActual = parseInt(this.dataset.pagina);
                mostrarResultats(filtrats, paginaActual);
            });
        });
    }
}
