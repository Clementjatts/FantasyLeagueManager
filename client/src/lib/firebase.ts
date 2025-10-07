import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required env vars early with a clear error to avoid Firebase auth/invalid-api-key
const missing = Object.entries(env)
  .filter(([, v]) => !v || String(v).trim().length === 0)
  .map(([k]) => k);

if (missing.length > 0) {
  // Throwing here surfaces a concise message in dev overlay
  throw new Error(
    `Missing Firebase env vars: ${missing.join(", ")}. Ensure .env.local contains VITE_FIREBASE_* values and restart the dev server.`
  );
}

const firebaseConfig = env as {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Helpful dev log to confirm Vite envs are actually loaded
if (import.meta.env.DEV) {
  // Do not log secrets
  // eslint-disable-next-line no-console
  console.log("[Firebase] Loaded config:", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
  });
}


