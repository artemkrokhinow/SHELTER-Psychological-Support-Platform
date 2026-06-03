import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/shelter_db')
  .then(async () => {
    const db = mongoose.connection.db;
    const materials = await db.collection('materials').find().toArray();
    console.log(`Found ${materials.length} materials.`);
    const types = materials.map(m => m.type);
    console.log("Types present:", [...new Set(types)]);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
