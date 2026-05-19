import os

file_path = "Station.html"

with open(file_path, "r") as f:
    content = f.read()

# 1. Add getAnticoagulationStatus helper in the script tag
helper_script = """
        function parseEgfr(egfrStr) {
            if (!egfrStr) return null;
            let m = egfrStr.match(/\\d+/);
            if (m) return parseInt(m[0], 10);
            return null;
        }

        function getAnticoagulationStatus(p) {
            let statusText = "Keine Antikoagulation";
            let warnings = [];
            let isCurrent = (med) => p.meds_current && p.meds_current.toLowerCase().includes(med.toLowerCase());

            // Define categories
            let oaks = ["Apixaban", "Eliquis", "Rivaroxaban", "Xarelto", "Edoxaban", "Lixiana", "Dabigatran", "Pradaxa", "Marcumar", "Phenprocoumon"];
            let heparins = ["Enoxaparin", "Clexane", "Certoparin", "Mono-Embolex", "Fondaparinux", "Arixtra", "Heparin", "Liquemin", "Dalteparin", "Fragmin", "Nadroparin", "Fraxiparine"];
            let antiplatelets = ["ASS", "Aspirin", "Clopidogrel", "Plavix", "Prasugrel", "Efient", "Ticagrelor", "Brilique"];

            let foundOaks = oaks.filter(isCurrent);
            let foundHeparins = heparins.filter(isCurrent);
            let foundAntiplatelets = antiplatelets.filter(isCurrent);

            let hasOak = foundOaks.length > 0;
            let hasHeparin = foundHeparins.length > 0;
            let aptCount = foundAntiplatelets.length;

            // Warnings
            if (foundOaks.length > 1) warnings.push("⚠️ " + foundOaks.length + " NOAKs/OAKs!");
            if (foundHeparins.length > 1) warnings.push("⚠️ " + foundHeparins.length + " Heparine!");
            if (hasOak && hasHeparin) warnings.push("⚠️ OAK + Heparin");

            // Status Logic
            if (hasOak && aptCount == 1) statusText = "OAK + SAPT";
            else if (hasOak && aptCount > 1) statusText = "Triple (OAK + DAPT)";
            else if (hasOak) statusText = "OAK (" + foundOaks[0] + ")";
            else if (hasHeparin && aptCount == 1) statusText = "Heparin + SAPT";
            else if (hasHeparin && aptCount > 1) statusText = "Heparin + DAPT";
            else if (hasHeparin) statusText = "Heparin (" + foundHeparins[0] + ")";
            else if (aptCount == 1) statusText = "SAPT (" + foundAntiplatelets[0] + ")";
            else if (aptCount > 1) statusText = "DAPT (" + foundAntiplatelets.join(" + ") + ")";

            return { status: statusText, warnings: warnings };
        }
"""

content = content.replace("function updateDeepField(id, obj, field, val)", helper_script + "\n        function updateDeepField(id, obj, field, val)")

with open(file_path, "w") as f:
    f.write(content)
print("done")
