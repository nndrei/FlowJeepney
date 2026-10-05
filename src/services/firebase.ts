import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBgmaSro-33RDAqypWh6YCl6qvXFnAmqYg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "flowjeep-bf08a.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "flowjeep-bf08a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "flowjeep-bf08a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "432938113067",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:432938113067:web:flowjeep01"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
