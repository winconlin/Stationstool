(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.MedSafety = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    // Wirkstoffklassen. "duplicate" sagt, wie schwer eine Doppelung derselben Klasse wiegt
    // (false = eine Doppelung ist hier normal, etwa bei Vitaminen oder Laxanzien).
    const MED_CLASSES = [
        { name: "ACE-Hemmer", duplicate: "high", members: ["Ramipril", "Enalapril", "Lisinopril", "Captopril", "Perindopril", "Benazepril", "Quinapril", "Fosinopril"] },
        { name: "ARB", duplicate: "high", members: ["Candesartan", "Valsartan", "Losartan", "Irbesartan", "Olmesartan", "Telmisartan", "Eprosartan"] },
        { name: "ARNI", duplicate: "high", members: ["Entresto", "Sacubitril"] },
        { name: "Betablocker", duplicate: "medium", members: ["Bisoprolol", "Metoprolol", "Carvedilol", "Nebivolol", "Propanolol", "Propranolol", "Atenolol", "Esmolol", "Timolol", "Sotalol"] },
        { name: "Calciumantagonist (Dihydropyridin)", duplicate: "medium", members: ["Amlodipin", "Lercanidipin", "Nifedipin", "Nitrendipin", "Felodipin"] },
        { name: "Calciumantagonist (Verapamil-Typ)", duplicate: "high", members: ["Verapamil", "Diltiazem"] },
        { name: "MRA", duplicate: "high", members: ["Spironolacton", "Eplerenon", "Finerenon"] },
        { name: "Schleifendiuretikum", duplicate: "medium", members: ["Furosemid", "Torasemid", "Bumetanid", "Piretanid"] },
        { name: "Thiazid / thiazidartig", duplicate: "high", members: ["Hydrochlorothiazid", "HCT", "Chlortalidon", "Xipamid", "Indapamid"] },
        { name: "SGLT2-Hemmer", duplicate: "high", members: ["Dapagliflozin", "Empagliflozin", "Ertugliflozin", "Canagliflozin", "Dapaglifozin"] },
        { name: "DPP4-Hemmer", duplicate: "high", members: ["Sitagliptin", "Saxagliptin", "Linagliptin", "Vildagliptin"] },
        { name: "GLP1-Agonist", duplicate: "high", members: ["Semaglutid", "Dulaglutid", "Liraglutid", "Exenatid", "Tirzepatid"] },
        { name: "Sulfonylharnstoff", duplicate: "high", members: ["Glimepirid", "Glibenclamid", "Gliclazid"] },
        { name: "Biguanid", duplicate: "high", members: ["Metformin"] },
        { name: "Insulin", duplicate: false, members: ["Insulin", "Huminsulin", "Actrapid", "Lantus", "Toujeo", "Levemir", "Tresiba", "Humalog", "Novorapid", "Apidra"] },
        { name: "OAK (DOAK)", duplicate: "high", members: ["Apixaban", "Rivaroxaban", "Edoxaban", "Dabigatran"] },
        { name: "OAK (VKA)", duplicate: "high", members: ["Marcumar", "Phenprocoumon", "Warfarin"] },
        { name: "Heparin / NMH", duplicate: "high", members: ["Heparin", "Certoparin", "Enoxaparin", "Dalteparin", "Tinzaparin", "Nadroparin", "Fondaparinux", "Argatroban"] },
        { name: "TAH", duplicate: false, members: ["ASS", "Acetylsalicylsäure", "Clopidogrel", "Ticagrelor", "Prasugrel"] },
        { name: "NSAR", duplicate: "high", members: ["Ibuprofen", "Diclofenac", "Naproxen", "Indometacin", "Etoricoxib", "Celecoxib", "Dexketoprofen", "Acemetacin"] },
        { name: "Opioid", duplicate: false, members: ["Morphin", "Oxycodon", "Hydromorphon", "Fentanyl", "Buprenorphin", "Tilidin", "Tramadol", "Tapentadol", "Piritramid", "Codein", "Targin", "Methadon"] },
        { name: "Statin", duplicate: "high", members: ["Atorvastatin", "Rosuvastatin", "Simvastatin", "Pravastatin", "Fluvastatin", "Lovastatin"] },
        { name: "PPI", duplicate: "high", members: ["Pantoprazol", "Omeprazol", "Esomeprazol", "Lansoprazol", "Rabeprazol"] },
        { name: "Benzodiazepin", duplicate: "high", members: ["Lorazepam", "Diazepam", "Midazolam", "Oxazepam", "Clonazepam", "Bromazepam", "Alprazolam"] },
        { name: "Z-Substanz", duplicate: "high", members: ["Zopiclon", "Zolpidem", "Zaleplon"] },
        { name: "Antipsychotikum", duplicate: "medium", members: ["Haloperidol", "Risperidon", "Quetiapin", "Olanzapin", "Clozapin", "Aripiprazol", "Melperon", "Pipamperon", "Promethazin", "Amisulprid"] },
        { name: "SSRI", duplicate: "high", members: ["Citalopram", "Escitalopram", "Sertralin", "Fluoxetin", "Paroxetin", "Fluvoxamin"] },
        { name: "SNRI", duplicate: "high", members: ["Duloxetin", "Venlafaxin"] },
        { name: "Trizyklikum / tetrazyklisch", duplicate: "high", members: ["Amitriptylin", "Doxepin", "Opipramol", "Trimipramin", "Mirtazapin", "Trazodon"] },
        { name: "Antiarrhythmikum", duplicate: "high", members: ["Amiodaron", "Dronedaron", "Flecainid", "Propafenon", "Sotalol"] },
        { name: "Digitalis", duplicate: "high", members: ["Digitoxin", "Digoxin"] },
        { name: "Alpha-1-Blocker", duplicate: "medium", members: ["Doxazosin", "Tamsulosin", "Alfuzosin", "Urapidil", "Terazosin", "Silodosin"] },
        { name: "Kalium-Substitution", duplicate: "medium", members: ["Kalium", "Kalinor", "Kaliumchlorid"] },
        { name: "Glukokortikoid", duplicate: "medium", members: ["Prednisolon", "Prednison", "Dexamethason", "Hydrocortison", "Methylprednisolon"] },
        { name: "Schilddrüsenhormon", duplicate: "high", members: ["L-Thyroxin", "Levothyroxin", "Euthyrox"] },
        { name: "Vitamin D", duplicate: false, members: ["Colecalciferol", "Dekristol", "Vigantol", "Calcitriol", "Alfacalcidol"] },
        { name: "Laxans", duplicate: false, members: ["Macrogol", "Movicol", "Lactulose", "Laxoberal", "Bisacodyl", "Natrium Picosulfat", "Mukofalk"] },
        { name: "Nicht-Opioid-Analgetikum", duplicate: false, members: ["Metamizol", "Novalgin", "Novaminsulfon", "Paracetamol"] },
        { name: "Allopurinol / Urikostatikum", duplicate: "high", members: ["Allopurinol", "Febuxostat"] },
        { name: "Kaliumbinder", duplicate: "medium", members: ["Lokelma", "Polystyrolsulfonat", "Resonium", "Patiromer"] }
    ];

    // Dosisanpassung bzw. Kontraindikation nach Nierenfunktion (eGFR in ml/min).
    // Die niedrigste erfüllte Schwelle gewinnt. Nur Hinweise – keine Dosierungsempfehlung.
    const RENAL_RULES = [
        { name: "Metformin", below: 30, severity: "high", action: "kontraindiziert", note: "Laktatazidose-Risiko" },
        { name: "Metformin", below: 45, severity: "medium", action: "Dosis reduzieren, max. 1000 mg/d" },
        { name: "Apixaban", below: 15, severity: "high", action: "nicht empfohlen" },
        { name: "Apixaban", below: 30, severity: "medium", action: "Dosisreduktion prüfen (2x2,5 mg)" },
        { name: "Rivaroxaban", below: 15, severity: "high", action: "kontraindiziert" },
        { name: "Rivaroxaban", below: 50, severity: "medium", action: "Dosisreduktion prüfen (15 mg)" },
        { name: "Edoxaban", below: 15, severity: "high", action: "kontraindiziert" },
        { name: "Edoxaban", below: 50, severity: "medium", action: "Dosisreduktion auf 30 mg" },
        { name: "Dabigatran", below: 30, severity: "high", action: "kontraindiziert" },
        { name: "Dabigatran", below: 50, severity: "medium", action: "Dosisreduktion prüfen" },
        { name: "Enoxaparin", below: 30, severity: "medium", action: "Dosis halbieren, Anti-Xa erwägen" },
        { name: "Certoparin", below: 30, severity: "medium", action: "Kumulation möglich, Dosis prüfen" },
        { name: "Dalteparin", below: 30, severity: "medium", action: "Anti-Xa-Kontrolle erwägen" },
        { name: "Fondaparinux", below: 30, severity: "high", action: "kontraindiziert" },
        { name: "Dapagliflozin", below: 25, severity: "medium", action: "Beginn nicht empfohlen, laufende Therapie prüfen" },
        { name: "Empagliflozin", below: 20, severity: "medium", action: "Beginn nicht empfohlen" },
        { name: "Sitagliptin", below: 45, severity: "medium", action: "Dosis auf 50 mg, unter 30 auf 25 mg" },
        { name: "Glimepirid", below: 30, severity: "high", action: "vermeiden – Hypoglykämiegefahr" },
        { name: "Spironolacton", below: 30, severity: "high", action: "vermeiden – Hyperkaliämie" },
        { name: "Eplerenon", below: 30, severity: "high", action: "vermeiden – Hyperkaliämie" },
        { name: "Finerenon", below: 25, severity: "medium", action: "Beginn nicht empfohlen" },
        { name: "Hydrochlorothiazid", below: 30, severity: "medium", action: "unwirksam – auf Schleifendiuretikum wechseln" },
        { name: "HCT", below: 30, severity: "medium", action: "unwirksam – auf Schleifendiuretikum wechseln" },
        { name: "Chlortalidon", below: 30, severity: "medium", action: "unwirksam – auf Schleifendiuretikum wechseln" },
        { name: "Ibuprofen", below: 60, severity: "high", action: "NSAR bei Niereninsuffizienz vermeiden" },
        { name: "Diclofenac", below: 60, severity: "high", action: "NSAR bei Niereninsuffizienz vermeiden" },
        { name: "Naproxen", below: 60, severity: "high", action: "NSAR bei Niereninsuffizienz vermeiden" },
        { name: "Etoricoxib", below: 60, severity: "high", action: "NSAR bei Niereninsuffizienz vermeiden" },
        { name: "Nitrofurantoin", below: 45, severity: "high", action: "kontraindiziert" },
        { name: "Allopurinol", below: 30, severity: "medium", action: "Dosis reduzieren (max. 100 mg/d)" },
        { name: "Colchicin", below: 30, severity: "medium", action: "Dosis reduzieren" },
        { name: "Morphin", below: 30, severity: "medium", action: "Metabolite kumulieren – Dosis/Intervall anpassen" },
        { name: "Pregabalin", below: 60, severity: "medium", action: "Dosis nach eGFR anpassen" },
        { name: "Gabapentin", below: 60, severity: "medium", action: "Dosis nach eGFR anpassen" },
        { name: "Levetiracetam", below: 50, severity: "medium", action: "Dosis nach eGFR anpassen" },
        { name: "Digoxin", below: 50, severity: "medium", action: "Dosis reduzieren, Spiegel kontrollieren" },
        { name: "Methotrexat", below: 45, severity: "high", action: "vermeiden – Kumulation" },
        { name: "Cotrimoxazol", below: 30, severity: "medium", action: "Dosis halbieren, Kalium beachten" },
        { name: "Vancomycin", below: 50, severity: "medium", action: "Spiegelsteuerung zwingend" },
        { name: "Gentamicin", below: 60, severity: "high", action: "nephrotoxisch – Spiegel und Indikation prüfen" },
        { name: "Aciclovir", below: 50, severity: "medium", action: "Dosisintervall verlängern" },
        { name: "Sotalol", below: 60, severity: "medium", action: "Dosis reduzieren – QT-Verlängerung" },
        { name: "Bisoprolol", below: 20, severity: "medium", action: "max. 10 mg/d" }
    ];

    // Kombinationen, die auffallen sollen. allOf/anyOf/minCount beziehen sich auf Wirkstoffklassen.
    const COMBINATION_RULES = [
        { id: "ras-dual", severity: "high", allOf: ["ACE-Hemmer", "ARB"],
          title: "Duale RAS-Blockade", note: "ACE-Hemmer und ARB zusammen: Hyperkaliämie und Nierenversagen – nicht empfohlen." },
        { id: "arni-ace", severity: "high", allOf: ["ARNI", "ACE-Hemmer"],
          title: "ARNI plus ACE-Hemmer", note: "Angioödem-Risiko; zwischen den Substanzen 36 h Pause einhalten." },
        { id: "arni-arb", severity: "medium", allOf: ["ARNI", "ARB"],
          title: "ARNI plus ARB", note: "Doppelte RAS-Blockade – Indikation prüfen." },
        { id: "triple-whammy", severity: "high", allOf: ["NSAR", "Schleifendiuretikum"], anyOf: ["ACE-Hemmer", "ARB"],
          title: "Triple Whammy", note: "NSAR plus Diuretikum plus RAS-Blocker: hohes Risiko für akutes Nierenversagen." },
        { id: "kalium-trio", severity: "medium", minCount: 2, anyOf: ["MRA", "Kalium-Substitution"], withAny: ["ACE-Hemmer", "ARB", "ARNI"],
          title: "Mehrfache Kaliumbelastung", note: "Kaliumsparende Substanzen kombiniert – Kalium engmaschig kontrollieren." },
        { id: "oak-oak", severity: "high", minCount: 2, anyOf: ["OAK (DOAK)", "OAK (VKA)", "Heparin / NMH"],
          title: "Mehrfache Antikoagulation", note: "Zwei antikoagulierende Prinzipien gleichzeitig – ist die Überlappung gewollt?" },
        { id: "triple-therapy", severity: "high", allOf: ["TAH"], withAny: ["OAK (DOAK)", "OAK (VKA)"], minTah: 2,
          title: "Triple-Therapie", note: "OAK plus zwei Thrombozytenaggregationshemmer – Dauer begrenzen, PPI geben." },
        { id: "oak-tah", severity: "medium", allOf: ["TAH"], withAny: ["OAK (DOAK)", "OAK (VKA)"],
          title: "OAK plus TAH", note: "Blutungsrisiko erhöht – Indikation und Dauer dokumentieren." },
        { id: "nsar-oak", severity: "high", allOf: ["NSAR"], withAny: ["OAK (DOAK)", "OAK (VKA)", "Heparin / NMH", "TAH"],
          title: "NSAR plus Antikoagulation", note: "Deutlich erhöhtes Blutungsrisiko – NSAR möglichst absetzen." },
        { id: "betablocker-verapamil", severity: "high", allOf: ["Betablocker", "Calciumantagonist (Verapamil-Typ)"],
          title: "Betablocker plus Verapamil/Diltiazem", note: "Bradykardie und AV-Block – Kombination vermeiden." },
        { id: "qt", severity: "medium", minCount: 2, distinctClasses: true, anyOf: ["Antiarrhythmikum", "Antipsychotikum", "SSRI"],
          title: "QT-verlängernde Kombination", note: "Mehrere QT-verlängernde Substanzen – EKG und Elektrolyte kontrollieren." },
        { id: "serotonin", severity: "medium", minCount: 2, distinctClasses: true, anyOf: ["SSRI", "SNRI", "Trizyklikum / tetrazyklisch", "Opioid"],
          title: "Serotonerge Kombination", note: "Serotonin-Syndrom möglich – auf Klinik achten (Tramadol besonders)." },
        { id: "sedation", severity: "medium", minCount: 2, distinctClasses: true, anyOf: ["Benzodiazepin", "Z-Substanz", "Opioid", "Antipsychotikum"],
          title: "Mehrfache Sedierung", note: "Sturz- und Delirrisiko, besonders bei älteren Patienten." },
        { id: "diuretika-trio", severity: "medium", minCount: 2, distinctClasses: true, anyOf: ["Schleifendiuretikum", "Thiazid / thiazidartig"],
          title: "Sequenzielle Nephronblockade", note: "Schleifendiuretikum plus Thiazid – Elektrolyte und Volumenstatus engmaschig kontrollieren." },
        { id: "statin-amiodaron", severity: "medium", allOf: ["Statin", "Antiarrhythmikum"],
          title: "Statin plus Amiodaron/Dronedaron", note: "Myopathierisiko – Simvastatin-Dosis begrenzen." },
        { id: "digitalis-verapamil", severity: "high", allOf: ["Digitalis", "Calciumantagonist (Verapamil-Typ)"],
          title: "Digitalis plus Verapamil", note: "Digitalisspiegel steigt – Spiegel kontrollieren." },
        { id: "digitalis-amiodaron", severity: "high", allOf: ["Digitalis", "Antiarrhythmikum"],
          title: "Digitalis plus Amiodaron", note: "Digitalisspiegel steigt deutlich – Dosis halbieren und Spiegel messen." }
    ];

    // Laborwert plus passende Medikation – erst zusammen ergibt es einen Hinweis.
    const LAB_CONTEXT_RULES = [
        { id: "hyperkaliaemie", code: "V_K", status: "high", severity: "high", labelIncludes: "kalium",
          classes: ["MRA", "ACE-Hemmer", "ARB", "ARNI", "Kalium-Substitution"],
          title: "Hyperkaliämie unter kaliumsteigernder Medikation", note: "Substanzen pausieren und Kalium kurzfristig kontrollieren." },
        { id: "hypokaliaemie", code: "V_K", status: "low", severity: "medium", labelIncludes: "kalium",
          classes: ["Schleifendiuretikum", "Thiazid / thiazidartig", "Glukokortikoid"],
          title: "Hypokaliämie unter Diuretikum", note: "Substituieren und Magnesium mitbestimmen." },
        { id: "hyponatriaemie", code: "V_NA", status: "low", numBelow: 132, severity: "medium", labelIncludes: "natrium",
          classes: ["Thiazid / thiazidartig", "SSRI", "SNRI", "Trizyklikum / tetrazyklisch"],
          title: "Hyponatriämie unter auslösender Medikation", note: "Thiazid und SSRI sind häufige Ursachen – Medikation prüfen." },
        { id: "nierenversagen", code: "V_KREA", status: "high", requiresDelta: "V_KREA", deltaDirection: "up",
          severity: "high", labelIncludes: "kreatinin",
          classes: ["NSAR", "ACE-Hemmer", "ARB", "ARNI", "Schleifendiuretikum"],
          title: "Steigendes Kreatinin unter nephroaktiver Medikation", note: "Dosis anpassen, NSAR absetzen, Volumenstatus prüfen." },
        { id: "anaemie-oak", code: "V_HB", status: "low", numBelow: 10, severity: "high", labelIncludes: "hamoglobin",
          classes: ["OAK (DOAK)", "OAK (VKA)", "Heparin / NMH", "TAH", "NSAR"],
          title: "Anämie unter Antikoagulation", note: "Blutungsquelle suchen, Indikation überprüfen." },
        { id: "thrombopenie-heparin", code: "V_THR", status: "low", numBelow: 150, severity: "high", labelIncludes: "thrombozyt",
          classes: ["Heparin / NMH"], title: "Thrombopenie unter Heparin", note: "HIT bedenken – Thrombozytenverlauf und 4T-Score prüfen." },
        { id: "hypoglykaemie", code: "V_GLUC", status: "low", severity: "high", labelIncludes: "glucose",
          classes: ["Insulin", "Sulfonylharnstoff", "Biguanid"], title: "Hypoglykämie unter antidiabetischer Therapie", note: "Dosis reduzieren." },
        { id: "transaminasen-statin", code: "V_GPT", status: "high", numAbove: 100, severity: "medium", labelIncludes: "gpt",
          classes: ["Statin"], title: "Transaminasen über dem Dreifachen unter Statin", note: "Verlauf kontrollieren, andere Ursachen bedenken." },
        { id: "ck-statin", code: "V_CK", status: "high", numAbove: 400, severity: "high", labelIncludes: "creatinkinase",
          classes: ["Statin"], title: "CK-Anstieg unter Statin", note: "Myopathie bzw. Rhabdomyolyse ausschließen." },
        { id: "hypercalciaemie", code: "V_CA", status: "high", numAbove: 2.6, severity: "medium", labelIncludes: "calcium",
          classes: ["Vitamin D", "Thiazid / thiazidartig"], title: "Hyperkalzämie unter Vitamin D oder Thiazid", note: "Substitution pausieren." }
    ];

    function normalize(value) {
        return (value || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
    }

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // Treffer am Wortanfang, damit "ASS" nicht in "Wasser" steckt.
    function mentions(text, term) {
        if (!text || !term) return false;
        return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalize(term))}`).test(normalize(text));
    }

    // Welche Klassen mit welchen Wirkstoffen in der Medikation stehen.
    function classify(text) {
        const found = {};
        MED_CLASSES.forEach((group) => {
            const hits = group.members.filter((member) => mentions(text, member));
            if (hits.length) found[group.name] = [...new Set(hits)];
        });
        return found;
    }

    function parseEgfr(value) {
        const match = String(value === null || value === undefined ? "" : value).match(/-?\d+(?:[.,]\d+)?/);
        return match ? Number(match[0].replace(",", ".")) : null;
    }

    function checkRenal(text, egfrValue, options) {
        const settings = options || {};
        const egfr = typeof egfrValue === "number" ? egfrValue : parseEgfr(egfrValue);
        if (egfr === null || !Number.isFinite(egfr)) return [];
        const best = new Map();
        RENAL_RULES.forEach((rule) => {
            if (egfr >= rule.below || !mentions(text, rule.name)) return;
            const kept = best.get(rule.name);
            if (!kept || rule.below < kept.below) best.set(rule.name, rule);
        });
        return [...best.values()].map((rule) => ({
            id: `renal-${normalize(rule.name).replace(/ /g, "-")}${settings.paused ? "-pausiert" : ""}`,
            kind: "renal",
            // Ein pausiertes Präparat ist kein akutes Problem, aber bei Wiederbeginn relevant.
            severity: settings.paused ? (rule.severity === "high" ? "medium" : "low") : rule.severity,
            paused: Boolean(settings.paused),
            title: `${rule.name}${settings.paused ? " (pausiert)" : ""} bei eGFR ${egfr}`,
            text: rule.action,
            note: rule.note || "",
            substances: [rule.name]
        }));
    }

    function checkCombinations(text) {
        const classes = classify(text);
        const present = (name) => Boolean(classes[name]);
        const warnings = [];

        // Doppelungen innerhalb einer Klasse
        MED_CLASSES.forEach((group) => {
            if (!group.duplicate) return;
            const hits = classes[group.name] || [];
            if (hits.length < 2) return;
            warnings.push({
                id: `dup-${normalize(group.name).replace(/ /g, "-")}`,
                kind: "duplicate",
                severity: group.duplicate,
                title: `Doppelt: ${group.name}`,
                text: hits.join(" + "),
                note: group.note || "Zwei Substanzen derselben Klasse – gewollt?",
                substances: hits
            });
        });

        COMBINATION_RULES.forEach((rule) => {
            const involved = [];
            if (rule.allOf && !rule.allOf.every(present)) return;
            (rule.allOf || []).forEach((name) => involved.push(...classes[name]));

            if (rule.anyOf) {
                const matching = rule.anyOf.filter(present);
                if (rule.minCount) {
                    // distinctClasses: nur verschiedene Klassen zählen, weil die Doppelung
                    // innerhalb einer Klasse schon eigens gemeldet wird.
                    const substanceCount = rule.distinctClasses ? 0
                        : matching.reduce((sum, name) => sum + classes[name].length, 0);
                    if (matching.length < rule.minCount && substanceCount < rule.minCount) return;
                } else if (!matching.length) return;
                matching.forEach((name) => involved.push(...classes[name]));
            }
            if (rule.withAny) {
                const matching = rule.withAny.filter(present);
                if (!matching.length) return;
                matching.forEach((name) => involved.push(...classes[name]));
            }
            // Triple-Therapie verlangt zwei Thrombozytenaggregationshemmer.
            if (rule.minTah && (classes["TAH"] || []).length < rule.minTah) return;

            warnings.push({
                id: rule.id,
                kind: "combination",
                severity: rule.severity,
                title: rule.title,
                text: [...new Set(involved)].join(" + "),
                note: rule.note || "",
                substances: [...new Set(involved)]
            });
        });
        return warnings;
    }

    function matchesCode(entry, rule) {
        const bare = (code) => normalize(code).replace(/^(v|rm)\s/, "");
        if (rule.code && bare(entry.code) === bare(rule.code)) return true;
        return Boolean(rule.labelIncludes) && normalize(entry.label).includes(normalize(rule.labelIncludes));
    }

    function checkLabContext(entries, text, deltas) {
        const classes = classify(text);
        const warnings = [];
        const bare = (code) => normalize(code).replace(/^(v|rm)\s/, "");
        LAB_CONTEXT_RULES.forEach((rule) => {
            const entry = (entries || []).find((item) => matchesCode(item, rule) && item.status === rule.status);
            if (!entry) return;
            // Grenzwertige Werte sollen nicht jeden Tag eine Warnung erzeugen.
            const num = typeof entry.num === "number" ? entry.num : parseEgfr(entry.value);
            if (rule.numBelow !== undefined && !(num !== null && num < rule.numBelow)) return;
            if (rule.numAbove !== undefined && !(num !== null && num > rule.numAbove)) return;
            // Manche Hinweise ergeben nur Sinn, wenn der Wert sich auch bewegt.
            if (rule.requiresDelta && !(deltas || []).some((warning) =>
                bare(warning.code) === bare(rule.requiresDelta)
                && (!rule.deltaDirection || warning.direction === rule.deltaDirection))) return;
            const involved = rule.classes.filter((name) => classes[name]).flatMap((name) => classes[name]);
            if (!involved.length) return;
            warnings.push({
                id: rule.id,
                kind: "labcontext",
                severity: rule.severity,
                title: rule.title,
                text: `${entry.label} ${entry.value}${entry.unit ? " " + entry.unit : ""} ${rule.status === "high" ? "↑" : "↓"} bei ${[...new Set(involved)].join(" + ")}`,
                note: rule.note || "",
                substances: [...new Set(involved)]
            });
        });
        return warnings;
    }

    // Alle Prüfungen auf einmal, nach Schweregrad sortiert.
    function check(input) {
        const data = input || {};
        const text = data.meds || "";
        const all = [
            ...checkRenal(text, data.egfr),
            ...checkRenal(data.medsPaused || "", data.egfr, { paused: true }),
            ...checkCombinations(text),
            ...checkLabContext(data.labEntries || [], text, data.labDeltas || [])
        ];
        const rank = { high: 2, medium: 1, low: 0 };
        return all.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
    }

    return { MED_CLASSES, RENAL_RULES, COMBINATION_RULES, LAB_CONTEXT_RULES,
        classify, checkRenal, checkCombinations, checkLabContext, check, parseEgfr, mentions, normalize };
});
