const fs = require('fs');
const path = require('path');

const API_BASE = 'https://shelter-jsv0.onrender.com/api';
const OUTPUT_PATH = path.join(__dirname, '../src/locales/db_en.json');

// Helper to translate text using Google Translate's free public endpoint
async function translateText(text) {
    if (!text || typeof text !== 'string') return text;
    
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        let translated = '';
        if (data && data[0]) {
            for (let i = 0; i < data[0].length; i++) {
                translated += data[0][i][0];
            }
        }
        return translated || text;
    } catch (err) {
        console.error(`Translation failed for: "${text.substring(0, 30)}..."`, err.message);
        return text;
    }
}

async function translateHTML(html) {
    if (!html) return html;
    return await translateText(html);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('Starting DB translation script...');
    const result = {
        materials: {},
        scenarios: {},
        diagnostics: {},
        advice: {}
    };

    try {
        // 1. Translate Materials
        console.log('Fetching materials...');
        const matRes = await fetch(`${API_BASE}/materials`);
        const materials = await matRes.json();
        console.log(`Found ${materials.length} materials.`);
        
        for (let m of materials) {
            console.log(`Translating Material: ${m.title}`);
            result.materials[m._id] = {
                title: await translateText(m.title),
                desc: await translateText(m.desc),
                content: await translateHTML(m.content)
            };
            await delay(500);
        }

        // 2. Translate Scenarios
        console.log('Fetching scenarios...');
        const scenRes = await fetch(`${API_BASE}/scenarios`);
        const scenarios = await scenRes.json();
        console.log(`Found ${scenarios.length} scenarios.`);

        for (let s of scenarios) {
            const scenarioName = s.name || s.title;
            console.log(`Translating Scenario: ${scenarioName}`);
            const translatedScenario = {
                name: await translateText(s.name),
                title: await translateText(s.title),
                description: await translateText(s.description),
                messages: [],
                nodes: []
            };

            if (s.nodes) {
                for (let [nodeKey, node] of Object.entries(s.nodes)) {
                    const translatedNode = {
                        text: await translateText(node.text),
                        options: []
                    };
                    if (node.options) {
                        for (let opt of node.options) {
                            translatedNode.options.push({
                                text: await translateText(opt.text),
                                feedback: await translateText(opt.feedback),
                                nextId: opt.nextId,
                                points: opt.points
                            });
                            await delay(200);
                        }
                    }
                    Object.assign(translatedNode, {
                        id: node.id,
                        type: node.type,
                        isEnd: node.isEnd
                    });
                    translatedScenario.nodes[nodeKey] = translatedNode;
                }
            } else if (s.messages) {
                for (let node of s.messages) {
                    const translatedNode = {
                        text: await translateText(node.text),
                        options: []
                    };
                    if (node.options) {
                        for (let opt of node.options) {
                            translatedNode.options.push({
                                text: await translateText(opt.text),
                                feedback: await translateText(opt.feedback),
                                nextId: opt.nextId,
                                points: opt.points
                            });
                            await delay(200);
                        }
                    }
                    Object.assign(translatedNode, {
                        id: node.id,
                        type: node.type,
                        isEnd: node.isEnd
                    });
                    translatedScenario.messages.push(translatedNode);
                }
            }

            if (s.type === 'sorting') {
                translatedScenario.categories = [];
                translatedScenario.items = [];
                if (s.categories) {
                    for (let c of s.categories) {
                        translatedScenario.categories.push({
                            ...c,
                            name: await translateText(c.name)
                        });
                        await delay(100);
                    }
                }
                if (s.items) {
                    for (let item of s.items) {
                        translatedScenario.items.push({
                            ...item,
                            text: await translateText(item.text)
                        });
                        await delay(100);
                    }
                }
            }
            
            result.scenarios[s._id] = translatedScenario;
        }

        // 3. Translate Advice
        console.log('Fetching advice...');
        const advRes = await fetch(`${API_BASE}/advice`);
        const advice = await advRes.json();
        console.log(`Found ${advice.length} advice items.`);

        for (let a of advice) {
            console.log(`Translating Advice: ${a.title}`);
            result.advice[a._id] = {
                title: await translateText(a.title),
                content: await translateHTML(a.content)
            };
            await delay(500);
        }

        // 4. Translate Diagnostics
        console.log('Fetching diagnostic questions...');
        const dRes = await fetch(`${API_BASE}/diagnostic/all-questions`);
        const diagnostics = await dRes.json();
        console.log(`Found ${diagnostics.length} questions.`);

        for (let d of diagnostics) {
            console.log(`Translating Diagnostic: ${d.text}`);
            
            // Translate options
            const translatedOptions = [];
            if (d.options) {
                for (let opt of d.options) {
                    translatedOptions.push(await translateText(opt));
                    await delay(100);
                }
            }

            result.diagnostics[d._id] = {
                text: await translateText(d.text),
                options: translatedOptions
            };
            await delay(300);
        }

        // Ensure the locales directory exists
        const localesDir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(localesDir)) {
            fs.mkdirSync(localesDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 4), 'utf-8');
        console.log(`\n✅ Translation complete! Saved to ${OUTPUT_PATH}`);
        
    } catch (err) {
        console.error('Error during translation:', err);
    }
}

run();
