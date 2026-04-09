// data_config.js - Hier kannst du Medikamente und Untersuchungs-Texte bearbeiten

// --- 1. MEDIKAMENTE ---
const MED_GROUPS = {
    "Herzinsuffizienz (Fantastic 4+)": [
        "Bisoprolol", 
        "Metoprolol", 
        "Carvedilol", 
        "Nebivolol",
        "Ramipril", 
        "Lisinopril", 
        "Candesartan", 
        "Valsartan", 
        "Entresto (Sacubitril/Valsartan)", 
        "Spironolacton", 
        "Eplerenon", 
        "Dapagliflozin", 
        "Empagliflozin"
    ],
    "Gerinnung (OAK & NMH)": [
        "ASS", 
        "Clopidogrel", 
        "Ticagrelor", 
        "Prasugrel",
        "Apixaban (Eliquis)", 
        "Rivaroxaban (Xarelto)", 
        "Edoxaban (Lixiana)", 
        "Marcumar (Phenprocoumon)", 
        "Heparin (Perfusor)", 
        "Certoparin (Mono-Embolex)", 
        "Tinzaparin (Innohep)", 
        "Enoxaparin (Clexane)"
    ],
    "Diuretika & Volumen": [
        "Torasemid", 
        "Furosemid (Lasix)", 
        "HCT", 
        "Xipamid", 
        "Chlortalidon", 
        "Spironolacton",
        "Tolvaptan"
    ],
    "Rhythmus & Rate Control": [
        "Amiodaron", 
        "Digitoxin", 
        "Digoxin", 
        "Flecainid", 
        "Propafenon", 
        "Verapamil",
        "Adenosin (akut)"
    ],
    "Hypertonie / KHK (Ergänzung)": [
        "Amlodipin", 
        "Lercanidipin", 
        "Nifedipin", 
        "Urapidil", 
        "Clonidin", 
        "Moxonidin", 
        "Doxazosin",
        "Glyceroltrinitrat (Nitro)",
        "Isosorbidmononitrat (ISMN)",
        "Ranolazin"
    ],
    "Antiinfektiva (Antibiotika/Pilze)": [
        "Ampicillin/Sulbactam (Unacid)", 
        "Piperacillin/Tazobactam (Tazobac)", 
        "Cefuroxim", 
        "Ceftriaxon", 
        "Cefazolin", 
        "Cepotaxim",
        "Meropenem", 
        "Imipenem",
        "Ciprofloxacin", 
        "Levofloxacin", 
        "Moxifloxacin",
        "Clarithromycin", 
        "Azithromycin", 
        "Doxycyclin", 
        "Clindamycin", 
        "Metronidazol", 
        "Vancomycin", 
        "Linezolid", 
        "Cotrimoxazol",
        "Amoxicillin/Clavulansäure",
        "Rifampicin",
        "Fluconazol",
        "Amphotericin B"
    ],
    "Analgesie & Sedierung": [
        "Metamizol (Novalgin)", 
        "Ibuprofen", 
        "Paracetamol", 
        "Piritramid (Dipidolor)", 
        "Oxycodon", 
        "Morphin", 
        "Tilidin",
        "Lorazepam (Tavor)", 
        "Zopiclon", 
        "Midazolam",
        "Propofol"
    ],
    "Stoffwechsel / Gastro / Sonstiges": [
        "Metformin", 
        "Sitagliptin", 
        "Insulin (Actrapid)", 
        "Insulin (Lantus/Basal)", 
        "Pantoprazol", 
        "Omeprazol", 
        "L-Thyroxin", 
        "Atorvastatin", 
        "Rosuvastatin", 
        "Simvastatin", 
        "Ezetimib", 
        "Allopurinol", 
        "Kalium", 
        "Magnesium"
    ],
    "Lunge (COPD/Asthma/PAH)": [
        "Salbutamol", 
        "Ipratropium/Fenoterol", 
        "Beclometason/Formoterol", 
        "Theophyllin", 
        "Prednisolon",
        "Sildenafil (PAH)", 
        "Macitentan", 
        "Selexipag"
    ],
    "Psych / Neuro": [
        "Mirtazapin", 
        "Pipamperon", 
        "Melperon", 
        "Escitalopram", 
        "Citalopram", 
        "Sertralin", 
        "Quetiapin", 
        "Pregabalin", 
        "Gabapentin",
        "Levodopa"
    ]
};

