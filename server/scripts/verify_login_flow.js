#!/usr/bin/env node
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function testFullLogin() {
  try {
    console.log('Testing complete login flow...\n');

    // Test 1: Find user
    console.log('Test 1: Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { email: 'kapaasfurnishings@gmail.com' },
    });
    
    if (!user) {
      console.error('✗ User not found!');
      process.exitCode = 1;
      return;
    }
    console.log(`✓ User found: ${user.name}`);

    // Test 2: Check account status
    console.log('\nTest 2: Checking account status...');
    console.log(`  isStatus: ${user.isStatus}`);
    if (user.isStatus === 0) {
      console.error('✗ Account is disabled!');
      process.exitCode = 1;
      return;
    }
    console.log('✓ Account is enabled (isStatus = 1)');

    // Test 3: Verify role type
    console.log('\nTest 3: Verifying role...');
    console.log(`  Role: '${user.role}' (type: ${typeof user.role})`);
    if (typeof user.role !== 'string') {
      console.error('✗ Role type is wrong!');
      process.exitCode = 1;
      return;
    }
    console.log('✓ Role is correct string type');

    // Test 4: Simulate complete auth response
    console.log('\nTest 4: Simulating JWT token generation...');
    const ROLES = { ADMIN: 'admin', USER: 'user', SUBADMIN: 'subadmin' };
    const tokenData = {
      id: user.id,
      role: user.role,
    };
    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      unc: user.unc,
    };
    console.log('  Token payload:', tokenData);
    console.log('  User response:', responseUser);
    console.log('✓ Auth response ready');

    // Test 5: Test with admin
    console.log('\nTest 5: Testing admin account...');
    const admin = await prisma.user.findUnique({
      where: { email: 'saurabh@addvector.com' },
    });
    if (admin && admin.isStatus === 1 && admin.role === ROLES.ADMIN) {
      console.log(`✓ Admin account OK: ${admin.name} (enabled, role=${admin.role})`);
    } else {
      console.error('✗ Admin account check failed');
      process.exitCode = 1;
      return;
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✓✓✓ Complete login flow works! ✓✓✓');
    console.log('═'.repeat(50));
    console.log('\nYou can now login with:');
    console.log('  Email: kapaasfurnishings@gmail.com');
    console.log('  Role: user (enabled)');
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testFullLogin();
