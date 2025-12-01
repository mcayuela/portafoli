let extensions = [];

const countryNames = {
    "AF": "Afghanistan", "AO": "Angola", "AL": "Albania", "AE": "United Arab Emirates", "AR": "Argentina",
    "AM": "Armenia", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BI": "Burundi",
    "BE": "Belgium", "BJ": "Benin", "BF": "Burkina Faso", "BD": "Bangladesh", "BG": "Bulgaria",
    "BH": "Bahrain", "BA": "Bosnia and Herzegovina", "BY": "Belarus", "BZ": "Belize", "BO": "Bolivia",
    "BR": "Brazil", "BN": "Brunei Darussalam", "BT": "Bhutan", "BW": "Botswana", "CF": "Central African Republic",
    "CA": "Canada", "CH": "Switzerland", "CL": "Chile", "CN": "China", "CI": "Côte d'Ivoire",
    "CM": "Cameroon", "CD": "Democratic Republic of the Congo", "CG": "Republic of Congo", "CO": "Colombia",
    "CR": "Costa Rica", "CU": "Cuba", "CZ": "Czech Republic", "DE": "Germany", "DJ": "Djibouti",
    "DK": "Denmark", "DO": "Dominican Republic", "DZ": "Algeria", "EC": "Ecuador", "EG": "Egypt",
    "ER": "Eritrea", "EE": "Estonia", "ET": "Ethiopia", "FI": "Finland", "FJ": "Fiji",
    "GA": "Gabon", "GB": "United Kingdom", "GE": "Georgia", "GH": "Ghana", "GN": "Guinea",
    "GM": "The Gambia", "GW": "Guinea-Bissau", "GQ": "Equatorial Guinea", "GR": "Greece", "GL": "Greenland",
    "GT": "Guatemala", "GY": "Guyana", "HN": "Honduras", "HR": "Croatia", "HT": "Haiti",
    "HU": "Hungary", "ID": "Indonesia", "IN": "India", "IE": "Ireland", "IR": "Iran",
    "IQ": "Iraq", "IS": "Iceland", "IL": "Israel", "IT": "Italy", "JM": "Jamaica",
    "JO": "Jordan", "JP": "Japan", "KZ": "Kazakhstan", "KE": "Kenya", "KG": "Kyrgyzstan",
    "KH": "Cambodia", "KR": "Republic of Korea", "XK": "Kosovo", "KW": "Kuwait", "LA": "Lao PDR",
    "LB": "Lebanon", "LR": "Liberia", "LY": "Libya", "LK": "Sri Lanka", "LS": "Lesotho",
    "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia", "MA": "Morocco", "MD": "Moldova",
    "MG": "Madagascar", "MX": "Mexico", "MK": "Macedonia", "ML": "Mali", "MM": "Myanmar",
    "ME": "Montenegro", "MN": "Mongolia", "MZ": "Mozambique", "MR": "Mauritania", "MW": "Malawi",
    "MY": "Malaysia", "NA": "Namibia", "NE": "Niger", "NG": "Nigeria", "NI": "Nicaragua",
    "NL": "Netherlands", "NO": "Norway", "NP": "Nepal", "NZ": "New Zealand", "OM": "Oman",
    "PK": "Pakistan", "PA": "Panama", "PE": "Peru", "PH": "Philippines", "PG": "Papua New Guinea",
    "PL": "Poland", "KP": "Dem. Rep. Korea", "PT": "Portugal", "PY": "Paraguay", "PS": "Palestine",
    "QA": "Qatar", "RO": "Romania", "RU": "Russia", "RW": "Rwanda", "EH": "Western Sahara",
    "SA": "Saudi Arabia", "SD": "Sudan", "SS": "South Sudan", "SN": "Senegal", "SL": "Sierra Leone",
    "SV": "El Salvador", "RS": "Serbia", "SR": "Suriname", "SK": "Slovakia", "SI": "Slovenia",
    "SE": "Sweden", "SZ": "Swaziland", "SY": "Syria", "TD": "Chad", "TG": "Togo",
    "TH": "Thailand", "TJ": "Tajikistan", "TM": "Turkmenistan", "TL": "Timor-Leste", "TN": "Tunisia",
    "TR": "Turkey", "TW": "Taiwan", "TZ": "Tanzania", "UG": "Uganda", "UA": "Ukraine",
    "UY": "Uruguay", "US": "United States", "UZ": "Uzbekistan", "VE": "Venezuela", "VN": "Vietnam",
    "VU": "Vanuatu", "YE": "Yemen", "ZA": "South Africa", "ZM": "Zambia", "ZW": "Zimbabwe",
    "SO": "Somalia", "GF": "France", "FR": "France", "ES": "Spain", "AW": "Aruba",
    "AI": "Anguilla", "AD": "Andorra", "AG": "Antigua and Barbuda", "BS": "Bahamas", "BM": "Bermuda",
    "BB": "Barbados", "KM": "Comoros", "CV": "Cape Verde", "KY": "Cayman Islands", "DM": "Dominica",
    "FK": "Falkland Islands", "FO": "Faeroe Islands", "GD": "Grenada", "HK": "Hong Kong",
    "KN": "Saint Kitts and Nevis", "LC": "Saint Lucia", "LI": "Liechtenstein", "MF": "Saint Martin (French)",
    "MV": "Maldives", "MT": "Malta", "MS": "Montserrat", "MU": "Mauritius", "NC": "New Caledonia",
    "NR": "Nauru", "PN": "Pitcairn Islands", "PR": "Puerto Rico", "PF": "French Polynesia",
    "SG": "Singapore", "SB": "Solomon Islands", "ST": "São Tomé and Principe", "SX": "Saint Martin (Dutch)",
    "SC": "Seychelles", "TC": "Turks and Caicos Islands", "TO": "Tonga", "TT": "Trinidad and Tobago",
    "VC": "Saint Vincent and the Grenadines", "VG": "British Virgin Islands", "VI": "United States Virgin Islands",
    "CY": "Cyprus", "RE": "Reunion (France)", "YT": "Mayotte (France)", "MQ": "Martinique (France)",
    "GP": "Guadeloupe (France)", "CW": "Curaco (Netherlands)", "IC": "Canary Islands (Spain)"
};

