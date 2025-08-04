const RESULTATS_PER_PAGINA = 1;
let paginaActual = 1;
let dies = [];

// Carrega automàticament el fitxer de tasques
fetch('Seguiment Tasques Marcel.txt')
    .then(res => res.text())
    .then(text => {
        dies = parsejarDies(text);
        mostrarResultats(dies, paginaActual);
    });

function parsejarDies(text) {
    const linies = text.split('\n');
    const dies = [];
    let diaActual = null;
    let tasquesActuals = [];

    linies.forEach(linia => {
        const diaMatch = linia.match(/^Feina\s+\d{1,2}\/\d{1,2}/i);
        const esPendent = linia.trim().toLowerCase() === 'feina pendent:';

        if (diaMatch || esPendent) {
            if (diaActual) {
                dies.push({ dia: diaActual, tasques: tasquesActuals });
            }
            diaActual = esPendent ? 'Feina pendent' : diaMatch[0];
            tasquesActuals = [];
        } else if (linia.trim().startsWith('-')) {
            tasquesActuals.push(linia.trim().slice(1).trim());
        }
    });

    // Afegeix l’últim bloc de tasques
    if (diaActual) {
        dies.push({ dia: diaActual, tasques: tasquesActuals });
    }

    return dies;
}

function mostrarResultats(dies, pagina = 1) {
    const resultats = document.getElementById('resultats');
    resultats.innerHTML = '';
    document.getElementById('paginacio-footer').innerHTML = '';

    if (dies.length === 0) {
        resultats.innerHTML = '<p>No s\'han trobat tasques.</p>';
        return;
    }

    const inici = (pagina - 1) * RESULTATS_PER_PAGINA;
    const fi = inici + RESULTATS_PER_PAGINA;
    const itemsPagina = dies.slice(inici, fi);

    itemsPagina.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('resultat-item');
        if (item.dia.toLowerCase() === 'feina pendent') {
            div.classList.add('feina-pendent');
        }

        div.innerHTML = `<h3>${item.dia}</h3><ul>${
            item.tasques.map(tasca => `<li>${tasca}</li>`).join('')
        }</ul>`;
        resultats.appendChild(div);
    });

    // Paginació
    const totalPagines = Math.ceil(dies.length / RESULTATS_PER_PAGINA);
    if (totalPagines > 1) {
        const paginacio = document.createElement('div');
        paginacio.className = 'paginacio';

        const btnEsq = document.createElement('button');
        btnEsq.textContent = '<';
        btnEsq.className = 'paginacio-btn paginacio-btn-esq';
        btnEsq.disabled = pagina === 1;
        btnEsq.onclick = function () {
            if (paginaActual > 1) {
                paginaActual--;
                mostrarResultats(dies, paginaActual);
            }
        };

        const info = document.createElement('span');
        info.className = 'paginacio-info';
        info.textContent = `Pàgina ${pagina} de ${totalPagines}`;

        const btnDreta = document.createElement('button');
        btnDreta.textContent = '>';
        btnDreta.className = 'paginacio-btn paginacio-btn-dreta';
        btnDreta.disabled = pagina === totalPagines;
        btnDreta.onclick = function () {
            if (paginaActual < totalPagines) {
                paginaActual++;
                mostrarResultats(dies, paginaActual);
            }
        };

        paginacio.appendChild(btnEsq);
        paginacio.appendChild(info);
        paginacio.appendChild(btnDreta);
        document.getElementById('paginacio-footer').appendChild(paginacio);
    }
}