const fs = require('fs');
const path = require('path');
const strip = require('strip-comments');

const dirsToProcess = [
    path.join(__dirname, 'my-app', 'src'),
    path.join(__dirname, 'backend')
];

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        if (file === 'node_modules' || file === '.git') continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                // Check if the file actually has comments
                if (content.includes('//') || content.includes('/*')) {
                    // Strip comments but keep whitespace if possible, though strip-comments 
                    // will replace block comments with nothing, sometimes leaving blank lines.
                    // We can just use default settings.
                    const stripped = strip(content);
                    if (stripped !== content) {
                        fs.writeFileSync(fullPath, stripped, 'utf8');
                        console.log(`Stripped comments from: ${fullPath}`);
                    }
                }
            } catch (err) {
                console.error(`Error processing file ${fullPath}:`, err);
            }
        }
    }
}

dirsToProcess.forEach(dir => {
    console.log(`Processing directory: ${dir}`);
    processDirectory(dir);
});

console.log('Finished removing comments.');