let paginaActual = 1;
let resultatsFiltrats = [];
const RESULTATS_PER_PAGINA = 50;

// Elements de la llista (es mantenen intactes)
const cercador = document.getElementById('buscador');
const selectDepartament = document.querySelector('.filtreDepartament');
const contenidorSubfiltre = document.getElementById('contenidor-subfiltre');
const resultats = document.getElementById('resultats');
const contadorContactes = document.querySelector('.contador-contactes');

// NOUS elements per al Control del Mapa
const inputZoomPais = document.getElementById('input-zoom-pais');
const btnZoomPais = document.getElementById('btn-zoom-pais');
const btnResetMapa = document.getElementById('btn-reset-mapa');
const missatgeZoom = document.getElementById('missatge-zoom');

// Dades del mapa
const dadesOriginalsDelMapa = JSON.parse(JSON.stringify(simplemaps_worldmap_mapdata.state_specific));

// Mapa de codis a noms normalitzats per a la cerca ràpida
const reverseCountryMap = {};
for (const codi in countryNames) {
    reverseCountryMap[countryNames[codi].toLowerCase()] = codi;
}

// --- Lògica d'Inicialització i Filtres de Llista (Original) ---
let departamentMap = {};
function inicialitzaFiltres() {
    departamentMap = {};
    extensions.forEach(e => {
        if (!e.departament) return;
        const [dep, subdep] = e.departament.split('/');
        if (!departamentMap[dep]) departamentMap[dep] = new Set();
        if (subdep) departamentMap[dep].add(subdep);
    });
    if (selectDepartament) {
        selectDepartament.innerHTML = '<option value="">Tots els departaments</option>' +
            Object.keys(departamentMap).map(dep => `<option value="${dep}">${dep}</option>`).join('');
    }
}

