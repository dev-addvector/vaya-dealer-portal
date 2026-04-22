#!/usr/bin/env node
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    console.log('Testing Prisma login flow...\n');

    // Test 1: Find unique user (this was failing before)
    console.log('Test 1: Find user by email...');
    const user = await prisma.user.findUnique({
      where: { email: 'kapaasfurnishings@gmail.com' },
    });

    if (!user) {
      console.error('✗ User not found!');
      process.exitCode = 1;
      return;
    }

    console.log(`✓ Found user: ${user.name} (role: '${user.role}')`);
    console.log(`  ID: ${user.id}, Email: ${user.email}`);

    // Test 2: Verify role is string
    console.log('\nTest 2: Check role type...');
    console.log(`  Role type: ${typeof user.role} (value: '${user.role}')`);
    if (typeof user.role !== 'string') {
      console.error('✗ Role is not a string!');
      process.exitCode = 1;
      return;
    }
    console.log('✓ Role is correctly typed as string');

    // Test 3: Test role comparison (as code does)
    console.log('\nTest 3: Role comparison logic...');
    const ROLES = { ADMIN: 'admin', USER: 'user', SUBADMIN: 'subadmin' };
    const isUser = user.role === ROLES.USER;
    console.log(`  user.role === ROLES.USER: ${isUser}`);
    if (isUser) {
      console.log('✓ Role comparison works correctly');
    } else {
      console.error('✗ Role comparison failed!');
      process.exitCode = 1;
      return;
    }

    // Test 4: Test with admin user
    console.log('\nTest 4: Test admin user...');
    const admin = await prisma.user.findUnique({
      where: { email: 'saurabh@addvector.com' },
    });
    if (admin && admin.role === ROLES.ADMIN) {
      console.log(`✓ Admin user found: ${admin.name} (role: '${admin.role}')`);
    } else {
      console.error('✗ Admin user query failed!');
      process.exitCode = 1;
      return;
    }

    // Test 5: Query multiple users by role
    console.log('\nTest 5: Find users by role...');
    const allUsers = await prisma.user.findMany({
      where: { role: 'user' },
      select: { id: true, name: true, role: true },
      take: 3,
    });
    console.log(`✓ Found ${allUsers.length} user(s):`, allUsers.map(u => `${u.name}(${u.role})`).join(', '));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ All tests passed! Login should work now.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
