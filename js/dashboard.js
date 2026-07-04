/* ==========================================================================
   APDPL BUSINESS INTELLIGENCE
   File: js/dashboard.js
   Purpose: Dashboard bootstrap — session guard, user info binding,
            topbar date, and logout handling.
   Notes:
     - No Google Sheets fetch here (handled later by api.js).
     - No placeholder data — all values come from sessionStorage.
     - Assumes firebase.js exports an initialized `auth` instance.
   ========================================================================== */

import { auth } from './firebase.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { fetchFromAppsScript } from './api.js';

/* --------------------------------------------------------------------------
   1. SESSION GUARD
   -------------------------------------------------------------------------- */

function getSession() {
  try {
    const rawSession = sessionStorage.getItem('user');

    if (!rawSession) {
      window.location.replace('../index.html');
      return null;
    }

    return JSON.parse(rawSession);
  } catch (error) {
    console.error('[dashboard.js] Failed to read session:', error);
    window.location.replace('../index.html');
    return null;
  }
}

/* --------------------------------------------------------------------------
   2. BIND USER INFO TO DOM
   -------------------------------------------------------------------------- */

function bindUserInfo(session) {
  try {
    const userNameEls = document.querySelectorAll('.user-name');
    const userRoleEls = document.querySelectorAll('.user-role');
    const userAvatarEls = document.querySelectorAll('.user-avatar');

    const name = session?.name || 'User';
    const role = session?.role || '';
    const photo = session?.photo || '';

    userNameEls.forEach((el) => {
      el.textContent = name;
    });

    userRoleEls.forEach((el) => {
      el.textContent = role;
    });

    userAvatarEls.forEach((el) => {
      if (el.tagName === 'IMG') {
        el.src = photo;
        el.alt = name;
      } else {
        el.style.backgroundImage = photo ? `url("${photo}")` : '';
      }
    });
  } catch (error) {
    console.error('[dashboard.js] Failed to bind user info:', error);
  }
}

/* --------------------------------------------------------------------------
   3. TOPBAR DATE
   -------------------------------------------------------------------------- */

function renderTopbarDate() {
  try {
    const topbarDateEl = document.getElementById('topbarDate');

    if (!topbarDateEl) {
      return;
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    topbarDateEl.textContent = formattedDate;
  } catch (error) {
    console.error('[dashboard.js] Failed to render topbar date:', error);
  }
}

/* --------------------------------------------------------------------------
   4. LOGOUT HANDLING
   -------------------------------------------------------------------------- */

async function handleLogout(event) {
  event.preventDefault();

  try {
    sessionStorage.removeItem('user');
    await signOut(auth);
  } catch (error) {
    console.error('[dashboard.js] Logout error:', error);
  } finally {
    window.location.replace('../index.html');
  }
}

function bindLogout() {
  try {
    const logoutLink = document.getElementById('logoutLink');

    if (!logoutLink) {
      return;
    }

    logoutLink.addEventListener('click', handleLogout);
  } catch (error) {
    console.error('[dashboard.js] Failed to bind logout handler:', error);
  }
}

/* --------------------------------------------------------------------------
   5. LOAD APP DATA
   -------------------------------------------------------------------------- */

async function loadAppData() {
  try {
    const appData = await fetchFromAppsScript();

    if (!appData) {
      console.error("Unable to load application data.");
      return;
    }

    console.log("Summary:", appData.summary.length);
    console.log("Salesman Snapshot:", appData.salesmanSnapshot.length);
    console.log("Unit Snapshot:", appData.unitSnapshot.length);
  } catch (error) {
    console.error('[dashboard.js] Failed to load app data:', error);
  }
}

/* --------------------------------------------------------------------------
   6. INIT
   -------------------------------------------------------------------------- */

function initDashboard() {
  const session = getSession();

  if (!session) {
    return;
  }

  bindUserInfo(session);
  renderTopbarDate();
  bindLogout();
  loadAppData();
}

document.addEventListener('DOMContentLoaded', initDashboard);