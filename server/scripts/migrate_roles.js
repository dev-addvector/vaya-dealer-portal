#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    console.log('Starting role migration (raw SQL)...\n');

    // Get counts before
    console.log('Before migration:');
    const before = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY CAST(role AS UNSIGNED)`;
    before.forEach((r) => console.log(`  role ${r.role}: ${r.cnt} users`));

    // Migrate using raw SQL (update INT to STRING values)
    console.log('\nMigrating roles...');
    const roleUpdates = [
      { from: 1, to: 'admin' },
      { from: 2, to: 'user' },
      { from: 3, to: 'qr_admin' },
      { from: 4, to: 'sub_admin' },
    ];

    for (const { from, to } of roleUpdates) {
      const result = await prisma.$executeRaw`UPDATE users SET role = ${to} WHERE CAST(role AS UNSIGNED) = ${from}`;
      console.log(`  role ${from} → '${to}': ${result} users updated`);
    }

    // Verify after
    console.log('\nAfter migration:');
    const after = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`;
    after.forEach((r) => console.log(`  role '${r.role}': ${r.cnt} users`));

    console.log('\n✓ Migration complete!');
  } catch (err) {
    console.error('Migration error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
