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
"https://script.google.com/macros/s/AKfycbwRZaI4MRLuDIc64YoUYI3xx8Q9OW2HUxIhTyUp0SpMD1cuB7y8k7iv_tskL2d1HnYSDQ/exec";

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

        const email = user.email;

        console.log(email);

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

        const currentUser = users.find(item => {

            return String(item.Email || "").trim().toLowerCase()
                === String(user.email || "").trim().toLowerCase();

        });

        if(!currentUser){

            await signOut(auth);

            showLoading(false);

            alert("Access Denied.\n\nYour email is not authorized.");

            return;

        }

        sessionStorage.setItem("user", JSON.stringify({

            name:user.displayName,
            email:user.email,
            photo:user.photoURL,
            role:currentUser.Role

        }));

        window.location.href="pages/dashboard.html";

    }

    catch(error){

        console.error(error);

        alert("Unable to verify user.");

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
