#!/bin/sh
# Erzeugt tailwind.css neu – nur nötig, wenn im HTML oder in den JS-Dateien
# NEUE Tailwind-Klassen dazukommen. Für den täglichen Gebrauch nicht erforderlich.
#
#   npm install --no-save tailwindcss@3
#   sh build_tailwind.sh
#
set -e
cd "$(dirname "$0")"
printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > .tailwind-input.css
npx tailwindcss -c tailwind.config.js -i .tailwind-input.css -o tailwind.css --minify
rm -f .tailwind-input.css
echo "tailwind.css neu erzeugt."