// --- 2. AUFNAHME-GENERATOR ---
const EXAM_CONFIG = {
    "Allgemein": {
        options: ["Guter AZ, normaler EZ", "Reduzierter AZ", "Schlechter AZ", "Adipöser EZ", "Kachektischer EZ", "Exsikkose"],
        default: "Guter AZ, normaler EZ"
    },
    "Neuro": {
        options: ["wach, orientiert (3-fach)", "somnolent", "soporös", "desorientiert", "Meningismus pos."],
        default: "wach, zu allen Qualitäten orientiert. Keine fokalneurologischen Defizite."
    },
    "Kopf/Hals": {
        options: ["Schleimhäute trocken", "Lippenzyanose", "Struma", "Halsvenenstauung", "Soor"],
        default: "Schleimhäute feucht, kein Ikterus, keine Zyanose. Schilddrüse schluckverschieblich."
    },
    "Cor": {
        options: ["Systolikum (PM Herzspitze)", "Systolikum (PM 2. ICR re)", "Diastolikum", "Arrhythmie", "Schrittmacher tastbar"],
        default: "Herztöne rein, rhythmisch, normofrequent. Keine vitientypischen Geräusche."
    },
    "Pulmo": {
        options: ["RG basal bds.", "Giemen/Brummen", "Spastik", "verlängertes Exspirium", "Silent Chest", "Klopfschall gedämpft"],
        default: "Vesikuläres Atemgeräusch beidseits, keine Rasselgeräusche. Sonorer Klopfschall."
    },
    "Abdomen": {
        options: ["Druckschmerz Unterbauch", "Druckschmerz Epigastrium", "Abwehrspannung", "Resistenz tastbar", "Meteorismus", "Nierenlager klopfschmerzhaft"],
        default: "Bauchdecke weich, regelrechte Darmgeräusche über allen Quadranten. Kein Druckschmerz, keine Abwehrspannung. Leber und Milz nicht tastbar."
    },
    "Extremitäten": {
        options: ["Ödeme (Unterschenkel)", "Ödeme (bis Oberschenkel)", "Pulsstatus defizitär", "Varikosis", "Ulcus cruris"],
        default: "Keine peripheren Ödeme. Periphere Pulse gut tastbar. Rekap-Zeit < 2s."
    }
};

// --- 3. DIAGNOSTIK & DAILY TASKS ---
const DIAGNOSTICS = ["Labor", "EKG", "Rö-Thx", "Echo", "Sono", "CT", "MRT", "Lufu", "Kolo", "ÖGD", "Konsil", "HKL"];

const DAILY_TASKS = [
    { key: 'be', label: 'BE' },
    { key: 'viggo', label: 'Viggo' },
    { key: 'visite', label: 'Visite' },
    { key: 'brief', label: 'Brief' },
    { key: 'ange', label: 'Ang.' },
    { key: 'aufkl', label: 'Aufkl.' }
];

const CVRF_CONFIG = [
    { key: 'htn', icon: '🩸', label: 'Art. Hypertonie' },
    { key: 'dm', icon: '🍬', label: 'Diabetes' },
    { key: 'dlp', icon: '🍟', label: 'Dyslipidämie' },
    { key: 'nik', icon: '🚬', label: 'Nikotin' },
    { key: 'fam', icon: '🧬', label: 'Pos. Familienanamnese' },
    { key: 'adipos', icon: '⚖️', label: 'Adipositas' }
];

/* --- ZUSATZ: SCORE LOGIK & DEFINITIONEN --- */

