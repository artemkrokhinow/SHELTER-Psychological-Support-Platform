const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/k/Desktop/nika1/my-app/src/components/views';

function processDir(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            // Remove the 'italic' class and 'font-style: italic;'
            content = content.replace(/\bitalic\b\s*/g, '');
            content = content.replace(/font-style:\s*italic;/g, '');
            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated', fullPath);
            }
        }
    }
}

processDir(dir);
console.log('Done');
