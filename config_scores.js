// --- config_scores.js ---
function getAgeNum(dob) {
    if(!dob) return 0;
    const today = new Date(); const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

function hasKw(p, keywords) {
    const text = (p.diagnosis + " " + p.history + " " + p.meds_current).toLowerCase();
    return keywords.some(k => text.includes(k));
}

const SCORE_DEFINITIONS = [
    { id: "cha2ds2", name: "CHA₂DS₂-VASc", info: "Schlaganfallrisiko bei VHF", url: "https://www.mdcalc.com/calc/801/cha2ds2-vasc-score-atrial-fibrillation-stroke-risk", check: (p) => hasKw(p, ["vhf", "vorhof", "flimmern", "arrhythmie", "pvi", "ablation"]) },
    { id: "hasbled", name: "HAS-BLED", info: "Blutungsrisiko unter OAK", url: "https://www.mdcalc.com/calc/807/has-bled-score-major-bleeding-risk", check: (p) => hasKw(p, ["vhf", "vorhof", "marcumar", "apixaban", "eliquis", "xarelto", "lixiana", "edoxaban", "pradaxa", "oak", "noak"]) },
    { id: "score2", name: "SCORE2 (Risk Chart)", info: "10-Jahres CVD Risiko (Prävention)", url: "https://u-prevent.com/calculators/score2", check: (p) => { const age = getAgeNum(p.dob); return (age >= 40 && age < 70) && !hasKw(p, ["khk", "stent", "infarkt", "bypass", "diabetes", "dm ", "insulin"]); } },
    { id: "score2op", name: "SCORE2-OP", info: "CVD Risiko für Ältere (70+)", url: "https://u-prevent.com/calculators/score2", check: (p) => getAgeNum(p.dob) >= 70 && !hasKw(p, ["khk", "stent", "infarkt", "bypass"]) },
    { id: "nyha", name: "NYHA-Klassifikation", info: "Schweregrad Herzinsuffizienz", url: "https://flexikon.doccheck.com/de/NYHA-Klassifikation", check: (p) => hasKw(p, ["insuffizienz", "hfpef", "hfmref", "hfref", "pumpfunktion", "kardiomyopathie", "cmp", "lasix", "furo", "torasemid"]) },
    { id: "ehra", name: "EHRA-Score", info: "Symptomatik bei VHF", url: "https://flexikon.doccheck.com/de/EHRA-Klassifikation", check: (p) => hasKw(p, ["vhf", "vorhof", "flimmern"]) },
    { id: "wells", name: "Wells-Score", info: "Wahrscheinlichkeit TVT/LAE", url: "https://www.mdcalc.com/calc/362/wells-criteria-pulmonary-embolism", check: (p) => hasKw(p, ["tvt", "lae", "thrombose", "embolie", "schwellung", "dyspnoe", "atemnot"]) },
    { id: "curb65", name: "CURB-65", info: "Pneumonie Schweregrad", url: "https://www.mdcalc.com/calc/324/curb-65-score-pneumonia-severity", check: (p) => hasKw(p, ["pneumonie", "lunge", "infekt", "fieber", "husten", "copd"]) },
    { id: "rcri", name: "RCRI (Lee-Index)", info: "Kardiales OP-Risiko", url: "https://www.mdcalc.com/calc/1725/revised-cardiac-risk-index-lee-criteria", check: (p) => hasKw(p, ["op", "prä", "vorbereit", "konsil", "narkose", "hüfte", "knie", "tep"]) },
    { id: "qsofa", name: "qSOFA", info: "Sepsis Screening", url: "https://www.mdcalc.com/calc/1654/qsofa-quick-sofa-score-sepsis", check: (p) => hasKw(p, ["infekt", "fieber", "sepsis", "hwi", "pneumonie", "staph", "strept", "e. coli", "antibiot"]) },
    { id: "child", name: "Child-Pugh-Score", info: "Leberzirrhose Prognose", url: "https://www.mdcalc.com/calc/29/child-pugh-score-cirrhosis-mortality", check: (p) => hasKw(p, ["leber", "zirrhose", "c2", "alkohol", "aszites", "hepatitis", "hepa"]) },
    { id: "bmi", name: "BMI Rechner", info: "Body Mass Index", url: "https://www.tk.de/service/form/2034948/bmirechner.form", check: (p) => true }
];