// Hilfsfunktionen für die Score-Logik
function getAgeNum(dob) {
    if(!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

function hasKw(p, keywords) {
    // Sucht Keywords in Diagnose, Vordiagnose und aktueller Medikation
    const text = (p.diagnosis + " " + p.history + " " + p.meds_current).toLowerCase();
    return keywords.some(k => text.includes(k));
}

// Die Liste der Scores mit Filter-Regeln
const SCORE_DEFINITIONS = [
    {
        id: "cha2ds2",
        name: "CHA₂DS₂-VASc",
        info: "Schlaganfallrisiko bei VHF",
        url: "https://www.mdcalc.com/calc/801/cha2ds2-vasc-score-atrial-fibrillation-stroke-risk",
        check: (p) => hasKw(p, ["vhf", "vorhof", "flimmern", "arrhythmie", "pvi", "ablation"])
    },
    {
        id: "hasbled",
        name: "HAS-BLED",
        info: "Blutungsrisiko unter OAK",
        url: "https://www.mdcalc.com/calc/807/has-bled-score-major-bleeding-risk",
        check: (p) => hasKw(p, ["vhf", "vorhof", "marcumar", "apixaban", "eliquis", "xarelto", "lixiana", "edoxaban", "pradaxa", "oak", "noak"])
    },
    {
        id: "score2",
        name: "SCORE2 (Risk Chart)",
        info: "10-Jahres CVD Risiko (Prävention)",
        url: "https://u-prevent.com/calculators/score2",
        check: (p) => {
            const age = getAgeNum(p.dob);
            // Nur für 40-69 Jahre, NICHT bei bekannter KHK/Diabetes (da dann eh High Risk)
            return (age >= 40 && age < 70) && !hasKw(p, ["khk", "stent", "infarkt", "bypass", "diabetes", "dm ", "insulin"]);
        }
    },
    {
        id: "score2op",
        name: "SCORE2-OP",
        info: "CVD Risiko für Ältere (70+)",
        url: "https://u-prevent.com/calculators/score2",
        check: (p) => getAgeNum(p.dob) >= 70 && !hasKw(p, ["khk", "stent", "infarkt", "bypass"])
    },
    {
        id: "nyha",
        name: "NYHA-Klassifikation",
        info: "Schweregrad Herzinsuffizienz",
        url: "https://flexikon.doccheck.com/de/NYHA-Klassifikation",
        check: (p) => hasKw(p, ["insuffizienz", "hfpEF", "hfmrEF", "hfrEF", "pumpfunktion", "kardiomyopathie", "cmp", "lasix", "furo", "torasemid"])
    },
    {
        id: "ehra",
        name: "EHRA-Score",
        info: "Symptomatik bei VHF",
        url: "https://flexikon.doccheck.com/de/EHRA-Klassifikation",
        check: (p) => hasKw(p, ["vhf", "vorhof", "flimmern"])
    },
    {
        id: "wells",
        name: "Wells-Score",
        info: "Wahrscheinlichkeit TVT/LAE",
        url: "https://www.mdcalc.com/calc/362/wells-criteria-pulmonary-embolism",
        check: (p) => hasKw(p, ["tvt", "lae", "thrombose", "embolie", "schwellung", "dyspnoe", "atemnot"])
    },
    {
        id: "curb65",
        name: "CURB-65",
        info: "Pneumonie Schweregrad",
        url: "https://www.mdcalc.com/calc/324/curb-65-score-pneumonia-severity",
        check: (p) => hasKw(p, ["pneumonie", "lunge", "infekt", "fieber", "husten", "copd"])
    },
    {
        id: "rcri",
        name: "RCRI (Lee-Index)",
        info: "Kardiales OP-Risiko",
        url: "https://www.mdcalc.com/calc/1725/revised-cardiac-risk-index-lee-criteria",
        check: (p) => hasKw(p, ["op", "prä", "vorbereit", "konsil", "narkose", "hüfte", "knie", "tep"])
    },
    {
        id: "qsofa",
        name: "qSOFA",
        info: "Sepsis Screening",
        url: "https://www.mdcalc.com/calc/1654/qsofa-quick-sofa-score-sepsis",
        check: (p) => hasKw(p, ["infekt", "fieber", "sepsis", "hwi", "pneumonie", "staph", "strept", "e. coli", "antibiot"])
    },
    {
        id: "child",
        name: "Child-Pugh-Score",
        info: "Leberzirrhose Prognose",
        url: "https://www.mdcalc.com/calc/29/child-pugh-score-cirrhosis-mortality",
        check: (p) => hasKw(p, ["leber", "zirrhose", "c2", "alkohol", "aszites", "hepatitis", "hepa"])
    },
    {
        id: "bmi",
        name: "BMI Rechner",
        info: "Body Mass Index",
        url: "https://www.tk.de/service/form/2034948/bmirechner.form",
        check: (p) => true // Immer anzeigen
    }
];