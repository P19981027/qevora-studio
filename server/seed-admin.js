const memberModel = require('./models/member');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nickname = process.env.ADMIN_NICKNAME || 'Admin';
  if (!email || !password) {
    console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('ADMIN_PASSWORD should be at least 10 characters.');
    process.exit(1);
  }
  const existing = memberModel.findByEmail(email);
  if (existing) {
    console.log('Admin email already exists:', email);
    return;
  }
  const result = await memberModel.create({ email, password, nickname, role: 'admin' });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  console.log('Admin created:', email);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
