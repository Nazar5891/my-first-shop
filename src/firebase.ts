import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDFhw3i0Xa6_UeN7fjSMAHxS7kcfbQbuMo',
  authDomain: 'rokitne--yahmyrov.firebaseapp.com',
  projectId: 'rokitne--yahmyrov',
  storageBucket: 'rokitne--yahmyrov.firebasestorage.app',
  messagingSenderId: '582905785754',
  appId: '1:582905785754:web:a76b3d35c704aa5e125e23',
  measurementId: 'G-BQ5B18N7T2'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
