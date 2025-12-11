// Variable global per accedir a les zones, s'inicialitza més tard al DOMContentLoaded
let extensions = [];
let zonesAmbCodis = [];

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

// Elements de la llista
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
let dadesOriginalsDelMapa = {};
if (typeof simplemaps_worldmap_mapdata !== 'undefined') {
    dadesOriginalsDelMapa = JSON.parse(JSON.stringify(simplemaps_worldmap_mapdata.state_specific));
}

// Mapa de codis a noms normalitzats per a la cerca ràpida
const reverseCountryMap = {};
for (const codi in countryNames) {
    const nomNormalitzat = countryNames[codi].toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    reverseCountryMap[nomNormalitzat] = codi;
}

// Mapeig dels ID de zona als colors definits a mapdata.js
const zoneColorMap = {
    "zona-eee": "#035eff",
    "zona-business": "#ff9b00",
    "zona-business-plus": "#71d17a",
    "zona-row": "#c4c4c4"
};

// Funció per obtenir el codi de regió (continent) d'un país
function getRegionCode(countryCode) {
    if (typeof simplemaps_worldmap_mapdata === 'undefined' || !simplemaps_worldmap_mapdata.regions) return null;
    
    for (const regionId in simplemaps_worldmap_mapdata.regions) {
        if (simplemaps_worldmap_mapdata.regions[regionId].states.includes(countryCode)) {
            // Retorna l'ID de la regió (continent) com a string
            return regionId;
        }
    }
    return null;
}

// --- FUNCIONS ESSENCIALS DEL MAPA ---

function aplicaFiltreColorMapa(termeCerca) {
    const termeMin = termeCerca.toLowerCase().trim();
    
    const codisPaisosCoincidents = new Set(Object.keys(countryNames).filter(codi =>
        countryNames[codi].toLowerCase().includes(termeMin)
    ));

    if (typeof simplemaps_worldmap_mapdata === 'undefined' || !simplemaps_worldmap_mapdata.state_specific) return;

    Object.keys(dadesOriginalsDelMapa).forEach(codiPais => {
        const esCoincident = codisPaisosCoincidents.has(codiPais) || termeMin === "";
        simplemaps_worldmap_mapdata.state_specific[codiPais] = esCoincident 
            ? { ...dadesOriginalsDelMapa[codiPais] }
            : { ...dadesOriginalsDelMapa[codiPais], color: '#E0E0E0', hover_color: '#E0E0E0', url: '' };
    });

    if (typeof simplemaps_worldmap !== 'undefined' && simplemaps_worldmap.refresh) {
        simplemaps_worldmap.refresh();
    }
}

// Funció modificada per ressaltar usant el color de la zona
function ressaltaPaisosDeZona(codisPaisosSet, zonaId) {
    if (typeof simplemaps_worldmap_mapdata === 'undefined' || !simplemaps_worldmap_mapdata.state_specific) return;

    const zonaColor = zoneColorMap[zonaId] || '#FFD700'; // Utilitza el color de la zona o un color per defecte si falla
    
    // 1. Primer, restaurem TOTS els colors al seu valor original per evitar errors
    Object.keys(dadesOriginalsDelMapa).forEach(codiPais => {
        simplemaps_worldmap_mapdata.state_specific[codiPais] = { ...dadesOriginalsDelMapa[codiPais] };
    });

    // 2. Després, sobreescrivim NOMÉS els països que NO són de la zona amb gris
    Object.keys(dadesOriginalsDelMapa).forEach(codiPais => {
        const esDeLaZona = codisPaisosSet.has(codiPais);

        if (!esDeLaZona) {
            simplemaps_worldmap_mapdata.state_specific[codiPais] = { 
                ...dadesOriginalsDelMapa[codiPais], 
                color: '#E0E0E0', 
                hover_color: '#E0E0E0', 
                url: '' 
            };
        } else {
            // Forcem a que els països de la zona tinguin el color de la zona i el hover sigui més visible
            simplemaps_worldmap_mapdata.state_specific[codiPais].color = zonaColor;
            simplemaps_worldmap_mapdata.state_specific[codiPais].hover_color = '#FFD700'; // Color de hover brillant
        }
    });
    
    if (typeof simplemaps_worldmap !== 'undefined' && simplemaps_worldmap.refresh) {
        simplemaps_worldmap.refresh();
    }
}

