let extensions = [];

const cercador = document.getElementById('buscador');
const resultats = document.getElementById('resultats');
const RESULTATS_PER_PAGINA = 50;
let paginaActual = 1;
let resultatsFiltrats = [];

function mostrarResultats(filtrats, pagina = 1) {
    resultats.innerHTML = '';
    document.getElementById('paginacio-footer').innerHTML = ''; // Esborra paginació anterior
    if (filtrats.length === 0) {
        resultats.innerHTML = '<p>No s\'han trobat resultats.</p>';
        return;
    }

    const inici = (pagina - 1) * RESULTATS_PER_PAGINA;
    const fi = inici + RESULTATS_PER_PAGINA;
    const itemsPagina = filtrats.slice(inici, fi);
    const taula = document.createElement('table');
    taula.classList.add('taula-resultats');

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Nom</th>
            <th>Telèfon</th>
            <th>Extensió</th>
            <th class="departament-columna">Departament</th>
        </tr>
    `;
    taula.appendChild(thead);

    const tbody = document.createElement('tbody');

const contenidor = document.createElement('div');
contenidor.classList.add('llista-resultats');

const capcalera = document.createElement('div');
capcalera.classList.add('resultat-item', 'capcalera');

const titolNom = document.createElement('div');
titolNom.innerHTML = `<strong>Nom</strong>`;

const titolExt = document.createElement('div');
titolExt.innerHTML = `<strong>Ext. curta</strong>`;

const titolTlf = document.createElement('div');
titolTlf.innerHTML = `<strong>Telèfon</strong>`;

const titolDep = document.createElement('div');
titolDep.innerHTML = `<strong>Departament</strong>`;
titolDep.classList.add('col-departament');

capcalera.appendChild(titolNom);
capcalera.appendChild(titolExt);
capcalera.appendChild(titolTlf);
capcalera.appendChild(titolDep);

contenidor.appendChild(capcalera);

itemsPagina.forEach(item => {
    const fila = document.createElement('div');
    fila.classList.add('resultat-item');

    const colNom = document.createElement('div');
    colNom.innerHTML = item.nom;
    colNom.classList.add('col-nom');

    const colExtensio = document.createElement('div');
    colExtensio.innerHTML = item.extensio;
    colExtensio.classList.add('col-extensio');

    const colTelefon = document.createElement('div');
    colTelefon.innerHTML = item.numero;
    colTelefon.classList.add('col-telefon');

    const colDepartament = document.createElement('div');
    colDepartament.textContent = (item.departament || 'No especificat').replace(/\//g, ' ');
    colDepartament.classList.add('col-departament');

    fila.appendChild(colNom);
    fila.appendChild(colExtensio);
    fila.appendChild(colTelefon);
    fila.appendChild(colDepartament);

    contenidor.appendChild(fila);
});

resultats.appendChild(contenidor);



    // Paginació
    const totalPagines = Math.ceil(filtrats.length / RESULTATS_PER_PAGINA);
    if (totalPagines > 1) {
        const paginacio = document.createElement('div');
        paginacio.className = 'paginacio';

        const btnEsq = document.createElement('button');
        btnEsq.innerHTML = '<';
        btnEsq.className = 'paginacio-btn paginacio-btn-esq';
        btnEsq.disabled = pagina === 1;
        btnEsq.onclick = function () {
            if (paginaActual > 1) {
                paginaActual--;
                mostrarResultats(resultatsFiltrats, paginaActual);
            }
        };
        paginacio.appendChild(btnEsq);

        const info = document.createElement('span');
        info.className = 'paginacio-info';
        info.textContent = `Pàgina ${pagina} de ${totalPagines}`;
        paginacio.appendChild(info);

        const btnDreta = document.createElement('button');
        btnDreta.innerHTML = '>';
        btnDreta.className = 'paginacio-btn paginacio-btn-dreta';
        btnDreta.disabled = pagina === totalPagines;
        btnDreta.onclick = function () {
            if (paginaActual < totalPagines) {
                paginaActual++;
                mostrarResultats(resultatsFiltrats, paginaActual);
            }
        };
        paginacio.appendChild(btnDreta);

        const contPaginacio = document.getElementById('paginacio-footer');
        contPaginacio.innerHTML = ''; // neteja
        contPaginacio.appendChild(paginacio); // afegeix correctament
    }
}

// Carregar dades del JSON i inicialitzar la recerca
fetch('numeros_moms_extensions.json')  // <--- ruta actualitzada
    .then(res => res.json())
    .then(data => {
        extensions = data;
        resultatsFiltrats = [...extensions];
        mostrarResultats(resultatsFiltrats, paginaActual);

        const selectDepartament = document.querySelector('.filtreDepartament');
        const contenidorSubfiltre = document.getElementById('contenidor-subfiltre');

        // Crea mapa departament -> subdepartaments
        const departamentMap = {};
        extensions.forEach(e => {
            if (!e.departament) return;
            const [dep, subdep] = e.departament.split('/');
            if (!departamentMap[dep]) departamentMap[dep] = new Set();
            if (subdep) departamentMap[dep].add(subdep);
        });

        // Omple el select només amb departaments principals
        selectDepartament.innerHTML = '<option value="">Tots els departaments</option>' +
            Object.keys(departamentMap).map(dep => `<option value="${dep}">${dep}</option>`).join('');

        // Quan tries departament
        selectDepartament.addEventListener('change', function() {
            const dep = selectDepartament.value;
            // Si no hi ha departament, elimina subfiltre i mostra tot
            if (!dep) {
                contenidorSubfiltre.innerHTML = '';
                resultatsFiltrats = extensions;
                paginaActual = 1;
                mostrarResultats(resultatsFiltrats, paginaActual);
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
            resultatsFiltrats = dadesFiltrades;
            paginaActual = 1;
            mostrarResultats(resultatsFiltrats, paginaActual);
        }
    })
    .catch(error => console.error('Error al carregar el fitxer JSON:', error));
