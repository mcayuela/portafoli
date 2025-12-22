// Variable global per accedir a les zones
let extensions = [];
let zonesAmbCodis = [];
let paginaActual = 1;
let resultatsFiltrats = [];
const RESULTATS_PER_PAGINA = 50;

// Llista de països traduïda al Català per al cercador
const countryNames = {
    "AF": "Afganistan", "AO": "Angola", "AL": "Albània", "AE": "Emirats Àrabs Units", "AR": "Argentina",
    "AM": "Armènia", "AU": "Austràlia", "AT": "Àustria", "AZ": "Azerbaidjan", "BI": "Burundi",
    "BE": "Bèlgica", "BJ": "Benín", "BF": "Burkina Faso", "BD": "Bangla Desh", "BG": "Bulgària",
    "BH": "Bahrain", "BA": "Bòsnia i Hercegovina", "BY": "Bielorússia", "BZ": "Belize", "BO": "Bolívia",
    "BR": "Brasil", "BN": "Brunei", "BT": "Bhutan", "BW": "Botswana", "CF": "República Centreafricana",
    "CA": "Canadà", "CH": "Suïssa", "CL": "Xile", "CN": "Xina", "CI": "Costa d'Ivori",
    "CM": "Camerun", "CD": "República Democràtica del Congo", "CG": "Congo", "CO": "Colòmbia",
    "CR": "Costa Rica", "CU": "Cuba", "CZ": "República Txeca", "DE": "Alemanya", "DJ": "Djibouti",
    "DK": "Dinamarca", "DO": "República Dominicana", "DZ": "Algèria", "EC": "Equador", "EG": "Egipte",
    "ER": "Eritrea", "EE": "Estònia", "ET": "Etiòpia", "FI": "Finlàndia", "FJ": "Fiji",
    "GA": "Gabon", "GB": "Regne Unit", "GE": "Geòrgia", "GH": "Ghana", "GN": "Guinea",
    "GM": "Gàmbia", "GW": "Guinea-Bissau", "GQ": "Guinea Equatorial", "GR": "Grècia", "GL": "Grenlàndia",
    "GT": "Guatemala", "GY": "Guyana", "HN": "Hondures", "HR": "Croàcia", "HT": "Haití",
    "HU": "Hongria", "ID": "Indonèsia", "IN": "Índia", "IE": "Irlanda", "IR": "Iran",
    "IQ": "Iraq", "IS": "Islàndia", "IL": "Israel", "IT": "Itàlia", "JM": "Jamaica",
    "JO": "Jordània", "JP": "Japó", "KZ": "Kazakhstan", "KE": "Kenya", "KG": "Kirguizistan",
    "KH": "Cambodja", "KR": "Corea del Sud", "XK": "Kosovo", "KW": "Kuwait", "LA": "Laos",
    "LB": "Líban", "LR": "Libèria", "LY": "Líbia", "LK": "Sri Lanka", "LS": "Lesotho",
    "LT": "Lituània", "LU": "Luxemburg", "LV": "Letònia", "MA": "Marroc", "MD": "Moldàvia",
    "MG": "Madagascar", "MX": "Mèxic", "MK": "Macedònia", "ML": "Mali", "MM": "Myanmar",
    "ME": "Montenegro", "MN": "Mongòlia", "MZ": "Moçambic", "MR": "Mauritània", "MW": "Malawi",
    "MY": "Malàisia", "NA": "Namíbia", "NE": "Níger", "NG": "Nigèria", "NI": "Nicaragua",
    "NL": "Països Baixos", "NO": "Noruega", "NP": "Nepal", "NZ": "Nova Zelanda", "OM": "Oman",
    "PK": "Pakistan", "PA": "Panamà", "PE": "Perú", "PH": "Filipines", "PG": "Papua Nova Guinea",
    "PL": "Polònia", "KP": "Corea del Nord", "PT": "Portugal", "PY": "Paraguai", "PS": "Palestina",
    "QA": "Qatar", "RO": "Romania", "RU": "Rússia", "RW": "Ruanda", "EH": "Sàhara Occidental",
    "SA": "Aràbia Saudita", "SD": "Sudan", "SS": "Sudan del Sud", "SN": "Senegal", "SL": "Sierra Leone",
    "SV": "El Salvador", "RS": "Sèrbia", "SR": "Surinam", "SK": "Eslovàquia", "SI": "Eslovènia",
    "SE": "Suècia", "SZ": "Swazilàndia", "SY": "Síria", "TD": "Txad", "TG": "Togo",
    "TH": "Tailàndia", "TJ": "Tadjikistan", "TM": "Turkmenistan", "TL": "Timor-Leste", "TN": "Tunísia",
    "TR": "Turquia", "TW": "Taiwan", "TZ": "Tanzània", "UG": "Uganda", "UA": "Ucraïna",
    "UY": "Uruguai", "US": "Estats Units", "UZ": "Uzbekistan", "VE": "Veneçuela", "VN": "Vietnam",
    "VU": "Vanuatu", "YE": "Iemen", "ZA": "Sud-àfrica", "ZM": "Zàmbia", "ZW": "Zimbabwe",
    "SO": "Somàlia", "GF": "Guyana Francesa", "FR": "França", "ES": "Espanya", "AW": "Aruba",
    "AI": "Anguila", "AD": "Andorra", "AG": "Antiga i Barbuda", "BS": "Bahames", "BM": "Bermudes",
    "BB": "Barbados", "KM": "Comores", "CV": "Cap Verd", "KY": "Illes Caiman", "DM": "Dominica",
    "FK": "Illes Malvines", "FO": "Illes Feroe", "GD": "Grenada", "HK": "Hong Kong",
    "KN": "Saint Kitts i Nevis", "LC": "Saint Lucia", "LI": "Liechtenstein", "MF": "Saint Martin",
    "MV": "Maldives", "MT": "Malta", "MS": "Montserrat", "MU": "Maurici", "NC": "Nova Caledònia",
    "NR": "Nauru", "PN": "Illes Pitcairn", "PR": "Puerto Rico", "PF": "Polinèsia Francesa",
    "SG": "Singapur", "SB": "Illes Salomó", "ST": "São Tomé i Príncipe", "SX": "Sint Maarten",
    "SC": "Seychelles", "TC": "Illes Turks i Caicos", "TO": "Tonga", "TT": "Trinitat i Tobago",
    "VC": "Saint Vincent i les Grenadines", "VG": "Illes Verges Britàniques", "VI": "Illes Verges Nord-americanes",
    "CY": "Xipre", "RE": "Reunió", "YT": "Mayotte", "MQ": "Martinica",
    "GP": "Guadeloupe", "CW": "Curaçao", "IC": "Illes Canàries"
};