// Funció per obrir un desplegable de zona pel seu ID
function obreDesplegable(idZona) {
    const desplegable = document.getElementById(idZona);
    if (!desplegable) return;

    const jaEstavaActiu = desplegable.classList.contains('actiu');
    
    // Tanca tots els altres
    document.querySelectorAll('.zona-desplegable.actiu').forEach(d => {
        d.classList.remove('actiu');
    });

    // 1. Reseteja el zoom si n'hi ha
    if (typeof simplemaps_worldmap !== 'undefined' && simplemaps_worldmap.zoom_level !== 'out') {
        simplemaps_worldmap.back();
    }

    if (!jaEstavaActiu) {
        // Obre l'actual i ressalta al mapa
        desplegable.classList.add('actiu');
        const zonaCorresponent = zonesAmbCodis.find(z => z.id === idZona);
        if (zonaCorresponent) {
            ressaltaPaisosDeZona(zonaCorresponent.codisPaisos, idZona);
        }
    } else {
         // Si es tanca, reseteja el mapa
         aplicaFiltreColorMapa(""); 
    }
}

// Funció Mestra de Zoom
function masterZoom(termeCerca) {
    const termeMin = termeCerca.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (missatgeZoom) missatgeZoom.textContent = ''; 
    const codiPais = reverseCountryMap[termeMin];

    if (!codiPais) {
        if (missatgeZoom) missatgeZoom.textContent = `Error: País "${termeCerca}" no trobat.`;
        aplicaFiltreColorMapa(termeCerca);
        return;
    }

    // APLICAR RESSET GENERAL ABANS DE TOTA OPERACIÓ DE ZOOM
    aplicaFiltreColorMapa(""); // <--- Afegeix o assegura aquesta crida

    const regionCode = getRegionCode(codiPais);

    const ferZoom = () => {
        if (typeof simplemaps_worldmap !== 'undefined' && simplemaps_worldmap.zoom_to_state) {
            if (regionCode) {
                simplemaps_worldmap.zoom_to_region(regionCode);
                if (missatgeZoom) missatgeZoom.textContent = `Zoom aplicat a la regió de ${countryNames[codiPais]}.`;
            } else {
                simplemaps_worldmap.zoom_to_state(codiPais);
                if (missatgeZoom) missatgeZoom.textContent = `Zoom aplicat a ${countryNames[codiPais]}.`;
            }
        }
    };
    
    if (typeof simplemaps_worldmap !== 'undefined') {
        // En SimpleMaps, cridar .back() abans d'un nou zoom és sovint necessari.
        // També reseteja el filtre si el zoom ja estava actiu (tot i que ja ho fem a dalt)
        if (simplemaps_worldmap.zoom_level !== 'out') {
            simplemaps_worldmap.back(ferZoom); 
        } else {
            ferZoom();
        }
    }
}

// Funció que s'executa en clicar un país al mapa.
function clicAlPais(codiPais) {
    if (typeof simplemaps_worldmap !== 'undefined' && simplemaps_worldmap.popup_hide) {
        simplemaps_worldmap.popup_hide();
    }

    const nomPais = countryNames[codiPais] || '';
    
    if (inputZoomPais) inputZoomPais.value = nomPais;
    
    if (cercador) { 
        cercador.value = nomPais; 
        cercador.dispatchEvent(new Event('input')); 
    }
    
    // Obre el desplegable de la zona corresponent
    const zonaTrobada = zonesAmbCodis.find(z => z.codisPaisos.has(codiPais));
    if (zonaTrobada) {
        obreDesplegable(zonaTrobada.id);
        // Després d'obrir el desplegable, fem zoom al continent
        masterZoom(nomPais);
    } else {
        aplicaFiltreColorMapa(""); 
        document.querySelectorAll('.zona-desplegable.actiu').forEach(d => d.classList.remove('actiu'));
    }
}


// --- LÒGICA D'INICIALITZACIÓ I FILTRES DE LLISTA ---

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

function filtraPerText(llista, text) {
    if (!text) return llista;
    text = text.trim().toLowerCase();
    return llista.filter(item =>
        (item.nom && item.nom.toLowerCase().includes(text)) ||
        (item.extensio && item.extensio.toLowerCase().includes(text)) ||
        (item.numero && item.numero.toLowerCase().includes(text))
    );
}

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

