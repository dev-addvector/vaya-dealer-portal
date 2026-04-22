#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    const distinct = await prisma.$queryRaw`SELECT DISTINCT role FROM users`;
    for (const r of distinct) {
      console.log('\n===== role:', r.role, '=====');
      const rows = await prisma.$queryRaw`SELECT id, name, email, role FROM users WHERE role = ${r.role} LIMIT 5`;
      if (!rows || rows.length === 0) {
        console.log('  (no sample users)');
        continue;
      }
      rows.forEach((u) => console.log(`  ${u.id}\t${u.name || ''}\t${u.email || ''}\trole=${u.role}`));
    }
  } catch (err) {
    console.error('Error querying samples:', err.message || err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main();
