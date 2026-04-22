#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    console.log('Restoring roles from known backup data...\n');

    // Map from the SQL backup: email → correct role value
    const restoredRoles = {
      'saurabh@addvector.com': 'admin',
      'jothikumar@dealer.com': 'admin',
      'kapaasfurnishings@gmail.com': 'user',
      'homestoriespurchase@gmail.com': 'user',
      'superuser@addvector.com': 'user',
      'info@kashishfurnishing.com': 'user',
      'vyjayanthi@vayahome.com': 'qr_admin',
      'tarunpatadia8@gmail.com': 'qr_admin',
      'satya@addvector.com': 'sub_admin',
      'rajendra@vayahome.com': 'sub_admin',
      'aditya.ms@vayahome.com': 'sub_admin',
      'assist@oneupsales.in': 'sub_admin',
      // All other emails are 'user' (majority)
    };

    console.log('Restoring sample key users...');
    for (const [email, role] of Object.entries(restoredRoles)) {
      await prisma.$executeRaw`UPDATE users SET role = ${role} WHERE email = ${email}`;
      console.log(`  ${email} → '${role}'`);
    }

    // Set all remaining users with role 0 or NULL to 'user' (default)
    const remaining = await prisma.$executeRaw`UPDATE users SET role = 'user' WHERE role = '0' OR role IS NULL OR role = ''`;
    console.log(`\n  Set remaining ${remaining} users to 'user' (default)`);

    console.log('\nVerifying migration:');
    const after = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`;
    after.forEach((r) => console.log(`  role '${r.role}': ${r.cnt} users`));

    console.log('\n✓ Restoration complete!');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
