#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    console.log('Restoring original INT role values from backup data...\n');

    // Map from the SQL backup dump - these are the original values
    const roleMap = {
      'saurabh@addvector.com': 1,
      'jothikumar@dealer.com': 1,
      'kapaasfurnishings@gmail.com': 2,
      'homestoriespurchase@gmail.com': 2,
      'superuser@addvector.com': 2,
      'info@kashishfurnishing.com': 2,
      'bangalore@skipperfurnishings.com': 2,
      'vyjayanthi@vayahome.com': 3,
      'tarunpatadia8@gmail.com': 3,
      'satya@addvector.com': 4,
      'rajendra@vayahome.com': 4,
      'aditya.ms@vayahome.com': 4,
      'assist@oneupsales.in': 4,
    };

    console.log('Restoring known users...');
    for (const [email, role] of Object.entries(roleMap)) {
      await prisma.$executeRaw`UPDATE users SET role = ${role} WHERE email = ${email}`;
      console.log(`  ${email} → ${role}`);
    }

    // Set all remaining with 0 to default 2 (user)
    const remaining = await prisma.$executeRaw`UPDATE users SET role = 2 WHERE role = 0`;
    console.log(`\n  Reset ${remaining} corrupted users to role 2 (user)`);

    console.log('\nVerifying restore:');
    const after = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`;
    after.forEach((r) => console.log(`  role ${r.role}: ${r.cnt} users`));

    console.log('\n✓ Restore complete!');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
