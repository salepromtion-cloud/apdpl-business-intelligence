// ======================================================
// APDPL Business Intelligence
// Authentication Module
// ======================================================
//
// Architecture:
// Firebase Authentication (onAuthStateChanged) is the SINGLE source of
// truth for auth state. It is the only controller that shows/hides the
// loading screen, calls verifyUser(), and drives redirects.
//
// loginUser() only triggers the Google sign-in popup. It never verifies
// the user and never redirects — once signInWithPopup() succeeds,
// Firebase updates its internal auth state, onAuthStateChanged() fires,
// and that single listener takes it from there.
// ======================================================

import {
    auth,
    provider
} from "./firebase.js";

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// ------------------------------------------------------
// Configuration
// ------------------------------------------------------

const API_URL =
"https://script.google.com/macros/s/AKfycbyjrb4mhxvuY2LK_rsgKAoZnC2Th9OFOglCpKmoMDH0mx9ASt2Y5YT05M_RZ_CfCcZltw/exec";

// ------------------------------------------------------
// Elements
// ------------------------------------------------------

const loginButton = document.getElementById("googleLogin");
const loading = document.getElementById("loading");

// ------------------------------------------------------
// Verification Guard
// Lightweight production-safe flag to prevent verifyUser() from running
// more than once concurrently (e.g. rapid auth-state re-fires).
// ------------------------------------------------------

let isVerifying = false;

// ------------------------------------------------------
// Login Button
// Only starts the Google popup. Verification and redirects are handled
// exclusively by onAuthStateChanged() below, so this stays a single,
// side-effect-free entry point with no duplicate listeners.
// ------------------------------------------------------

if(loginButton){

    loginButton.addEventListener("click", loginUser);

}

// ------------------------------------------------------
// Authentication Controller (single source of truth)
// Fires on initial page load with the current auth state, and again on
// every future sign-in / sign-out. This is the ONLY place that shows or
// hides the loading screen, calls verifyUser(), or redirects — so there
// is exactly one verification path for both returning and first-time
// users, with no duplicate logic and no state flags required.
// ------------------------------------------------------

onAuthStateChanged(auth, (user) => {

    if(user){

        // Authenticated (returning session or fresh popup login alike) —
        // show the loading screen and verify against the salesman sheet.
        showLoading(true);

        verifyUser(user);

    }

    else{

        // No authenticated user — show the login button, hide loading.
        showLoading(false);

    }

});

// ------------------------------------------------------
// Google Login
// Only opens the sign-in popup and surfaces popup errors. Does NOT call
// verifyUser() and does NOT redirect — onAuthStateChanged() handles the
// rest once Firebase reports the new signed-in user.
// ------------------------------------------------------

async function loginUser(){

    try{

        showLoading(true);

        await signInWithPopup(auth, provider);

    }

    catch(error){

        console.error(error);

        alert(error.message);

        showLoading(false);

    }

}

// ------------------------------------------------------
// Verify User
// ------------------------------------------------------

async function verifyUser(user){

    // Guard against duplicate/concurrent verification runs.
    if(isVerifying){

        return;

    }

    isVerifying = true;

    try{

        const response = await fetch(API_URL);

        const data = await response.json();

        const users = data.salesmanSnapshot || [];

        // Match logged-in email against the snapshot (case-insensitive)
        const currentUser = users.find(item => {

            return String(item.Email || "").trim().toLowerCase()
                === String(user.email || "").trim().toLowerCase();

        });

        if(!currentUser){

            await signOut(auth);

            showLoading(false);

            alert("Your Google account is not authorized to access APDPL Business Intelligence.\n\nPlease contact the Aravindan(8971422339).");

            return;

        }

        // Clear any previous session before saving the new one
        sessionStorage.removeItem("user");

        // Build the complete session object using exact sheet column names
        sessionStorage.setItem("user", JSON.stringify({

            name:user.displayName,
            email:user.email,
            photo:user.photoURL,
            role:currentUser.Role,

            distCode:currentUser.DistCode,
            distName:currentUser.DistName,
            salesmanCode:currentUser.SalesmanCode,
            salesmanName:currentUser.SalesmanName,

            targetPharma:Number(currentUser.TargetPharma || 0),
            targetPI:Number(currentUser.TargetPI || 0),
            targetZenvito:Number(currentUser.TargetZenvito || 0),

            achievementPharma:Number(currentUser.AchievementPharma || 0),
            achievementPI:Number(currentUser.AchievementPI || 0),
            achievementZenvito:Number(currentUser.AchievementZenvito || 0),

            // Percent fields remain strings
            achievementPercentPharma:currentUser.AchievementPercentPharma,
            achievementPercentPI:currentUser.AchievementPercentPI,
            achievementPercentZenvito:currentUser.AchievementPercentZenvito,

            uobPharma:Number(currentUser.UOBPharma || 0),
            uobPI:Number(currentUser.UOBPI || 0),
            uobZenvito:Number(currentUser.UOBZenvito || 0),

            newUobPharma:Number(currentUser.NewUOBPharma || 0),
            newUobPI:Number(currentUser.NewUOBPI || 0),
            newUobZenvito:Number(currentUser.NewUOBZenvito || 0)

        }));

        // Route based on role
        const role = String(currentUser.Role || "").trim().toLowerCase();

        if(role === "admin"){

            showLoading(false);

            window.location.replace("pages/dashboard.html");

        }

        else if(role === "salesman"){

            showLoading(false);

            window.location.replace("pages/salesman.html");

        }

        else{

            await signOut(auth);

            sessionStorage.removeItem("user");

            showLoading(false);

            alert("Your account role is not configured.");

        }

    }

    catch(error){

        console.error(error);

        alert("Unable to verify user.Contact the Aravindan(8971422339) for assistance.");

        showLoading(false);

    }

    finally{

        isVerifying = false;

    }

}

// ------------------------------------------------------
// Loading
// ------------------------------------------------------

function showLoading(status){

    if(!loading) return;

    loading.classList.toggle("active",status);

}