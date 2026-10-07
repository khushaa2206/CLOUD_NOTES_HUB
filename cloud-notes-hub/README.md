# Cloud Notes Hub
Student notes sharing site – HTML/CSS/JS + Firebase (Auth, Firestore, Storage).

Flow: Login/Register -> Dashboard -> Select Subject -> Upload / View notes -> Search -> Download -> Logout

1. Create a Firebase project and paste its config into `js/firebase-config.js`
2. Enable Authentication (Email/Password), Firestore, Storage
3. Paste `firestore.rules` and `storage.rules` into the Rules tabs
4. Run a local server in this folder:  `npx serve .`  (or VS Code "Live Server") and open the localhost URL

No npm install needed. Do not open the files by double-clicking – Firebase Auth needs http://localhost.
