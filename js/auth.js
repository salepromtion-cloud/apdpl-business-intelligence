// ======================================================
// APDPL Business Intelligence
// Authentication Module
// ======================================================

import {
    auth,
    provider
} from "./firebase.js";

import {
    signInWithPopup,
    signOut
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
// Login Button
// ------------------------------------------------------

if(loginButton){

    loginButton.addEventListener("click", loginUser);

}

// ------------------------------------------------------
// Google Login
// ------------------------------------------------------

async function loginUser(){

    try{

        showLoading(true);

        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        await verifyUser(user);

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

            window.location.href="pages/dashboard.html";

        }

        else if(role === "salesman"){

            showLoading(false);

            window.location.href="pages/salesman.html";

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

}

// ------------------------------------------------------
// Loading
// ------------------------------------------------------

function showLoading(status){

    if(!loading) return;

    loading.classList.toggle("active",status);

}