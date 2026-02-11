require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aws-learning-lab';

console.log('🔍 Testing MongoDB Atlas connection...');
console.log('📍 Connection string:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('✅ Connection test passed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed!');
    console.error('Error:', err.message);
    console.log('\n💡 Common fixes:');
    console.log('1. Check username/password in connection string');
    console.log('2. URL-encode special characters in password (@ = %40, : = %3A, etc.)');
    console.log('3. Verify network access in MongoDB Atlas');
    console.log('4. Ensure database user has read/write permissions');
    console.log('5. Check that cluster is running (not paused)');
    process.exit(1);
  });

