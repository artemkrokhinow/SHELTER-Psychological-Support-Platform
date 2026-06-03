import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/nika1')
  .then(async () => {
    const db = mongoose.connection.db;
    const advices = await db.collection('advices').find().toArray();
    console.log(`Found ${advices.length} advices in the database.`);
    if (advices.length > 0) {
        console.log(advices);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