let dadesOriginalsDelMapa = {};
const reverseCountryMap = {};
for (const codi in countryNames) {
    const nomNormalitzat = countryNames[codi].toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    reverseCountryMap[nomNormalitzat] = codi;
}

const zoneColorMap = {
    "zona-eee": "#035eff",
    "zona-business": "#ff9b00",
    "zona-business-plus": "#71d17a",
    "zona-row": "#4a4a4a"
};

// --- FUNCIONS MAPA ---

function getRegionCode(countryCode) {
    if (typeof simplemaps_worldmap_mapdata === 'undefined' || !simplemaps_worldmap_mapdata.regions) return null;
    for (const regionId in simplemaps_worldmap_mapdata.regions) {
        if (simplemaps_worldmap_mapdata.regions[regionId].states.includes(countryCode)) return regionId;
    }
    return null;
}

function aplicaFiltreColorMapa(termeCerca) {
    const termeMin = termeCerca.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (typeof simplemaps_worldmap_mapdata === 'undefined') return;

    const codisCoincidents = new Set(Object.keys(countryNames).filter(codi =>
        countryNames[codi].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termeMin)
    ));

    Object.keys(dadesOriginalsDelMapa).forEach(codiPais => {
        const esCoincident = codisCoincidents.has(codiPais) || termeMin === "";
        simplemaps_worldmap_mapdata.state_specific[codiPais] = esCoincident
            ? { ...dadesOriginalsDelMapa[codiPais] }
            : { ...dadesOriginalsDelMapa[codiPais], color: '#E0E0E0', hover_color: '#E0E0E0', url: '' };
    });

    if (window.simplemaps_worldmap?.refresh) simplemaps_worldmap.refresh();
}

