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
