const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

// SVGs per a portàtil i sobretaula (monitor i torre, monitor més centrat a l'esquerra, amb les teves mides)
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

// --- Paginació grid ---
// No cal getGridConfig, la grid s'adapta sola amb CSS

let lastData = null;
let lastPage = 1;
let lastFiltrat = null;

function renderBuscador() {
    // Si ja existeix, no el tornis a afegir
    if (document.getElementById('buscador-container')) return;
    const buscadorHtml = `
        <div id="buscador-container">
            <input type="text" id="buscador" placeholder="Cerca per ID o Nom..." autocomplete="off">
            <span class="buscador-icona">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="#2596be" stroke-width="2"/>
                    <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#2596be" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </span>
        </div>
    `;
    document.getElementById("content").insertAdjacentHTML('afterbegin', buscadorHtml);
}

function filtraData(data, valor) {
    valor = valor.trim().toLowerCase();
    if (!valor) return data;
    return data.filter(pc =>
        pc.nom.toLowerCase().includes(valor) ||
        String(pc.id).includes(valor)
    );
}

function renderLlistat(data, paginaActual) {
    // Guarda el valor actual del buscador
    const buscadorValor = document.getElementById('buscador')?.value || '';

    renderBuscador();

    // Torna a posar el valor guardat
    document.getElementById('buscador').value = buscadorValor;

    // Filtra segons el buscador
    const valor = buscadorValor;
    const dataFiltrada = filtraData(data, valor);

    lastFiltrat = dataFiltrada;

    dataFiltrada.sort((a, b) => a.nom.localeCompare(b.nom, 'ca', { sensitivity: 'base' }));

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
                <strong>Nom:</strong> ${pc.nom} -
                <a href="?id=${pc.id}">Més detalls</a>
            </div>
        `;
    });
    html += `</div>`;

    // Controls de paginació
    html += `
        <div class="paginacio-controls">
            <button id="prevPag" class="paginacio-btn" ${paginaActual === 1 ? 'disabled' : ''}>&lt;</button>
            <span>Pàgina ${paginaActual} de ${totalPagines}</span>
            <button id="nextPag" class="paginacio-btn" ${paginaActual === totalPagines ? 'disabled' : ''}>&gt;</button>
        </div>
    `;

    // Manté el buscador a dalt
    document.getElementById("content").innerHTML = '';
    renderBuscador();

const buscadorInput = document.getElementById('buscador');
buscadorInput.value = buscadorValor;
buscadorInput.focus();
buscadorInput.setSelectionRange(buscadorValor.length, buscadorValor.length);

    document.getElementById("content").insertAdjacentHTML('beforeend', html);

    document.getElementById("prevPag").onclick = () => {
        if (paginaActual > 1) renderLlistat(data, paginaActual - 1);
    };
    document.getElementById("nextPag").onclick = () => {
        if (paginaActual < totalPagines) renderLlistat(data, paginaActual + 1);
    };

    // Event per filtrar en temps real
    document.getElementById('buscador').oninput = () => {
        renderLlistat(data, 1);
    };
}

// Re-renderitza el grid si canvies la mida de la pantalla
function responsiveRerender() {
    if (lastData) renderLlistat(lastData, 1);
}
window.addEventListener('resize', responsiveRerender);

fetch('inventari.json')
    .then(res => res.json())
    .then(data => {
        const content = document.getElementById("content");
        if (id) {
            const pc = data.find(p => p.id == id);
            if (pc) {
                const icona = pc.portatil ? iconaPortatil : iconaSobretaula;
                content.innerHTML = `
                    <div class="detall-container">
                        <div class="detall-text">
                            <h2>PC ID: ${pc.id}</h2>
                            <p><strong>Nom:</strong> ${pc.nom}</p>
                            <p><strong>Model:</strong> ${pc.model}</p>
                            <p><strong>Processador:</strong> ${pc.processador}</p>
                            <p><strong>RAM:</strong> ${pc.ram}</p>
                            <p><strong>Emmagatzematge:</strong> ${pc.emmagatzematge}</p>
                            <p><strong>Tarjeta Gràfica:</strong> ${pc.tarjetaGrafica}</p>
                            <p><strong>Sistema Operatiu:</strong> ${pc.sistemaOperatiu}</p>
                            <p><strong>Data d'Adquisició:</strong> ${pc.dataAdquisicio}</p>
                            <p><strong>Portàtil:</strong> ${pc.portatil ? 'Sí' : 'No'}</p><br>
                            <a href="index.html">Tornar a l'inventari</a>
                        </div>
                        <div class="detall-icona">
                            ${icona}
                        </div>
                    </div>
                `;
            } else {
                content.innerHTML = "<p>PC no trobat.</p>";
            }
        } else {
            lastData = data;
            renderLlistat(data, 1);
        }
    })
    .catch(err => {
        document.getElementById("content").innerHTML = "<p>Error carregant l'inventari.</p>";
        console.error(err);
    });