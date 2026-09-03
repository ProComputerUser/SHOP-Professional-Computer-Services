import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPurK0AxRvvEy4JTrwCkU9k9m_labc7KU",
  authDomain: "gen-lang-client-0574277933.firebaseapp.com",
  projectId: "gen-lang-client-0574277933",
  storageBucket: "gen-lang-client-0574277933.firebasestorage.app",
  messagingSenderId: "679719217832",
  appId: "1:679719217832:web:29a9a0b23c156a593f709d"
};

const databaseId = "ai-studio-shopprofessional-514b49a4-c5f5-4fe2-9b79-ff663d89cf6f";

async function main() {
  console.log("Initializing Firebase Setup Script for customer@procomputer.ie...");
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app, databaseId);

  const email = "customer@procomputer.ie";
  const password = "Password";
  const fullName = "Test Enterprise Client";
  const role = "customer";

  let uid = "";

  try {
    // 1. Attempt to create user credentials
    console.log("Attempting to create Auth credentials...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    uid = userCredential.user.uid;
    console.log(`Successfully created new auth account. UID: ${uid}`);
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      console.log("Auth account already exists. Retrieving existing user's UID via sign-in...");
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        console.log(`Successfully logged in. UID: ${uid}`);
      } catch (loginErr: any) {
        console.error("Failed to sign-in to existing account. Password might be different?", loginErr.message);
        process.exit(1);
      }
    } else {
      console.error("Fatal Error during Auth creation:", err.message);
      process.exit(1);
    }
  }

  // 2. Bind precisely to Firestore users collection
  if (uid) {
    try {
      console.log(`Writing user document in Firestore 'users/${uid}' ...`);
      const userProfile = {
        uid: uid,
        fullName: fullName,
        email: email,
        role: role,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", uid), userProfile, { merge: true });
      console.log("==========================================");
      console.log("SUCCESS: Setup complete!");
      console.log(`Account Email: ${email}`);
      console.log(`Account Password: ${password}`);
      console.log(`Full Name: ${fullName}`);
      console.log(`Assigned Role: ${role}`);
      console.log("==========================================");
      process.exit(0);
    } catch (firestoreErr: any) {
      console.error("Fatal Error during Firestore database write:", firestoreErr.message);
      process.exit(1);
    }
  }
}

main();
