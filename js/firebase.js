// ======================================================
// APDPL Business Intelligence
// Firebase Configuration
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyApYWIHmXCSDCAtFpwp_jP4sxsHnL3K9x4",
    authDomain: "apdpl-business-intelligence.firebaseapp.com",
    projectId: "apdpl-business-intelligence",
    storageBucket: "apdpl-business-intelligence.firebasestorage.app",
    messagingSenderId: "449032461264",
    appId: "1:449032461264:web:81798c4a74b652d26177d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);

// Google Provider
const provider = new GoogleAuthProvider();

// Export
export {
    auth,
    provider
};