import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/shelter_db')
  .then(async () => {
    const db = mongoose.connection.db;
    const advices = await db.collection('advices').find().toArray();
    console.log(`Found ${advices.length} advices in the database 'shelter_db'.`);
    if (advices.length > 0) {
        console.log(advices);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
