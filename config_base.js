// NEU: Die typischen Konsile
const CONSULTS = ["Uro", "UCH", "Neuro", "Gastro", "Endokr", "Pulmo", "Nephro", "Anästh", "Chir", "Psych"];

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
function getAgeNum(dob) {
    if(!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

// --- LABOR: VERLAUF & RELEVANTE ÄNDERUNGEN ---------------------------------
// Diese Parameter erscheinen als Trend (Sparkline + Pfeil) auf der Patientenkarte.
const LAB_TRENDS = [
    { code: 'V_HB', label: 'Hb' },
    { code: 'V_LEU', label: 'Leuko' },
    { code: 'V_THR', label: 'Thrombo' },
    { code: 'V_CRP', label: 'CRP' },
    { code: 'V_KREA', label: 'Krea' },
    { code: 'V_EGFR', label: 'eGFR', codes: ['V_EGFRM1', 'V_EGFRM2', 'V_EGFRW1', 'V_EGFRW2', 'V_EGFR'], labelIncludes: 'egfr' },
    { code: 'V_NA', label: 'Natrium' },
    { code: 'V_K', label: 'Kalium' }
];

// Relevante Änderungen im Verlauf – greifen auch dann, wenn der Wert noch im Normbereich liegt.
// drop/rise/change sind absolute Beträge in der Einheit des eigenen Labors (hier CRP in mg/dl!),
// dropPercent/risePercent sind prozentual; minAbsolute verhindert Meldungen über winzige
// Änderungen bei schon niedrigen Werten. withinDays begrenzt das Zeitfenster.
const LAB_DELTA_RULES = [
    { code: 'V_HB',      label: 'Hb-Abfall',              drop: 2,           unit: 'g/dl',   withinDays: 3, severity: 'high',   note: 'Blutungsquelle?' },
    { code: 'V_KREA',    label: 'Kreatinin-Anstieg',      rise: 0.3,         unit: 'mg/dl',  withinDays: 2, severity: 'high',   note: 'AKI-Kriterium (KDIGO)' },
    { code: 'V_KREA',    label: 'Kreatinin-Verdopplung',  risePercent: 100,  unit: 'mg/dl',  withinDays: 7, severity: 'high',   note: 'AKI Stadium 2' },
    { code: 'V_NA',      label: 'Natrium-Änderung',       change: 8,         unit: 'mmol/l', withinDays: 1, severity: 'high',   note: 'Korrekturgeschwindigkeit prüfen' },
    { code: 'V_K',       label: 'Kalium-Änderung',        change: 1,         unit: 'mmol/l', withinDays: 1, severity: 'medium' },
    { code: 'V_THR',     label: 'Thrombozyten-Abfall',    dropPercent: 30,   unit: 'G/l',    withinDays: 3, severity: 'medium', note: 'HIT / Sepsis?' },
    { code: 'V_CRP',     label: 'CRP-Anstieg',            rise: 2,           unit: 'mg/dl',  withinDays: 2, severity: 'medium' },
    { code: 'V_CRP',     label: 'CRP-Verdopplung',        risePercent: 100,  unit: 'mg/dl',  withinDays: 2, severity: 'medium' },
    { code: 'V_EGFR',    label: 'eGFR-Abfall',            dropPercent: 25,   unit: 'ml/min', withinDays: 7, severity: 'medium', minAbsolute: 10,
      codes: ['V_EGFRM1', 'V_EGFRM2', 'V_EGFRW1', 'V_EGFRW2', 'V_EGFR'], labelIncludes: 'egfr' },
    { code: 'V_BNP',     label: 'NT-proBNP-Anstieg',      risePercent: 50,   unit: 'pg/ml',  withinDays: 3, severity: 'medium', minAbsolute: 300, note: 'Dekompensation?' },
    { code: 'V_TROPT',   label: 'Troponin-Anstieg',       risePercent: 50,   unit: 'pg/ml',  withinDays: 1, severity: 'high',   minAbsolute: 20,  note: 'Dynamik – ACS?' }
];

// Antibiotika: Tag 3 ist der Reevaluationszeitpunkt (Deeskalation, Oralisierung, Absetzen),
// ab Tag 8 bzw. 11 wird zur Überprüfung der Gesamtdauer geraten.
const ABX_REVIEW_DAYS = { reevaluate: 3, hint: 8, warn: 11 };

// --- ANTIINFEKTIVA -------------------------------------------------------
// Erkennung unabhängig vom Medikamentenkatalog: Wirkstoff plus gängige Handelsnamen.
// Ein Treffer gilt, wenn einer der Begriffe am Wortanfang in der aktuellen Medikation steht.
const ANTIINFECTIVES = [
    { name: 'Amoxicillin', aliases: ['Amoxi'] },
    { name: 'Amoxicillin/Clavulansäure', aliases: ['Amoxiclav', 'Augmentan'] },
    { name: 'Ampicillin', aliases: [] },
    { name: 'Ampicillin/Sulbactam', aliases: ['Unacid', 'Sultamicillin'] },
    { name: 'Penicillin G', aliases: ['Benzylpenicillin'] },
    { name: 'Flucloxacillin', aliases: ['Staphylex'] },
    { name: 'Piperacillin/Tazobactam', aliases: ['Tazobac', 'Pip/Taz', 'Piperacillin'] },
    { name: 'Cefazolin', aliases: [] },
    { name: 'Cefuroxim', aliases: ['Zinacef'] },
    { name: 'Cefotaxim', aliases: ['Claforan'] },
    { name: 'Ceftriaxon', aliases: ['Rocephin'] },
    { name: 'Ceftazidim', aliases: ['Fortum'] },
    { name: 'Cefepim', aliases: ['Maxipime'] },
    { name: 'Cefpodoxim', aliases: ['Orelox'] },
    { name: 'Ceftazidim/Avibactam', aliases: ['Zavicefta'] },
    { name: 'Ceftolozan/Tazobactam', aliases: ['Zerbaxa'] },
    { name: 'Meropenem', aliases: ['Meronem'] },
    { name: 'Imipenem', aliases: ['Zienam'] },
    { name: 'Ertapenem', aliases: ['Invanz'] },
    { name: 'Aztreonam', aliases: ['Azactam'] },
    { name: 'Vancomycin', aliases: ['Vanco'] },
    { name: 'Teicoplanin', aliases: ['Targocid'] },
    { name: 'Dalbavancin', aliases: ['Xydalba'] },
    { name: 'Daptomycin', aliases: ['Cubicin'] },
    { name: 'Linezolid', aliases: ['Zyvoxid'] },
    { name: 'Clindamycin', aliases: ['Sobelin'] },
    { name: 'Gentamicin', aliases: ['Refobacin'] },
    { name: 'Tobramycin', aliases: [] },
    { name: 'Amikacin', aliases: [] },
    { name: 'Ciprofloxacin', aliases: ['Cipro', 'Ciprobay'] },
    { name: 'Levofloxacin', aliases: ['Tavanic'] },
    { name: 'Moxifloxacin', aliases: ['Avalox', 'Avelox'] },
    { name: 'Azithromycin', aliases: ['Zithromax'] },
    { name: 'Clarithromycin', aliases: ['Klacid'] },
    { name: 'Erythromycin', aliases: [] },
    { name: 'Doxycyclin', aliases: ['Doxy'] },
    { name: 'Minocyclin', aliases: [] },
    { name: 'Tigecyclin', aliases: ['Tygacil'] },
    { name: 'Eravacyclin', aliases: ['Xerava'] },
    { name: 'Cotrimoxazol', aliases: ['Trimethoprim/Sulfamethoxazol', 'TMP/SMX', 'Bactrim', 'Eusaprim'] },
    { name: 'Metronidazol', aliases: ['Clont', 'Flagyl'] },
    { name: 'Rifampicin', aliases: ['Rifa'] },
    { name: 'Fosfomycin', aliases: ['Infectofos', 'Monuril'] },
    { name: 'Nitrofurantoin', aliases: ['Furadantin'] },
    { name: 'Pivmecillinam', aliases: ['X-Systo'] },
    { name: 'Colistin', aliases: ['Colistimethat'] },
    { name: 'Fidaxomicin', aliases: ['Dificlir'] },
    { name: 'Isoniazid', aliases: [] },
    { name: 'Ethambutol', aliases: [] },
    { name: 'Pyrazinamid', aliases: [] },
    { name: 'Fluconazol', aliases: ['Diflucan'] },
    { name: 'Voriconazol', aliases: ['Vfend'] },
    { name: 'Posaconazol', aliases: ['Noxafil'] },
    { name: 'Isavuconazol', aliases: ['Cresemba'] },
    { name: 'Caspofungin', aliases: ['Cancidas'] },
    { name: 'Micafungin', aliases: ['Mycamine'] },
    { name: 'Anidulafungin', aliases: ['Ecalta'] },
    { name: 'Amphotericin B', aliases: ['AmBisome'] },
    { name: 'Nystatin', aliases: [] },
    { name: 'Aciclovir', aliases: ['Zovirax'] },
    { name: 'Valaciclovir', aliases: ['Valtrex'] },
    { name: 'Ganciclovir', aliases: ['Cymeven'] },
    { name: 'Valganciclovir', aliases: ['Valcyte'] },
    { name: 'Oseltamivir', aliases: ['Tamiflu'] },
    { name: 'Remdesivir', aliases: ['Veklury'] },
    { name: 'Nirmatrelvir/Ritonavir', aliases: ['Paxlovid'] }
];

// --- ÜBERGABE (nach I-PASS) ----------------------------------------------
// Einschätzung der Stabilität – der erste Satz jeder Übergabe.
const SEVERITY_LEVELS = [
    { key: 'stabil',      label: 'stabil',      short: 'S', tone: 'bg-green-100 text-green-800 border-green-300',   bar: '#16a34a' },
    { key: 'beobachtung', label: 'Beobachtung', short: 'B', tone: 'bg-amber-100 text-amber-900 border-amber-400',   bar: '#f59e0b' },
    { key: 'instabil',    label: 'instabil',    short: 'I', tone: 'bg-red-100 text-red-800 border-red-400',          bar: '#dc2626' }
];
