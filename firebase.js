import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD25ROvTzDiM8hBsa06PH0JDrwJwJFnI8o",
  authDomain: "quest-engine-6689a.firebaseapp.com",
  projectId: "quest-engine-6689a",
  storageBucket: "quest-engine-6689a.firebasestorage.app",
  messagingSenderId: "248827743777",
  appId: "1:248827743777:web:5136dffa70fd8d7f865d60"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
