import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "bustling-airship-hv7sv",
  appId: "1:761519873849:web:f84e658e0f1cd8eac5d2e8",
  apiKey: "AIzaSyBNe2VABBfa2mLiI-bx8Ni4ChD2tJzDnTY",
  authDomain: "bustling-airship-hv7sv.firebaseapp.com",
  storageBucket: "bustling-airship-hv7sv.firebasestorage.app",
  messagingSenderId: "761519873849"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-kfcgexerfit-5e552e02-3201-4286-ac83-8063dee3ccb9");
export const auth = getAuth(app);