// Funció principal de cerca i filtre (només llista)
function filtraIDepSub(dep, subdep) {
    let dadesFiltrades;
    if (!dep) {
        dadesFiltrades = extensions;
    } else if (!subdep) {
        dadesFiltrades = extensions.filter(pc => pc.departament && pc.departament.startsWith(dep));
    } else {
        dadesFiltrades = extensions.filter(pc => pc.departament === `${dep}/${subdep}`);
    }
    const valorCercador = cercador.value.trim().toLowerCase();
    resultatsFiltrats = filtraPerText(dadesFiltrades, valorCercador);
    paginaActual = 1;
    mostrarResultats(resultatsFiltrats, paginaActual);
}

function filtraPerText(llista, text) {
    if (!text) return llista;
    text = text.trim().toLowerCase();
    return llista.filter(item =>
        (item.nom && item.nom.toLowerCase().includes(text)) ||
        (item.extensio && item.extensio.toLowerCase().includes(text)) ||
        (item.numero && item.numero.toLowerCase().includes(text))
    );
}

function mostrarResultats(filtrats, pagina) {
    if (!resultats) return;

    if (contadorContactes) contadorContactes.textContent = `Contactes: ${filtrats.length}`;
    
    if (!filtrats.length) {
        resultats.innerHTML = '<div>No s\'han trobat resultats.</div>';
        return;
    }

    const inici = (pagina - 1) * RESULTATS_PER_PAGINA;
    const final = inici + RESULTATS_PER_PAGINA;
    const paginaDades = filtrats.slice(inici, final);
    const totalPagines = Math.ceil(filtrats.length / RESULTATS_PER_PAGINA);

    const taulaHtml = `
        <table class="taula-resultats">
            <thead>
                <tr>
                    <th>Nom</th><th>Extensió</th><th>Telèfon</th><th>Departament</th>
                </tr>
            </thead>
            <tbody>
                ${paginaDades.map(item => `
                    <tr>
                        <td>${item.nom || ''}</td>
                        <td>${item.extensio || ''}</td>
                        <td>${item.numero || ''}</td>
                        <td>${(item.departament || '').replace(/\//g, ' ')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    const paginacioHtml = totalPagines > 1 ? `
        <div class="paginacio">
            <button class="paginacio-btn" data-pagina="${pagina - 1}" ${pagina === 1 ? 'disabled' : ''}>&lt;</button>
            <span class="paginacio-info">Pàgina ${pagina} de ${totalPagines}</span>
            <button class="paginacio-btn" data-pagina="${pagina + 1}" ${pagina === totalPagines ? 'disabled' : ''}>&gt;</button>
        </div>
    ` : '';

    resultats.innerHTML = taulaHtml + paginacioHtml;
    resultats.querySelectorAll('.paginacio-btn').forEach(btn => btn.addEventListener('click', canviDePagina));
}
// --- Fi Lògica d'Inicialització i Filtres de Llista ---

function canviDePagina() {
    const novaPagina = parseInt(this.dataset.pagina);
    const totalPagines = Math.ceil(resultatsFiltrats.length / RESULTATS_PER_PAGINA);
    if (!isNaN(novaPagina) && novaPagina >= 1 && novaPagina <= totalPagines) {
        paginaActual = novaPagina;
        mostrarResultats(resultatsFiltrats, paginaActual);
    }
}

// Funció Mestra de Zoom
function masterZoom(termeCerca) {
    const termeMin = termeCerca.toLowerCase().trim();
    missatgeZoom.textContent = ''; // Neteja missatges d'error anteriors
    const codiPais = reverseCountryMap[termeMin];

    if (!codiPais) {
        missatgeZoom.textContent = `Error: País "${termeCerca}" no trobat.`;
        aplicaFiltreColorMapa(termeCerca);
        return;
    }

    aplicaFiltreColorMapa(termeCerca); 

    const ferZoom = () => {
        simplemaps_worldmap.zoom_to_state(codiPais);
        missatgeZoom.textContent = `Zoom aplicat a ${countryNames[codiPais]}.`;
    };

    simplemaps_worldmap.zoom_level !== 'out' ? simplemaps_worldmap.back(ferZoom) : ferZoom();
}

// Funció que aplica el filtre de color al mapa (Només color, no zoom)
function aplicaFiltreColorMapa(termeCerca) {
    const termeMin = termeCerca.toLowerCase().trim();
    
    const codisPaisosCoincidents = new Set(Object.keys(countryNames).filter(codi =>
        countryNames[codi].toLowerCase().includes(termeMin)
    ));

    Object.keys(dadesOriginalsDelMapa).forEach(codiPais => {
        const esCoincident = codisPaisosCoincidents.has(codiPais) || termeMin === "";
        simplemaps_worldmap_mapdata.state_specific[codiPais] = esCoincident 
            ? { ...dadesOriginalsDelMapa[codiPais] }
            : { ...dadesOriginalsDelMapa[codiPais], color: '#E0E0E0', hover_color: '#E0E0E0', url: '' };
    });

    simplemaps_worldmap.refresh();
}

// Funció per ressaltar un grup de països al mapa
function ressaltaPaisosDeZona(codisPaisosSet) {
    Object.keys(dadesOriginalsDelMapa).forEach(codiPais => {
        const esCoincident = codisPaisosSet.has(codiPais);
        simplemaps_worldmap_mapdata.state_specific[codiPais] = esCoincident 
            ? { ...dadesOriginalsDelMapa[codiPais] }
            : { ...dadesOriginalsDelMapa[codiPais], color: '#E0E0E0', hover_color: '#E0E0E0', url: '' };
    });
    simplemaps_worldmap.refresh();
}

// Funció per obrir un desplegable de zona pel seu ID
function obreDesplegable(idZona) {
    const desplegable = document.getElementById(idZona);
    if (!desplegable || desplegable.classList.contains('actiu')) return; // Si no existeix o ja està actiu, no facis res

    // Tanca tots els altres abans d'obrir el nou
    document.querySelectorAll('.zona-desplegable.actiu').forEach(d => {
        d.classList.remove('actiu');
    });

    desplegable.classList.add('actiu');
    const zonaCorresponent = zonesAmbCodis.find(z => z.id === idZona);
    if (zonaCorresponent) {
        ressaltaPaisosDeZona(zonaCorresponent.codisPaisos);
    }
}
// --- Event Handlers de Llista (S'asseguren que el mapa es reseteja visualment) ---

// Sincronitza la llista i el filtre de color del mapa
cercador.addEventListener('input', function(e) {
    const termeCerca = e.target.value;
    aplicaFiltreColorMapa(termeCerca);

    const dep = selectDepartament ? selectDepartament.value : '';
    const selectSub = document.querySelector('.filtreSubdepartament');
    const subdep = selectSub ? selectSub.value : '';
    filtraIDepSub(dep, subdep);

    if (termeCerca.trim() === "") {
        simplemaps_worldmap.back();
    } else {
        // Comprova si la cerca coincideix amb un país i obre la seva zona
        const codiPaisBuscat = reverseCountryMap[termeCerca.trim().toLowerCase()];
        if (codiPaisBuscat) {
            const zonaTrobada = zonesAmbCodis.find(z => z.codisPaisos.has(codiPaisBuscat));
            if (zonaTrobada) {
                obreDesplegable(zonaTrobada.id);
            }
        }
    }
});

// --- NOUS Event Handlers del Control Dedicat al Mapa ---

btnZoomPais?.addEventListener('click', () => masterZoom(inputZoomPais.value));

inputZoomPais?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        masterZoom(inputZoomPais.value);
    }
});

btnResetMapa?.addEventListener('click', () => {
    simplemaps_worldmap.back();
    aplicaFiltreColorMapa("");
    inputZoomPais.value = "";
    missatgeZoom.textContent = 'Mapa resetejat a la vista mundial.';
});


/**
 * Funció que s'executa en clicar un país al mapa.
 * @param {string} codiPais - El codi de dues lletres del país (ex: "ES", "FR").
 */
function clicAlPais(codiPais) {
    simplemaps_worldmap.popup_hide();

    const nomPais = countryNames[codiPais] || '';
    
    if (inputZoomPais) inputZoomPais.value = nomPais;
    masterZoom(nomPais);
    
    if (cercador) { // Sincronitza amb el cercador de la llista
        cercador.value = nomPais; 
        cercador.dispatchEvent(new Event('input')); // Dispara l'event per filtrar la llista
    }
}

let zonesAmbCodis = []; // Variable global per accedir a les zones

// --- CSS per amagar la Marca d'Aigua (Mantenim per si de cas) ---
document.addEventListener('DOMContentLoaded', () => {
    // Creem l'estructura de columnes per al mapa i el text addicional
    const mapaDiv = document.getElementById('map');
    if (mapaDiv) {
        // Creem el contenidor principal
        const contenidor = document.createElement('div');
        contenidor.className = 'contenidor-mapa-text';

        // Creem la columna per al mapa
        const columnaMapa = document.createElement('div');
        columnaMapa.className = 'columna-mapa';

        // Creem la columna per al text
        const columnaText = document.createElement('div');
        columnaText.className = 'columna-text';
        columnaText.innerHTML = `<h2>Informació Addicional</h2>`;

        zonesAmbCodis = [
            { id: 'zona-eee', titol: 'Zona EEE + UK:', contingut: 'Alemanya, Àustria, Bèlgica, Bulgària, Croàcia, Xipre, Dinamarca, Eslovàquia, Eslovènia, Espanya, Estònia, Finlàndia, França, Grècia, Hongria, Irlanda, Islàndia, Itàlia, Letònia, Liechtenstein, Lituània, Luxemburg, Malta, Noruega, Països Baixos, Polònia, Portugal, Regne Unit, República Txeca, Romania, Suècia.' },
            { id: 'zona-business', titol: 'Zona Business:', contingut: 'Afganistan, Albània, Andorra, Aràbia Saudita, Argentina, Armènia, Austràlia, Bolívia, Brasil, Cambodja, Canadà, Xile, Xina, Colòmbia, Congo, Costa Rica, Cuba, Equador, Egipte, El Salvador, Emirats Àrabs Units, Estats Units, Rússia, Filipines, Geòrgia, Ghana, Guam, Guatemala, Guernsey, Hondures, Hong Kong, Índia, Indonèsia, Illes Feroe, Illa de Man, Illes Verges Britàniques, Israel, Jamaica, Japó, Jersey, Kazakhstan, Kenya, Macedònia, República Democràtica del Congo, República Dominicana, Mèxic, Moldàvia, Mònaco, Marroc, Moçambic, Nova Zelanda, Nicaragua, Panamà, Paraguai, Perú, Puerto Rico, Qatar, Sèrbia, Singapur, Sud-àfrica, Sri Lanka, Sudan, Suïssa, Tailàndia, Togo, Tunísia, Turquia, Ucraïna, Uruguai, Veneçuela.' },
            { id: 'zona-business-plus', titol: 'Zona Business Plus:', contingut: 'Algèria, Angola, Azerbaidjan, Bahrain, Bangla Desh, Bielorússia, Belize, Benín, Bòsnia i Hercegovina, Botswana, Burkina Faso, Camerun, Cap Verd, Costa d\'Ivori, Guinea Equatorial, Etiòpia, Polinèsia Francesa, Gàmbia, Groenlàndia, Guinea, Guinea Bissau, Guyana, Haití, Jordània, Kuwait, Líban, Libèria, Madagascar, Malàisia, Mali, Maurici, Mauritània, Mongòlia, República Centreafricana, República de Corea, Laos, Montenegro, Myanmar, Namíbia, Níger, Nigèria, Oman, Pakistan, Ruanda, Senegal, Taiwan, Palestina, Uganda, Uzbekistan, Vietnam, Iemen.' },
            { id: 'zona-row', titol: 'Zona ROW:', contingut: 'Antigua i Barbuda, Anguilla, Aruba, Bahames, Barbados, Bhutan, Brunei, Burundi, Illes Caiman, Txad, Comores, Illes Cook, Djibouti, Dominica, Illes Malvines, Fiji, Gabon, Grenada, Iraq, Kosovo, Kirguizistan, Lesotho, Líbia, Macau, Malawi, Maldives, Montserrat, Nepal, Antilles Neerlandeses, Nova Caledònia, Palau, Papua Nova Guinea, Saint Kitts i Nevis, Saint Lucia, Saint-Pierre i Miquelon, Samoa, San Marino, São Tomé i Príncipe, Seychelles, Sierra Leone, Somàlia, Sant Vicenç i les Grenadines, Surinam, Swazilàndia, Síria, Tadjikistan, Tanzània, Timor Oriental, Tonga, Trinitat i Tobago, Turkmenistan, Illes Turks i Caicos, Vanuatu, Zàmbia, Zimbàbue.' }
        ];

        // Processa les zones per obtenir els codis de país
        const nomsPaisosInvers = {};
        Object.keys(countryNames).forEach(codi => {
            nomsPaisosInvers[countryNames[codi].toLowerCase()] = codi;
        });

        zonesAmbCodis.forEach(zona => {
            const nomsNet = zona.contingut.toLowerCase().replace(/\./g, '').split(/, | i /);
            zona.codisPaisos = new Set();
            nomsNet.forEach(nom => {
                const codi = nomsPaisosInvers[nom.trim()];
                if (codi) zona.codisPaisos.add(codi);
            });
        });

        zonesAmbCodis.forEach(zona => {
            const desplegable = document.createElement('div');
            desplegable.className = 'zona-desplegable';
            desplegable.id = zona.id;
            desplegable.innerHTML = `
                <div class="zona-titol"><b>${zona.titol}</b></div>
                <div class="zona-contingut">${zona.contingut}</div>
            `;
            columnaText.appendChild(desplegable);
        });

        // Inserim el contenidor abans del mapa i movem el mapa a dins
        mapaDiv.parentNode.insertBefore(contenidor, mapaDiv);
        columnaMapa.appendChild(mapaDiv);
        contenidor.appendChild(columnaMapa);
        contenidor.appendChild(columnaText);

        // Inicialitzem el mapa (Simplemaps) DESPRÉS de crear l'estructura
        simplemaps_worldmap.create_map();

        // Afegim els event listeners per als desplegables
        document.querySelectorAll('.zona-titol').forEach(titol => {
            titol.addEventListener('click', (e) => {
                const desplegableActual = e.currentTarget.parentElement;
                const idDesplegable = desplegableActual.id;
                const jaEstavaActiu = desplegableActual.classList.contains('actiu');

                // Si ja estava actiu, el tanquem i netegem el mapa
                if (jaEstavaActiu) {
                    desplegableActual.classList.remove('actiu');
                    aplicaFiltreColorMapa("");
                } else {
                    // Si no, tanquem els altres i obrim aquest
                    document.querySelectorAll('.zona-desplegable.actiu').forEach(d => {
                        d.classList.remove('actiu');
                    });
                    desplegableActual.classList.add('actiu');
                    const zonaOberta = zonesAmbCodis.find(z => z.id === idDesplegable);
                    if (zonaOberta) ressaltaPaisosDeZona(zonaOberta.codisPaisos);
                }
            });
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Amaga l'element que conté l'avís de prova per la seva propietat 'title' */
        #map_holder div[title="For evaluation use only."], 
        #map_holder a[title="For evaluation use only."] {
            display: none !important;
        }
        /* Amaguem els elements dinàmics que es creen a la cantonada inferior */
        #map_inner > div[style*="right: 5px !important;"],
        #map_inner > div[style*="right: 20px !important;"] {
            display: none !important;
            visibility: hidden !important;
        }
        #map_inner > div:last-child {
             /* Aquesta era la solució anterior: potser Simplemaps el posa com a darrer fill */
                visibility: hidden !important;
                display: none !important;
        }

        /* Estils per a les zones desplegables */
        .zona-desplegable { border: 1px solid #ccc; border-radius: 5px; margin-bottom: 10px; overflow: hidden; }
        .zona-titol { padding: 10px; background-color: #f5f5f5; cursor: pointer; }
        .zona-titol:hover { background-color: #e9e9e9; }
        .zona-contingut { padding: 0 10px; max-height: 0; transition: max-height 0.3s ease-out, padding 0.3s ease-out; }
        .zona-desplegable.actiu .zona-contingut { 
            max-height: 500px; /* Altura suficient per al contingut */
            padding: 10px; 
            transition: max-height 0.5s ease-in, padding 0.5s ease-in;
        }
        .zona-titol b::after {
            content: ' ▼'; /* Fletxa cap avall */
        }
        .zona-desplegable.actiu .zona-titol b::after {
            content: ' ▲'; /* Fletxa cap amunt */
        }
    `;
    document.head.appendChild(style);
});