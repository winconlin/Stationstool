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
    { code: 'V_EGFRM1', label: 'eGFR' },
    { code: 'V_NA', label: 'Natrium' },
    { code: 'V_K', label: 'Kalium' }
];

// Relevante Änderungen im Verlauf – greifen auch dann, wenn der Wert noch im Normbereich liegt.
// drop/rise/change sind absolute Beträge in der Einheit des eigenen Labors (hier CRP in mg/dl!),
// dropPercent/risePercent sind prozentual. withinDays begrenzt das Zeitfenster.
const LAB_DELTA_RULES = [
    { code: 'V_HB',      label: 'Hb-Abfall',              drop: 2,           unit: 'g/dl',   withinDays: 3, severity: 'high',   note: 'Blutungsquelle?' },
    { code: 'V_KREA',    label: 'Kreatinin-Anstieg',      rise: 0.3,         unit: 'mg/dl',  withinDays: 2, severity: 'high',   note: 'AKI-Kriterium (KDIGO)' },
    { code: 'V_KREA',    label: 'Kreatinin-Verdopplung',  risePercent: 100,  unit: 'mg/dl',  withinDays: 7, severity: 'high',   note: 'AKI Stadium 2' },
    { code: 'V_NA',      label: 'Natrium-Änderung',       change: 8,         unit: 'mmol/l', withinDays: 1, severity: 'high',   note: 'Korrekturgeschwindigkeit prüfen' },
    { code: 'V_K',       label: 'Kalium-Änderung',        change: 1,         unit: 'mmol/l', withinDays: 1, severity: 'medium' },
    { code: 'V_THR',     label: 'Thrombozyten-Abfall',    dropPercent: 30,   unit: 'G/l',    withinDays: 3, severity: 'medium', note: 'HIT / Sepsis?' },
    { code: 'V_CRP',     label: 'CRP-Anstieg',            rise: 2,           unit: 'mg/dl',  withinDays: 2, severity: 'medium' },
    { code: 'V_CRP',     label: 'CRP-Verdopplung',        risePercent: 100,  unit: 'mg/dl',  withinDays: 2, severity: 'medium' },
    { code: 'V_EGFRM1',  label: 'eGFR-Abfall',            dropPercent: 25,   unit: 'ml/min', withinDays: 7, severity: 'medium' }
];

// Antibiotika: ab diesen Therapietagen wird zur Überprüfung der Dauer geraten.
const ABX_REVIEW_DAYS = { hint: 8, warn: 11 };