function canviDePagina() {
    const novaPagina = parseInt(this.dataset.pagina);
    const totalPagines = Math.ceil(resultatsFiltrats.length / RESULTATS_PER_PAGINA);
    if (!isNaN(novaPagina) && novaPagina >= 1 && novaPagina <= totalPagines) {
        paginaActual = novaPagina;
        mostrarResultats(resultatsFiltrats, paginaActual);
    }
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


// --- GESTIÓ D'ESDEVENIMENTS AL CARREGAR EL DOM ---

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Estructura de Dades i Processament de Països
    zonesAmbCodis = [
        { id: 'zona-eee', titol: 'Zona EEE + UK:', colorId: '#035eff', contingut: 'Alemanya, Àustria, Bèlgica, Bulgària, Croàcia, Xipre, Dinamarca, Eslovàquia, Eslovènia, Espanya (com destí de trucada), Estònia, Finlàndia (inclou les illes Åland), França (inclòs Martinica, Guadalupe, Saint Martin, Guyana francesa, Reunió i Mayotte), Grècia, Hongria, Irlanda, Islàndia, Itàlia, Letònia, Liechtenstein, Lituània, Luxemburg, Malta, Noruega, Països Baixos, Polònia, Portugal (inclòs Madeira i Açores), Regne Unit (inclòs Gibraltar), República Txeca, Romania i Suècia.' },
        { id: 'zona-business', titol: 'Zona Business:', colorId: '#ff9b00', contingut: 'Afganistan, Albània, Andorra, Aràbia Saudita, Argentina, Armènia, Austràlia, Bolívia, Brasil, Cambodja, Canadà, Xile, Xina, Colòmbia, Congo, Costa Rica, Cuba, Equador, Egipte, El Salvador, Emirats Àrabs Units, Estats Units, Federació de Rússia, Filipines, Geòrgia, Ghana, Guam, Guatemala, Illa Guernsey, Hondures, Hong Kong, Índia, Indonèsia, Illes Feroe, Illa de Man, Illes Verges Britàniques, Israel, Jamaica, Japó, Illa Jersey, Kazakhstan, Kenya, República de Macedònia, República Democràtica del Congo, República Dominicana, Mèxic, Moldàvia, Mònaco, Marrocs, Moçambic, Nova Zelanda, Nicaragua, Panamà, Paraguai, Perú, Puerto Rico, Qatar, Sèrbia, Singapur, Sudàfrica, Sri Lanka, Sudan, Suïssa, Tailàndia, Togo, Tunísia, Turquia, Ucraïna, Uruguai, Veneçuela.' },
        { id: 'zona-business-plus', titol: 'Zona Business Plus:', colorId: '#71d17a', contingut: 'Algèria, Angola, Azerbaidjan, Bahrain, Bangla Desh, Bielorússia, Belize, Benín, Bòsnia i Hercegovina, Botswana, Burkina Faso, Camerun, Cap Verd, Costa d\'Ivori, Guinea Equatorial, Etiòpia, Polinèsia Francesa, Gàmbia, Grenlàndia, República Guineana, Guinea-Bissau, Guyana, Haití, Jordània, Kuwait, Líban, Libèria, Madagascar, Malàisia, Mali, Maurici, Mauritània, Mongòlia, República Centreafricana, República de Corea, República Democràtica Popular de Laos, República de Montenegro, Myanmar, Namíbia, Níger, Nigèria, Oman, Pakistan, Ruanda, Senegal, Taiwan, Territori Palestí Ocupat, Uganda, Uzbekistan, Vietnam, Iemen.' },
        { id: 'zona-row', titol: 'Zona ROW:', colorId: '#c4c4c4', contingut: 'Antigua i Barbuda, Anguila, Aruba, Bahames, Barbados, Bhutan, Brunei Darussalam, Burundi, Illes Caiman, Txad, Comores, Illes Cook, Djibouti, Dominica, Illes Falkland (Malvines), Fiji, Gabon, Grenada, Iraq, Kosovo, Kirguizistan, Lesotho, Líbia Àrab Jamahiriya, Macau, Malawi, Maldives, Montserrat, Nepal, Antilles Holandeses, Nova Caledònia, Palau, Papua Nova Guinea, Saint Kitts i Nevis, Saint Lucia, Saint Pierre i Miquelon, Samoa, San Marino, Sao Tome i Principe, Seychelles, Sierra Leone, Somàlia, St. Vincent i les Grenadines, Surinam, Swazilàndia, Síria Àrab República, Tadjikistan, Tanzània, Timor-Leste, Tonga, Trinitat i Tobago, Turkmenistan, Illes Turques i Caicos, Vanuatu, Zàmbia, Zimbabwe.' }
    ];
    
    // Processament de codis de països (Millora la precisió, normalitzant els noms)
    zonesAmbCodis.forEach(zona => {
        const contingutNormalitzat = zona.contingut.toLowerCase()
            .replace(/\./g, '') 
            .replace(/ i /g, ', ');
        
        const nomsNet = contingutNormalitzat.split(/,\s*/).map(s => s.trim()).filter(s => s.length > 0);
        
        zona.codisPaisos = new Set();
        nomsNet.forEach(nom => {
            const nomSenseAccents = nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const codi = reverseCountryMap[nomSenseAccents];
            if (codi) zona.codisPaisos.add(codi);
        });
    });
    
    // 2. Creació de l'estructura de columnes i inserció del mapa
    const mapaDiv = document.getElementById('map');
    const mainContainer = document.querySelector('main');
    if (!mapaDiv || !mainContainer) return;

    let contenidor = document.querySelector('.contenidor-mapa-text');
    let columnaMapa = document.querySelector('.columna-mapa');
    
    if (!contenidor) {
        contenidor = document.createElement('div');
        contenidor.className = 'contenidor-mapa-text';
        mainContainer.appendChild(contenidor);
    }
    
    if (!columnaMapa) {
        columnaMapa = document.createElement('div');
        columnaMapa.className = 'columna-mapa';
        contenidor.appendChild(columnaMapa);
    }
    if (mapaDiv.parentElement !== columnaMapa) {
        columnaMapa.appendChild(mapaDiv);
    }

    // Creem la columna per al text
    const columnaText = document.createElement('div');
    columnaText.className = 'columna-text';
    columnaText.innerHTML = `<h2 id="text-addicional">Informació Addicional</h2>`;

    // 3. Creació i inserció dels desplegables (Acordió)
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
    
    if (!document.querySelector('.columna-text')) {
         contenidor.appendChild(columnaText); 
    }

    // 4. DELEGACIÓ D'ESDEVENIMENTS CLAU: La lògica de clic per a l'acordió
    columnaText.addEventListener('click', (e) => {
        const titolClicat = e.target.closest('.zona-titol');
        
        if (titolClicat) {
            const idDesplegable = titolClicat.parentElement.id;
            obreDesplegable(idDesplegable);
        }
    });

    // 5. Inicialització del mapa (Simplemaps)
    if (typeof simplemaps_worldmap !== 'undefined') {
        simplemaps_worldmap.create_map();
    }
    
    // 6. Amaga la marca d'aigua i afegeix estils d'acordió crítics (per si el CSS extern no carrega)
    const style = document.createElement('style');
    style.textContent = `
        #map_holder div[title="For evaluation use only."], 
        #map_holder a[title="For evaluation use only."] {
            display: none !important;
        }
        .zona-desplegable { overflow: hidden; }
        .zona-titol { cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        
        .zona-contingut { 
            max-height: 0 !important; 
            overflow: hidden !important;
            padding: 0 15px !important;
            transition: max-height 0.4s ease-out, padding 0.4s ease-out;
        }
        .zona-desplegable.actiu .zona-contingut { 
            max-height: 2000px !important; 
            padding: 15px !important; 
        }
    `;
    document.head.appendChild(style);


    // --- Event Handlers de Llista (Sincronització amb el mapa) ---
    cercador?.addEventListener('input', function(e) {
        const termeCerca = e.target.value;
        aplicaFiltreColorMapa(termeCerca);

        const dep = selectDepartament ? selectDepartament.value : '';
        const selectSub = document.querySelector('.filtreSubdepartament');
        const subdep = selectSub ? selectSub.value : '';
        filtraIDepSub(dep, subdep);

        if (termeCerca.trim() === "") {
            if (typeof simplemaps_worldmap !== 'undefined' && simplemaps_worldmap.back) {
                simplemaps_worldmap.back();
            }
            document.querySelectorAll('.zona-desplegable.actiu').forEach(d => d.classList.remove('actiu'));
        } else {
            const nomNormalitzat = termeCerca.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const codiPaisBuscat = reverseCountryMap[nomNormalitzat];

            if (codiPaisBuscat) {
                const zonaTrobada = zonesAmbCodis.find(z => z.codisPaisos.has(codiPaisBuscat));
                if (zonaTrobada) {
                    obreDesplegable(zonaTrobada.id);
                }
            }
        }
    });

    btnResetMapa?.addEventListener('click', () => {
        if (typeof simplemaps_worldmap !== 'undefined' && simplemaps_worldmap.back) {
            simplemaps_worldmap.back();
        }
        aplicaFiltreColorMapa("");
        if (inputZoomPais) inputZoomPais.value = "";
        if (missatgeZoom) missatgeZoom.textContent = 'Mapa resetejat a la vista mundial.';
        
        document.querySelectorAll('.zona-desplegable.actiu').forEach(d => d.classList.remove('actiu'));
    });
});