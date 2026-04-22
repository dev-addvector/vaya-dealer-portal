#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    console.log('Fixing role value mismatch (sub_admin → subadmin)...\n');

    console.log('Before:');
    const before = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`;
    before.forEach((r) => console.log(`  '${r.role}': ${r.cnt}`));

    // Fix: sub_admin → subadmin (to match code constants)
    await prisma.$executeRaw`UPDATE users SET role = 'subadmin' WHERE role = 'sub_admin'`;
    console.log('\nConverted sub_admin → subadmin');

    console.log('\nAfter:');
    const after = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`;
    after.forEach((r) => console.log(`  '${r.role}': ${r.cnt}`));

    console.log('\n✓ Complete! Roles now match code expectations.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
