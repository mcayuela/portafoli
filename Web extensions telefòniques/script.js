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
    colDepartament.textContent = item.departament || 'No especificat';
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

        cercador.addEventListener('input', function () {
            const text = cercador.value.trim().toLowerCase();
            paginaActual = 1;
            const valor = selectDepartament.value;
            if (text.length === 0) {
                resultatsFiltrats = extensions.filter(item => {
                    return !valor || item.departament === valor;
                });
                mostrarResultats(resultatsFiltrats, paginaActual);
                return;
            }

            resultatsFiltrats = extensions.filter(item => {
                const coincideixText =
                    item.nom.toLowerCase().includes(text) ||
                    item.extensio.includes(text) ||
                    item.departament.toLowerCase().includes(text) ||
                    item.numero.includes(text);

                const coincideixDepartament = !valor || item.departament === valor;

                return coincideixText && coincideixDepartament;
            });
            mostrarResultats(resultatsFiltrats, paginaActual);
        });

        const departamentsUnics = [...new Set(extensions.map(e => e.departament).filter(Boolean))].sort();
        departamentsUnics.forEach(dep => {
            const opt = document.createElement('option');
            opt.value = dep;
            opt.textContent = dep;
            selectDepartament.appendChild(opt);
        });

        selectDepartament.addEventListener('change', () => {
            const valor = selectDepartament.value;
            const dadesFiltrades = extensions.filter(pc => {
                if (!valor) return true;
                return pc.departament === valor;
            });
            mostrarResultats(dadesFiltrades, 1);
        });
    });
