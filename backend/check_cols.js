import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/shelter_db')
  .then(async () => {
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log("Collections:", cols.map(c => c.name));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
