const fs = require('fs');
const file = 'my-app/src/components/characterCompanion/CharacterCompanion.jsx';
let content = fs.readFileSync(file, 'utf8');

// Also remove from backend files and other left-overs
const leftovers = [
    'backend/dump_to_root.js',
    'backend/shorten_scenarios_db.js',
    'fix-guest.js',
    'my-app/src/components/characterCompanion/CharacterCompanion.jsx'
];

leftovers.forEach(f => {
    if(fs.existsSync(f)) {
        let text = fs.readFileSync(f, 'utf8');
        // Match // ... till end of line, but only if not preceded by : (to avoid http://)
        text = text.replace(/(?<!:)\/\/.*/g, '');
        fs.writeFileSync(f, text, 'utf8');
    }
});

console.log('Comments removed.');
