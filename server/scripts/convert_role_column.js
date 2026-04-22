#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    console.log('Converting role column INT → VARCHAR and updating values...\n');

    console.log('Before conversion:');
    const before = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`;
    before.forEach((r) => console.log(`  role ${r.role}: ${r.cnt} users`));

    // Step 1: Add new column as VARCHAR
    console.log('\nStep 1: Creating temporary VARCHAR column...');
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN role_temp VARCHAR(50)`;
      console.log('  ✓ Temporary column created');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  ℹ Temporary column already exists, skipping');
      } else {
        throw err;
      }
    }

    // Step 2: Copy and convert INT values to STRING
    console.log('\nStep 2: Converting values INT → STRING...');
    await prisma.$executeRaw`
      UPDATE users SET role_temp = CASE
        WHEN role = 1 THEN 'admin'
        WHEN role = 2 THEN 'user'
        WHEN role = 3 THEN 'qr_admin'
        WHEN role = 4 THEN 'sub_admin'
        ELSE 'user'
      END
    `;
    console.log('  ✓ Values converted');

    // Step 3: Drop old INT column and rename
    console.log('\nStep 3: Swapping columns...');
    try {
      await prisma.$executeRaw`ALTER TABLE users DROP COLUMN role`;
      await prisma.$executeRaw`ALTER TABLE users CHANGE COLUMN role_temp role VARCHAR(50)`;
      console.log('  ✓ Column renamed to role');
    } catch (err) {
      console.log('  Note:', err.message);
    }

    // Verify
    console.log('\nAfter conversion:');
    const after = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`;
    after.forEach((r) => console.log(`  role '${r.role}': ${r.cnt} users`));

    console.log('\n✓ Conversion complete! Prisma schema is ready.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