function ressaltaPaisosDeZona(codisPaisosSet, zonaId) {
    if (typeof simplemaps_worldmap_mapdata === 'undefined') return;
    const zonaColor = zoneColorMap[zonaId] || '#4a4a4a';

    Object.keys(dadesOriginalsDelMapa).forEach(codiPais => {
        if (codisPaisosSet.has(codiPais)) {
            simplemaps_worldmap_mapdata.state_specific[codiPais] = { 
                ...dadesOriginalsDelMapa[codiPais], 
                color: zonaColor,
                hover_color: zonaColor
            };
        } else {
            simplemaps_worldmap_mapdata.state_specific[codiPais] = { 
                ...dadesOriginalsDelMapa[codiPais], 
                color: '#E0E0E0', 
                hover_color: '#E0E0E0',
                url: '' 
            };
        }
    });
    if (window.simplemaps_worldmap?.refresh) simplemaps_worldmap.refresh();
}

function obreDesplegable(idZona, actualitzarMapa = true) {
    const desplegable = document.getElementById(idZona);
    if (!desplegable) return;

    const jaActiu = desplegable.classList.contains('actiu');
    document.querySelectorAll('.zona-desplegable').forEach(d => d.classList.remove('actiu'));

    if (!jaActiu) {
        desplegable.classList.add('actiu');
        if (actualitzarMapa) {
            const zona = zonesAmbCodis.find(z => z.id === idZona);
            if (zona) ressaltaPaisosDeZona(zona.codisPaisos, idZona);
        }
    } else if (actualitzarMapa) {
        aplicaFiltreColorMapa("");
    }
}

function masterZoom(termeCerca) {
    const nomNorm = termeCerca.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const codi = reverseCountryMap[nomNorm];
    if (!codi || !window.simplemaps_worldmap) return;

    const regid = getRegionCode(codi);
    const ferZoom = () => {
        if (regid) simplemaps_worldmap.zoom_to_region(regid);
        else simplemaps_worldmap.zoom_to_state(codi);
    };

    if (simplemaps_worldmap.zoom_level !== 'out') simplemaps_worldmap.back(ferZoom);
    else ferZoom();
}

