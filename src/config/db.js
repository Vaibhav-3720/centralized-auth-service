const mongoose = require('mongoose');

/**
 * Establishes connection to the MongoDB database.
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auth-microservice';
    const conn = await mongoose.connect(mongoURI);
    console.log(`[Database] MongoDB Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
