// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3v4TFdCxu_aFADmcCZNBqwZi17V4OtE0",
  authDomain: "fermata-platform-36432.firebaseapp.com",
  projectId: "fermata-platform-36432",
  storageBucket: "fermata-platform-36432.firebasestorage.app",
  messagingSenderId: "571135432891",
  appId: "1:571135432891:web:b7b030b47ac010f6bcf19e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Sign in function
function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => {
    console.error("Error during sign-in:", error);
  });
}

// Sign out function
function signOut() {
  auth.signOut().catch((error) => {
    console.error("Error during sign-out:", error);
  });
}

// Auth state change listener
auth.onAuthStateChanged((user) => {
  const dropdown = document.getElementById('userDropdown');
  const signin = document.getElementById('signinOption');
  const signout = document.getElementById('signoutOption');
  const info = document.getElementById('userInfo');
  const splash = document.getElementById('splashModal');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');

  if (user) {
    // hide splash and enable page
    if (splash) { splash.style.display = 'none'; document.body.classList.remove('modal-open'); }
    if (signin) signin.classList.add('hidden');
    if (signout) signout.classList.remove('hidden');
    if (info) {
      info.classList.remove('hidden');
      info.innerHTML = `<strong>${user.displayName}</strong><br><small>${user.email}</small>`;
    }
    if (userAvatar && user.photoURL) userAvatar.src = user.photoURL;
    if (userName) userName.textContent = user.displayName || 'Signed in';
  } else {
    // show splash modal and block page until user signs in
    if (splash) { splash.style.display = 'flex'; document.body.classList.add('modal-open'); }
    if (signin) signin.classList.remove('hidden');
    if (signout) signout.classList.add('hidden');
    if (info) info.classList.add('hidden');
    if (userAvatar) userAvatar.src = 'https://www.gravatar.com/avatar/?d=mp&s=64';
    if (userName) userName.textContent = 'Sign in';
    // optional: show a small notice if present elsewhere
    const notice = document.getElementById('authNotice');
    if (notice) setTimeout(() => { notice.style.display = 'block'; }, 1500);
  }
});

// DOM ready helpers for modal and dropdown interactions
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splashModal');
  const splashSignInBtn = document.getElementById('splashSignInBtn');
  const signinBtn = document.getElementById('signinOption');
  const signoutBtn = document.getElementById('signoutOption');
  const dropdownBtn = document.getElementById('userDropdownBtn');
  const userMenu = document.getElementById('userMenu');

  // wire the sign-in buttons to the same signIn() function
  if (splashSignInBtn) splashSignInBtn.addEventListener('click', (e) => { e.preventDefault(); signIn(); });
  if (signinBtn) signinBtn.addEventListener('click', (e) => { e.preventDefault(); signIn(); });
  if (signoutBtn) signoutBtn.addEventListener('click', (e) => { e.preventDefault(); signOut(); });

  // Toggle dropdown menu
  if (dropdownBtn && userMenu) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('hidden');
    });
  }

  // Click outside to close menu
  document.addEventListener('click', (e) => {
    if (userMenu && !userMenu.classList.contains('hidden')) {
      if (!e.target.closest('#userDropdown')) {
        userMenu.classList.add('hidden');
      }
    }
  });

  // Prevent Escape key from closing modal or leaving page until authenticated
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Escape' || e.key === 'Esc') && document.body.classList.contains('modal-open')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
});

