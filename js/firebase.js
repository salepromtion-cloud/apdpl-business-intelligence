// ======================================================
// APDPL Business Intelligence
// Firebase Configuration
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence
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

// ------------------------------------------------------
// Authentication Persistence
// Explicitly configures Firebase Auth to persist the signed-in session
// in browser local storage, so users stay logged in across page
// refreshes, browser restarts, and future visits. This runs immediately
// after the auth instance is created; auth.js's onAuthStateChanged()
// listener is unaffected either way — if persistence setup fails, it
// simply logs the error and Firebase falls back to its default
// in-memory behaviour rather than breaking authentication.
// ------------------------------------------------------

(async function configureAuthPersistence(){

    try{

        await setPersistence(auth, browserLocalPersistence);

    }

    catch(error){

        console.error("Failed to configure Firebase Auth persistence:", error);

    }

})();

// Export
export {
    auth,
    provider
};