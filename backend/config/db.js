const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/stuvaradhi';

  const options = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30 seconds
  };

  try {
    console.log(`[MongoDB] Attempting connection to database...`);
    const conn = await mongoose.connect(primaryUri || localUri, options);
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection failed for primary URI (${error.message})`);
    
    // If primary URI (e.g., Atlas cluster) failed and is different from localUri, attempt local MongoDB fallback
    if (primaryUri && primaryUri !== localUri) {
      try {
        console.log(`[MongoDB] Attempting fallback connection to local MongoDB (${localUri})...`);
        const fallbackConn = await mongoose.connect(localUri, options);
        console.log(`[MongoDB] Connected to local fallback database: ${fallbackConn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`[MongoDB] Local fallback connection also failed: ${fallbackError.message}`);
      }
    }

    console.warn('\n⚠️ [MongoDB WARNING]: Could not establish a database connection.');
    console.warn('💡 Troubleshooting tips for MongoDB Atlas:');
    console.warn('   1. Ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP Address -> Allow Access from Anywhere 0.0.0.0/0 for dev).');
    console.warn('   2. Verify DB Username & Password in .env file.');
    console.warn('   3. Alternatively, start a local MongoDB instance on mongodb://127.0.0.1:27017/stuvaradhi\n');
  }
};

module.exports = connectDB;

