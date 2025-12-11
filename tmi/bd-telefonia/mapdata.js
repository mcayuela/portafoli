var simplemaps_worldmap_mapdata={
main_settings: {
   //General settings
    width: "responsive",
    background_color: "#FFFFFF",
    background_transparent: "yes",
    border_color: "#ffffff",
    popups: "detect",
    
    //State defaults
    state_description: "State description",
    state_color: "#88A4BC",
    state_hover_color: "#3B729F",
    border_size: 1.5,
    all_states_inactive: "no",
    all_states_zoomable: "no",
    
    //Location defaults
    location_description: "Location description",
    location_color: "#FF0067",
    location_opacity: 0.8,
    location_hover_opacity: 1,
    location_url: "",
    location_size: 25,
    location_type: "square",
    location_image_source: "frog.png",
    location_border_color: "#FFFFFF",
    location_border: 2,
    location_hover_border: 2.5,
    all_locations_inactive: "no",
    all_locations_hidden: "no",
    
    //Label defaults
    label_color: "#d5ddec",
    label_hover_color: "#d5ddec",
    label_size: 22,
    label_font: "Arial",
    hide_labels: "no",
    //Zoom settings
    zoom: "yes",
    back_image: "no",
    initial_back: "no",
    initial_zoom: -1,
    initial_zoom_solo: "no",
    region_opacity: 1,
    region_hover_opacity: 0.6,
    zoom_out_incrementally: "yes",
    zoom_percentage: 0.99,
    zoom_time: 0.5,
    
    //Popup settings
    popup_color: "white",
    popup_opacity: 0.9,
    popup_shadow: 1,
    popup_corners: 5,
    popup_font: "12px/1.5 Verdana, Arial, Helvetica, sans-serif",
    popup_nocss: "no",
    
    //Advanced settings
    div: "map",
    auto_load: "yes",
    url_new_tab: "yes",
    images_directory: "default",
    fade_time: 0.1,
    link_text: "View Website",
    state_image_url: "",
    state_image_position: "",
    location_image_url: ""
},

  state_specific: (function() {
    var country_data = {
      "#ff9b00": {AF:"Afghanistan",AL:"Albania",AE:"United Arab Emirates",AR:"Argentina",AM:"Armenia",AU:"Australia",BO:"Bolivia",BR:"Brazil",CA:"Canada",CH:"Switzerland",CL:"Chile",CN:"China",CD:"Democratic Republic of the Congo",CG:"Republic of Congo",CO:"Colombia",CR:"Costa Rica",CU:"Cuba",DO:"Dominican Republic",EC:"Ecuador",EG:"Egypt",GE:"Georgia",GH:"Ghana",GT:"Guatemala",HN:"Honduras",ID:"Indonesia",IN:"India",IL:"Israel",JP:"Japan",KZ:"Kazakhstan",KE:"Kenya",MK:"Macedonia",MX:"Mexico",NI:"Nicaragua",NZ:"New Zealand",PA:"Panama",PE:"Peru",PH:"Philippines",PR:"Puerto Rico",QA:"Qatar",RU:"Russia",SA:"Saudi Arabia",SD:"Sudan",RS:"Serbia",SV:"El Salvador",TH:"Thailand",TN:"Tunisia",TR:"Turkey",UA:"Ukraine",UY:"Uruguay",US:"United States",VE:"Venezuela",ZA:"South Africa",EH:"Western Sahara",TG:"Togo", MZ: "Mozambique", MA: "Morocco", LK: "Sri Lanka", PY: "Paraguay"},
      "#71d17a": {AO:"Angola",AZ:"Azerbaijan",BJ:"Benin",BF:"Burkina Faso",BD:"Bangladesh",BA:"Bosnia and Herzegovina",BY:"Belarus",BZ:"Belize",BW:"Botswana",CF:"Central African Republic",CI:"Côte d'Ivoire",CM:"Cameroon",DZ:"Algeria",ET:"Ethiopia",GN:"Guinea",GW:"Guinea-Bissau",GQ:"Equatorial Guinea",GL:"Greenland",GY:"Guyana",HT:"Haiti",IR:"Iran",JO:"Jordan",KH:"Cambodia",KR:"Republic of Korea",XK:"Kosovo",LA:"Lao PDR",LB:"Lebanon",LR:"Liberia",MG:"Madagascar",ML:"Mali",MM:"Myanmar",ME:"Montenegro",MN:"Mongolia",MR:"Mauritania",MY:"Malaysia",NA:"Namibia",NE:"Niger",NG:"Nigeria",OM:"Oman",PK:"Pakistan",SN:"Senegal",UZ:"Uzbekistan",VN:"Vietnam",YE:"Yemen",UG:"Uganda"},
      "#035eff": {AT:"Austria",BE:"Belgium",BG:"Bulgaria",CZ:"Czech Republic",DE:"Germany",DK:"Denmark",EE:"Estonia",FI:"Finland",GB:"United Kingdom",GR:"Greece",HR:"Croatia",HU:"Hungary",IE:"Ireland",IS:"Iceland",IT:"Italy",LT:"Lithuania",LV:"Latvia",MD:"Moldova",NL:"Netherlands",NO:"Norway",PL:"Poland",PT:"Portugal",RO:"Romania",SK:"Slovakia",SI:"Slovenia",SE:"Sweden",GF:"France",FR:"France",ES:"Spain"},
      "#c4c4c4": {BI:"Burundi",BT:"Bhutan",DJ:"Djibouti",ER:"Eritrea",FJ:"Fiji",GA:"Gabon",IQ:"Iraq",KG:"Kyrgyzstan",LY:"Libya",LS:"Lesotho",MW:"Malawi",NP:"Nepal",PG:"Papua New Guinea",KP:"Dem. Rep. Korea",RW:"Rwanda",SS:"South Sudan",SL:"Sierra Leone",SR:"Suriname",SZ:"Swaziland",SY:"Syria",TD:"Chad",TJ:"Tajikistan",TM:"Turkmenistan",TL:"Timor-Leste",TZ:"Tanzania",ZM:"Zambia",ZW:"Zimbabwe",SO:"Somalia",BS:"Bahamas",FK:"Falkland Islands",NC:"New Caledonia",SB:"Solomon Islands",TC:"Turks and Caicos Islands",TO:"Tonga",TT:"Trinidad and Tobago",VI:"United States Virgin Islands"},
      "default": {BH:"Bahrain",BN:"Brunei Darussalam",GM:"The Gambia",JM:"Jamaica",KW:"Kuwait",LU:"Luxembourg",PS:"Palestine",TW:"Taiwan",AW:"Aruba",AI:"Anguilla",AD:"Andorra",AG:"Antigua and Barbuda",BM:"Bermuda",BB:"Barbados",KM:"Comoros",CV:"Cape Verde",KY:"Cayman Islands",DM:"Dominica",FO:"Faeroe Islands",GD:"Grenada",HK:"Hong Kong",KN:"Saint Kitts and Nevis",LC:"Saint Lucia",LI:"Liechtenstein",MF:"Saint Martin (French)",MV:"Maldives",MT:"Malta",MS:"Montserrat",MU:"Mauritius",NR:"Nauru",PN:"Pitcairn Islands",PF:"French Polynesia",SG:"Singapore",ST:"São Tomé and Principe",SX:"Saint Martin (Dutch)",SC:"Seychelles",VC:"Saint Vincent and the Grenadines",VG:"British Virgin Islands",CY:"Cyprus",RE:"Reunion (France)",YT:"Mayotte (France)",MQ:"Martinique (France)",GP:"Guadeloupe (France)",CW:"Curaco (Netherlands)",IC:"Canary Islands (Spain)"}
    };
    var states = {};
    Object.keys(country_data).forEach(function(color) {
      var countries = country_data[color];
      Object.keys(countries).forEach(function(code) {
        states[code] = { name: countries[code] };
        if (color !== "default") { states[code].color = color; }
      });
    });
    return states;
  }()),
  locations: {},
  labels: {},
  legend: {
    entries: []
  },
  regions: {
    "0": {
      name: "North America",
      states: ["MX", "CA", "US", "GL", "BM"]
    },
    "1": {
      name: "South America",
      states: ["EC", "AR", "VE", "BR", "CO", "BO", "PE", "BZ", "CL", "CR", "CU", "DO", "SV", "GT", "GY", "GF", "HN", "NI", "PA", "PY", "PR", "SR", "UY", "JM", "HT", "BS", "FK", "AI", "AG", "AW", "BB", "VG", "KY", "DM", "MQ", "LC", "VC", "GD", "GP", "MS", "TC", "SX", "MF", "KN", "CW"]
    },
    "2": {
      name: "Europe",
      states: ["IT", "NL", "NO", "DK", "IE", "GB", "RO", "DE", "FR", "AL", "AM", "AT", "BY", "BE", "LU", "BG", "CZ", "EE", "GE", "GR", "HU", "IS", "LV", "LT", "MD", "PL", "PT", "RS", "SI", "HR", "BA", "ME", "MK", "SK", "ES", "FI", "SE", "CH", "TR", "CY", "UA", "XK", "MT", "FO"]
    },
    "3": {
      name: "Africa and the Middle East",
      states: ["QA", "BH", "SA", "AE", "SY", "OM", "KW", "PK", "AZ", "AF", "IR", "IQ", "IL", "PS", "JO", "LB", "YE", "TJ", "TM", "UZ", "KG", "NE", "AO", "EG", "TN", "GA", "DZ", "LY", "CG", "GQ", "BJ", "BW", "BF", "BI", "CM", "CF", "TD", "CI", "CD", "DJ", "ET", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "MG", "MW", "ML", "MA", "MR", "MZ", "NA", "NG", "ER", "RW", "SN", "SL", "SO", "ZA", "SD", "SS", "SZ", "TZ", "TG", "UG", "EH", "ZM", "ZW", "RE", "KM", "SC", "MU", "CV", "IC", "ST", "YT"]
    },
    "4": {
      name: "South Asia",
      states: ["SG", "TW", "IN", "AU", "MY", "NP", "NZ", "TH", "BN", "JP", "VN", "LK", "SB", "FJ", "BD", "BT", "KH", "LA", "MM", "KP", "PG", "PH", "KR", "ID", "CN", "MV", "NC", "VU", "NR"]
    },
    "5": {
      name: "North Asia",
      states: ["MN", "RU", "KZ"]
    }
  }
};