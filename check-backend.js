#!/usr/bin/env node
const http = require('http');

async function checkBackend() {
  console.log('Checking backend connectivity...\n');

  const checkPort = (port) => {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}/api/health`, (res) => {
        resolve({ port, status: res.statusCode, online: res.statusCode < 500 });
      });
      req.on('error', () => {
        resolve({ port, status: null, online: false });
      });
      req.setTimeout(2000);
    });
  };

  const result = await checkPort(5000);

  console.log('Backend Server Status:');
  console.log(`  Port 5000: ${result.online ? '✓ RUNNING' : '✗ NOT RUNNING'}`);

  if (!result.online) {
    console.log('\n⚠️  Backend server is not running!');
    console.log('\nTo start the backend server, run:');
    console.log('  cd server');
    console.log('  npm run dev    (for development with hot-reload)');
    console.log('  npm start      (for production)');
    console.log('\nOr in the esbuild terminal:');
    console.log('  cd server && npm run dev');
  } else {
    console.log('\n✓ Backend is running and ready!');
  }

  console.log('\nFrontend Vite config:');
  console.log('  Port: 5173');
  console.log('  Proxy: /api → http://localhost:5000');
  console.log('\nMake sure both servers are running:');
  console.log('  1. Backend: npm run dev (in server/ folder)');
  console.log('  2. Frontend: npm run dev (in client/ folder)');
}

checkBackend();
