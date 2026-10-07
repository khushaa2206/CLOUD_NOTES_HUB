// 1) Paste YOUR Firebase web-app config here (Project settings > Your apps > Config)
const firebaseConfig = {
 apiKey: "AIzaSyCxkdNXqLBqfdsbX-ab635tHXkkWum6y2I",
  authDomain: "cloud-notes-hub-6e232.firebaseapp.com",
  projectId: "cloud-notes-hub-6e232",
  storageBucket: "cloud-notes-hub-6e232.firebasestorage.app",
  messagingSenderId: "232202943416",
  appId: "1:232202943416:web:a0d581730a3256a0512d4d",
};

// true  = files go to Firebase Storage (needs Storage enabled, may need Blaze plan)
// false = fallback: small files (<700 KB) are kept in Firestore instead (free Spark plan)
const USE_STORAGE = false;

const SUBJECTS = ["Cloud Computing", "Database Management", "Operating Systems",
  "Computer Networks", "Data Structures", "Software Engineering", "Mathematics", "Other"];

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = USE_STORAGE ? firebase.storage() : null;
