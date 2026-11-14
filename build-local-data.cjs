const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname, 'dist/assets');
const data = Object.fromEntries(['i18n', 'gifts'].map(name => [name, JSON.parse(fs.readFileSync(path.join(base, 'data', name + '.json'), 'utf8'))]));
fs.writeFileSync(path.join(base, 'local-data.js'), '// Generated from assets/data/*.json for double-click offline use.\nwindow.GiftQuestLocalData = ' + JSON.stringify(data) + ';\n');
