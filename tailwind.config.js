module.exports = {
  content: [
    './*.html',
    './*.js'
  ],
  safelist: [
    // Klassen, die erst zur Laufzeit aus den Konfigurationsdateien kommen.
    { pattern: /^(bg|text|border)-(slate|gray|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900)$/ },
    'animate-pulse', 'hidden', 'line-through', 'italic', 'uppercase', 'normal-case', 'truncate'
  ],
  theme: { extend: {} },
  plugins: []
};
