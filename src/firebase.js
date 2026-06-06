/**
 * firebase.js — Firebase app initialisation
 *
 * Reads credentials from Vite env vars (VITE_FIREBASE_*).
 * If the API key is not set (i.e. .env not filled in yet),
 * the app runs in OFFLINE / LOCAL-STATE mode — every existing
 * feature still works exactly as before, no errors are thrown.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ── Read config from Vite environment ──────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ── Check if config is actually provided ───────────────────────
export const isFirebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// ── Initialise only when credentials are present ───────────────
let db = null;

if (isFirebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.info('[CreditRisk AI] Firebase connected ✅ — contact events will be persisted to Firestore.');
  } catch (err) {
    console.warn('[CreditRisk AI] Firebase init failed — running in local-state mode.', err.message);
  }
} else {
  console.info(
    '[CreditRisk AI] Firebase not configured — running in local-state mode.\n' +
    'Fill in .env with your Firebase credentials to enable Firestore persistence.'
  );
}

export { db };
