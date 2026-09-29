import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDI3389OBn52oivucQ-UGIde4xM8zMOaAc",
  authDomain: "contador-inho.firebaseapp.com",
  projectId: "contador-inho",
  storageBucket: "contador-inho.firebasestorage.app",
  messagingSenderId: "319322385788",
  appId: "1:319322385788:web:77c8f0092d62f1d1c048f9",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);