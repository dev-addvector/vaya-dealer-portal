#!/usr/bin/env node
const prisma = require('../src/config/database');

async function main() {
  try {
    console.log('Checking current table structure...\n');

    // Check what columns exist
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('role', 'role_temp')
    `;

    console.log('Current columns:', columns.map(c => `${c.COLUMN_NAME}(${c.COLUMN_TYPE})`).join(', '));

    // Clean up temp column if it exists
    try {
      await prisma.$executeRaw`ALTER TABLE users DROP COLUMN role_temp`;
      console.log('Dropped temp column');
    } catch (e) {
      // Column doesn't exist, which is fine
    }

    // Recreate role column from scratch
    console.log('\nRecreating role column...');
    try {
      await prisma.$executeRaw`ALTER TABLE users DROP COLUMN role`;
    } catch (e) {
      console.log('Note: role column doesn\'t exist yet');
    }

    // Create new role column with default
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'`;
    console.log('✓ role column created');

    // Now populate the correct values
    console.log('\nPopulating role values...');
    const updates = [
      { value: 'admin', emails: ['saurabh@addvector.com', 'jothikumar@dealer.com'] },
      { value: 'user', emails: ['kapaasfurnishings@gmail.com', 'homestoriespurchase@gmail.com', 'superuser@addvector.com', 'info@kashishfurnishing.com', 'bangalore@skipperfurnishings.com'] },
      { value: 'qr_admin', emails: ['vyjayanthi@vayahome.com', 'tarunpatadia8@gmail.com'] },
      { value: 'sub_admin', emails: ['satya@addvector.com', 'rajendra@vayahome.com', 'aditya.ms@vayahome.com', 'assist@oneupsales.in'] },
    ];

    for (const { value, emails } of updates) {
      for (const email of emails) {
        await prisma.$executeRaw`UPDATE users SET role = ${value} WHERE email = ${email}`;
      }
      console.log(`  Set ${emails.length} users to '${value}'`);
    }

    console.log('\nVerifying final state:');
    const final = await prisma.$queryRaw`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`;
    final.forEach((r) => console.log(`  role '${r.role}': ${r.cnt} users`));

    console.log('\n✓ Complete! Database is now ready for Prisma.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
