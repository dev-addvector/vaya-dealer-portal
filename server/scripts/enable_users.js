#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    console.log('Checking account status...\n');

    // Check distribution
    const distribution = await prisma.$queryRaw`
      SELECT is_status, COUNT(*) as cnt FROM users GROUP BY is_status ORDER BY is_status
    `;
    console.log('Current status distribution:');
    distribution.forEach((r) => {
      const status = r.is_status === 1 ? 'ENABLED' : 'DISABLED';
      console.log(`  ${status} (is_status=${r.is_status}): ${r.cnt} users`);
    });

    // Show a sample of disabled users
    console.log('\nSample disabled users:');
    const disabled = await prisma.$queryRaw`
      SELECT id, name, email, is_status FROM users WHERE is_status = 0 LIMIT 5
    `;
    disabled.forEach((u) => {
      console.log(`  ID ${u.id}: ${u.name} (${u.email})`);
    });

    // Fix: Enable all disabled users (set is_status = 1)
    console.log('\nEnabling all disabled users...');
    const result = await prisma.$executeRaw`UPDATE users SET is_status = 1 WHERE is_status = 0`;
    console.log(`✓ Updated ${result} users to enabled status`);

    // Verify fix
    console.log('\nAfter fix:');
    const after = await prisma.$queryRaw`
      SELECT is_status, COUNT(*) as cnt FROM users GROUP BY is_status ORDER BY is_status
    `;
    after.forEach((r) => {
      const status = r.is_status === 1 ? 'ENABLED' : 'DISABLED';
      console.log(`  ${status} (is_status=${r.is_status}): ${r.cnt} users`);
    });

    // Also update database column default to match Prisma
    console.log('\nUpdating database column default...');
    try {
      await prisma.$executeRaw`ALTER TABLE users MODIFY COLUMN is_status INT DEFAULT 1`;
      console.log('✓ Database column default updated to 1');
    } catch (err) {
      console.log('Note: Could not update column default (may already be correct)');
    }

    console.log('\n✓ All users are now enabled. Login should work!');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