function executarAccioCerca() {
    const cercador = document.getElementById('buscador');
    const suggerimentsBox = document.getElementById('suggeriments');
    if (!cercador) return;

    const textInput = cercador.value.trim();
    if (textInput === "") {
        if (window.simplemaps_worldmap) simplemaps_worldmap.back();
        aplicaFiltreColorMapa("");
        document.querySelectorAll('.zona-desplegable').forEach(d => d.classList.remove('actiu'));
        return;
    }

    const textNorm = textInput.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Cerquem el país en la nostra llista en català
    const millorCodi = Object.keys(countryNames).find(codi => 
        countryNames[codi].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(textNorm)
    ) || Object.keys(reverseCountryMap).find(n => n.includes(textNorm));

    if (millorCodi) {
        const nomPais = countryNames[millorCodi];
        cercador.value = nomPais;
        suggerimentsBox.style.display = 'none';

        aplicaFiltreColorMapa(nomPais);
        const codiFinal = reverseCountryMap[nomPais.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
        
        const zona = zonesAmbCodis.find(z => z.codisPaisos.has(codiFinal));
        if (zona) obreDesplegable(zona.id, false); 
        
        masterZoom(nomPais);
    }
}

// --- DOM CONTENT LOADED ---

document.addEventListener('DOMContentLoaded', () => {
    const cercador = document.getElementById('buscador');
    const suggerimentsBox = document.getElementById('suggeriments');
    const btnCercar = document.getElementById('btn-cercar');

    // 1. Definició de Zones (Català)
    zonesAmbCodis = [
        { id: 'zona-eee', titol: 'Zona EEE + UK', colorId: '#035eff', contingut: 'Alemanya, Àustria, Bèlgica, Bulgària, Croàcia, Xipre, Dinamarca, Eslovàquia, Eslovènia, Espanya, Estònia, Finlàndia, França, Grècia, Hongria, Irlanda, Islàndia, Itàlia, Letònia, Liechtenstein, Lituània, Luxemburg, Malta, Noruega, Països Baixos, Polònia, Portugal, Regne Unit, República Txeca, Romania i Suècia.' },
        { id: 'zona-business', titol: 'Zona Business', colorId: '#ff9b00', contingut: 'Afganistan, Albània, Andorra, Aràbia Saudita, Argentina, Armènia, Austràlia, Bolívia, Brasil, Cambodja, Canadà, Xile, Xina, Colòmbia, Congo, Costa Rica, Cuba, Equador, Egipte, El Salvador, Emirats Àrabs Units, Estats Units, Federació de Rússia, Filipines, Geòrgia, Ghana, Guam, Guatemala, Hondures, Hong Kong, Índia, Indonèsia, Israel, Jamaica, Japó, Kazakhstan, Kenya, Macedònia, Mèxic, Moldàvia, Mònaco, Marroc, Moçambic, Nova Zelanda, Nicaragua, Panamà, Paraguai, Perú, Puerto Rico, Qatar, Sèrbia, Singapur, Sud-àfrica, Sri Lanka, Sudan, Suïssa, Tailàndia, Togo, Tunísia, Turquia, Ucraïna, Uruguai, Veneçuela.' },
        { id: 'zona-business-plus', titol: 'Zona Business Plus', colorId: '#71d17a', contingut: 'Algèria, Angola, Azerbaidjan, Bahrain, Bangla Desh, Bielorússia, Belize, Benín, Bòsnia i Hercegovina, Botswana, Burkina Faso, Camerun, Cap Verd, Costa d\'Ivori, Guinea Equatorial, Etiòpia, Polinèsia Francesa, Gàmbia, Grenlàndia, República Guineana, Guinea-Bissau, Guyana, Haití, Jordània, Kuwait, Líban, Libèria, Madagascar, Malàisia, Mali, Maurici, Mauritània, Mongòlia, República Centreafricana, República de Corea, Laos, Montenegro, Myanmar, Namíbia, Níger, Nigèria, Oman, Pakistan, Ruanda, Senegal, Taiwan, Palestina, Uganda, Uzbekistan, Vietnam, Iemen.' },
        { id: 'zona-row', titol: 'Zona ROW', colorId: '#4a4a4a', contingut: 'Antiga i Barbuda, Anguila, Aruba, Bahames, Barbados, Bhutan, Brunei, Burundi, Illes Caiman, Txad, Comores, Djibouti, Dominica, Fiji, Gabon, Grenada, Iraq, Kosovo, Kirguizistan, Lesotho, Líbia, Macau, Malawi, Maldives, Montserrat, Nepal, Antilles Holandeses, Nova Caledònia, Palau, Papua Nova Guinea, Saint Kitts i Nevis, Saint Lucia, Samoa, San Marino, São Tomé i Príncipe, Seychelles, Sierra Leone, Somàlia, Saint Vincent i les Grenadines, Surinam, Swazilàndia, Síria, Tadjikistan, Tanzània, Timor-Leste, Tonga, Trinitat i Tobago, Turkmenistan, Vanuatu, Zàmbia, Zimbabwe.' }
    ];

    if (typeof simplemaps_worldmap_mapdata !== 'undefined') {
        dadesOriginalsDelMapa = JSON.parse(JSON.stringify(simplemaps_worldmap_mapdata.state_specific));

        const codisPerColor = {};
        Object.keys(dadesOriginalsDelMapa).forEach(c => {
            const color = dadesOriginalsDelMapa[c].color || "#4a4a4a";
            if (!codisPerColor[color]) codisPerColor[color] = new Set();
            codisPerColor[color].add(c);
        });

        zonesAmbCodis.forEach(z => {
            z.codisPaisos = codisPerColor[z.colorId] || new Set();
        });

        // Injectar Descripcions i Noms en Català als Popups del mapa
        Object.keys(simplemaps_worldmap_mapdata.state_specific).forEach(codi => {
            const zonaTrobada = zonesAmbCodis.find(z => z.codisPaisos.has(codi));
            // Actualitzem el nom que es mostra al fer hover
            if (countryNames[codi]) {
                simplemaps_worldmap_mapdata.state_specific[codi].name = countryNames[codi];
            }
            if (zonaTrobada) {
                simplemaps_worldmap_mapdata.state_specific[codi].description = "Zona: " + zonaTrobada.titol;
            } else {
                simplemaps_worldmap_mapdata.state_specific[codi].description = "Zona no definida";
            }
        });
        dadesOriginalsDelMapa = JSON.parse(JSON.stringify(simplemaps_worldmap_mapdata.state_specific));
    }

    const main = document.querySelector('main');
    if (main) {
        let cont = document.querySelector('.contenidor-mapa-text') || document.createElement('div');
        cont.className = 'contenidor-mapa-text';
        main.appendChild(cont);

        let colMapa = document.querySelector('.columna-mapa') || document.createElement('div');
        colMapa.className = 'columna-mapa';
        cont.appendChild(colMapa);
        colMapa.appendChild(document.getElementById('map'));

        let colText = document.querySelector('.columna-text') || document.createElement('div');
        colText.className = 'columna-text';
        colText.innerHTML = '<h2>Informació de Zones</h2>';
        zonesAmbCodis.forEach(z => {
            const d = document.createElement('div');
            d.className = 'zona-desplegable';
            d.id = z.id;
            d.style.borderLeft = `5px solid ${z.colorId}`;
            d.innerHTML = `<div class="zona-titol"><b>${z.titol}</b></div><div class="zona-contingut">${z.contingut}</div>`;
            colText.appendChild(d);
        });
        cont.appendChild(colText);

        colText.addEventListener('click', (e) => {
            const t = e.target.closest('.zona-titol');
            if (t) obreDesplegable(t.parentElement.id);
        });
    }

    cercador?.addEventListener('input', () => {
        const val = cercador.value.trim();
        aplicaFiltreColorMapa(val);
        if (val.length > 0) {
            const matches = Object.values(countryNames).filter(n => 
                n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .includes(val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
            ).slice(0, 10);
            suggerimentsBox.innerHTML = matches.map(m => `<div class="suggeriment-item">${m}</div>`).join('');
            suggerimentsBox.style.display = matches.length ? 'block' : 'none';
        } else {
            suggerimentsBox.style.display = 'none';
        }
    });

    cercador?.addEventListener('keydown', (e) => { if (e.key === 'Enter') executarAccioCerca(); });
    btnCercar?.addEventListener('click', executarAccioCerca);
    
    suggerimentsBox?.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggeriment-item')) {
            cercador.value = e.target.textContent;
            executarAccioCerca();
        }
    });

    if (window.simplemaps_worldmap) simplemaps_worldmap.create_map();
});