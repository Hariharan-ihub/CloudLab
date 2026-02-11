// Quick password encoder tool
// Usage: node encode-password.js YOUR_PASSWORD

const password = process.argv[2];

if (!password) {
  console.log('Usage: node encode-password.js YOUR_PASSWORD');
  console.log('');
  console.log('Example:');
  console.log('  node encode-password.js myP@ss:123');
  console.log('  Output: myP%40ss%3A123');
  process.exit(1);
}

const encoded = encodeURIComponent(password);
console.log('');
console.log('Original password:', password);
console.log('Encoded password: ', encoded);
console.log('');
console.log('Use this in your MONGODB_URI:');
console.log(`mongodb+srv://hariselvan545_db_user:${encoded}@cluster0.ywq1q4h.mongodb.net/aws-learning-lab`);
console.log('');

