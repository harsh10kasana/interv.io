// 1. Import the specific modular functions
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// 2. Import your secret key
const serviceAccount = require('../serviceAccountKey.json');

// 3. Initialize the app using the cert function directly
const app = initializeApp({
  credential: cert(serviceAccount)
});

console.log("Firebase Admin Initialized Successfully!");

// 4. Extract the Auth service and export ONLY the auth service
const auth = getAuth(app);
module.exports = auth;