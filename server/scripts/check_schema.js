#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    console.log('Checking users table schema...\n');

    // Get column info
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `;

    console.log('Table structure (role-related columns):');
    columns
      .filter((c) => c.COLUMN_NAME.toLowerCase().includes('role'))
      .forEach((c) => {
        console.log(`  ${c.COLUMN_NAME}: ${c.COLUMN_TYPE}, nullable=${c.IS_NULLABLE}, default=${c.COLUMN_DEFAULT}`);
      });

    // Show actual role data
    console.log('\nCurrent role data in users table:');
    const roles = await prisma.$queryRaw`
      SELECT DISTINCT role, COUNT(*) as cnt, GROUP_CONCAT(DISTINCT email LIMIT 3) as samples
      FROM users
      GROUP BY role
      ORDER BY role
    `;
    roles.forEach((r) => {
      console.log(`  role: ${r.role} (${r.cnt} users) - samples: ${r.samples}`);
    });
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
