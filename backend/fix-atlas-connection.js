require('dotenv').config();
const mongoose = require('mongoose');

// Helper function to URL encode password
function encodePassword(password) {
  return encodeURIComponent(password);
}

console.log('🔧 MongoDB Atlas Connection Fixer\n');
console.log('Current MONGODB_URI from .env:');
const uri = process.env.MONGODB_URI || '';
const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
console.log(maskedUri);
console.log('');

// Check if database name is included
if (!uri.includes('/aws-learning-lab')) {
  console.log('⚠️  WARNING: Database name "/aws-learning-lab" is missing!');
  console.log('   Your connection string should end with: /aws-learning-lab');
  console.log('');
}

// Check for common password encoding issues
const passwordMatch = uri.match(/:[^:@]+@/);
if (passwordMatch) {
  const password = passwordMatch[0].slice(1, -1);
  const hasSpecialChars = /[@:#\/\[\]?]/.test(password);
  
  if (hasSpecialChars) {
    console.log('⚠️  WARNING: Password contains special characters that may need encoding!');
    console.log('   Special characters in passwords must be URL-encoded:');
    console.log('   @ → %40');
    console.log('   : → %3A');
    console.log('   / → %2F');
    console.log('   # → %23');
    console.log('');
    console.log('   Your password:', password);
    console.log('   Encoded password:', encodePassword(password));
    console.log('');
  }
}

console.log('📝 Steps to fix:');
console.log('1. Go to MongoDB Atlas → Connect → Connect your application');
console.log('2. Copy the connection string');
console.log('3. Replace <password> with your actual password');
console.log('4. If password has special chars, URL-encode them');
console.log('5. Add /aws-learning-lab before the ? (or at end if no ?)');
console.log('');
console.log('Example format:');
console.log('mongodb+srv://username:encoded_password@cluster.mongodb.net/aws-learning-lab?retryWrites=true&w=majority');
console.log('');

// Try to connect
console.log('🔍 Testing connection...');
mongoose.connect(uri)
  .then(() => {
    console.log('✅ SUCCESS! Connection works!');
    console.log('✅ You can now run: npm run seed');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Connection failed:', err.message);
    console.log('');
    console.log('💡 Common fixes:');
    console.log('   1. Verify username/password in MongoDB Atlas → Database Access');
    console.log('   2. URL-encode special characters in password');
    console.log('   3. Add /aws-learning-lab database name');
    console.log('   4. Check Network Access in MongoDB Atlas (add your IP)');
    console.log('   5. Ensure database user has read/write permissions');
    process.exit(1);
  });

