import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

async function translateText(text) {
    if (!text || text.trim() === '') return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0].map(item => item[0]).join('');
    } catch (err) {
        console.error("Translation error:", err);
        return text; 
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    await mongoose.connect('mongodb+srv://useruser:IlfXW3TQLASjLZv8@clustern.reruo2j.mongodb.net/shelter_db?retryWrites=true&w=majority');
    console.log("Connected to DB");
    
    // We don't even need the mongoose model, just use native MongoDB driver connection
    const questions = await mongoose.connection.db.collection('questions').find({}).toArray();
    console.log(`Found ${questions.length} questions`);

    const dbPath = path.join(process.cwd(), '../my-app/src/locales/db_en.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    if (!db.questions) db.questions = {};

    for (let q of questions) {
        console.log(`Translating: ${q.text}`);
        const translatedQ = {
            text: await translateText(q.text),
            options: []
        };
        for (let opt of q.options) {
            translatedQ.options.push(await translateText(opt));
            await delay(200);
        }
        db.questions[q._id.toString()] = translatedQ;
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));
    console.log("Updated db_en.json successfully!");
    process.exit(0);
}

run().catch(console.error);
