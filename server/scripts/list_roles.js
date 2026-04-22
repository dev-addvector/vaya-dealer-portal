#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    const rows = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY cnt DESC`;
    if (!rows || rows.length === 0) {
      console.log('No role values found in users table.');
      return;
    }
    console.log('role\tcount');
    rows.forEach((r) => console.log(`${r.role}\t${r.cnt}`));
  } catch (err) {
    console.error('Error querying roles:', err.message || err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main();
