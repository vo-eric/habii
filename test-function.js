#!/usr/bin/env node

/**
 * Test script to call the testDegradeCreatureStats function with Firebase Auth
 *
 * Usage:
 *   1. Log in to your web app to get a token
 *   2. Copy the token from browser dev tools (Application -> Local Storage -> firebase:authUser)
 *   3. Run: node test-function.js YOUR_TOKEN_HERE
 *
 * Alternative: Use this script which will get the token automatically
 */

const https = require('https');

const FUNCTION_URL =
  'https://us-central1-habii-235d1.cloudfunctions.net/testDegradeCreatureStats';

async function callTestFunction(token) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const req = https.request(FUNCTION_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response:`, JSON.parse(data));
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.end();
  });
}

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-function.js YOUR_FIREBASE_TOKEN');
  console.log('');
  console.log('To get your token:');
  console.log('1. Log in to your web app');
  console.log('2. Open browser dev tools');
  console.log('3. Go to Application -> Local Storage');
  console.log('4. Find the firebase:authUser entry');
  console.log('5. Copy the "stsTokenManager.accessToken" value');
  process.exit(1);
}

callTestFunction(token)
  .then(() => {
    console.log('Function call completed successfully!');
  })
  .catch((error) => {
    console.error('Function call failed:', error);
    process.exit(1);
  });
