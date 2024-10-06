require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

const uri = process.env.MONGODB_URI;
console.log('Attempting to connect with URI:', uri);

// DNS lookup
dns.lookup('cpc.f6i1t.mongodb.net', (err, address, family) => {
  if (err) {
    console.error('DNS lookup failed:', err);
  } else {
    console.log('DNS lookup successful. IP:', address);
  }
});

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB Atlas:', err);
  });
