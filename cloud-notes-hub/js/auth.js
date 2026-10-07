const $ = id => document.getElementById(id);
let mode = 'login', busy = false;

function setMode(m) {
  mode = m;
  $('tLogin').className = m === 'login' ? 'on' : '';
  $('tReg').className = m === 'register' ? 'on' : '';
  $('nameRow').hidden = m === 'login';
  $('go').textContent = m === 'login' ? 'Log in' : 'Create account';
  $('msg').textContent = '';
}
$('tLogin').onclick = () => setMode('login');
$('tReg').onclick = () => setMode('register');

// Already signed in -> go straight to dashboard
auth.onAuthStateChanged(u => { if (u && !busy) location.href = 'dashboard.html'; });

$('form').onsubmit = async e => {
  e.preventDefault();
  busy = true; $('go').disabled = true; $('msg').className = 'msg'; $('msg').textContent = '';
  const email = $('email').value.trim(), pass = $('pass').value;
  try {
    if (mode === 'register') {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: $('name').value.trim() || email.split('@')[0] });
    } else {
      await auth.signInWithEmailAndPassword(email, pass);
    }
    location.href = 'dashboard.html';
  } catch (err) {
    busy = false; $('go').disabled = false;
    const map = {
      'auth/invalid-credential': 'Wrong email or password.',
      'auth/email-already-in-use': 'This email is already registered. Log in instead.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/operation-not-allowed': 'Email/Password sign-in is not enabled in Firebase Console.',
      'auth/invalid-api-key': 'Firebase config is missing. Paste your keys in js/firebase-config.js.'
    };
    $('msg').className = 'msg err';
    $('msg').textContent = map[err.code] || err.message;
  }
};
