import bcrypt from 'bcrypt';

const password = 'admin123';
const SALT_ROUNDS = 10;

bcrypt.hash(password, SALT_ROUNDS).then(hash => {
  console.log('\n=================================');
  console.log('Super Admin Password Hash Generated');
  console.log('=================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in your SQL INSERT statement.');
  console.log('=================================\n');
}).catch(err => {
  console.error('Error generating hash:', err);
});
