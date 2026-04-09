// --- config_exam.js ---
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